import { Router } from 'express';
import Product, { PRODUCT_CATEGORIES } from '../models/Product.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, HttpError, escapeRegex, isDataImage, round2, toNumber } from '../utils/asyncHandler.js';
import { generateUniqueSku } from '../utils/sku.js';
import { notify, notifyStockLevel } from '../utils/notify.js';

const router = Router();
router.use(protect);

function parseProductBody(body = {}, { partial = false, defaults = {} } = {}) {
  const errors = {};
  const out = {};
  const has = (k) => body[k] !== undefined;

  if (!partial || has('name')) {
    out.name = String(body.name || '').trim();
    if (out.name.length < 2) errors.name = 'Enter a product name';
  }
  if (!partial || has('category')) {
    out.category = String(body.category || '').trim();
    if (!out.category) errors.category = 'Choose a category';
  }
  if (!partial || has('price')) {
    out.price = round2(toNumber(body.price, NaN));
    if (!Number.isFinite(out.price) || out.price < 0) errors.price = 'Enter a valid price';
  }
  if (has('cost') || !partial) {
    out.cost = round2(toNumber(body.cost, 0));
    if (out.cost < 0) errors.cost = 'Cost cannot be negative';
  }
  if (has('stock') || !partial) {
    out.stock = Math.round(toNumber(body.stock, 0));
    if (out.stock < 0) errors.stock = 'Stock cannot be negative';
  }
  if (has('lowStockThreshold') || !partial) {
    out.lowStockThreshold = Math.max(0, Math.round(toNumber(body.lowStockThreshold, defaults.lowStockThreshold ?? 10)));
  }
  if (has('status')) {
    if (!['active', 'draft', 'archived'].includes(body.status)) errors.status = 'Invalid status';
    else out.status = body.status;
  }
  for (const k of ['description', 'supplier']) if (has(k)) out[k] = String(body[k] || '').trim();
  if (has('tags')) {
    const tags = Array.isArray(body.tags) ? body.tags : String(body.tags || '').split(',');
    out.tags = [...new Set(tags.map((t) => String(t).trim()).filter(Boolean))].slice(0, 8);
  }
  if (has('image')) {
    if (body.image && !isDataImage(body.image)) errors.image = 'Upload a PNG, JPG or WebP image';
    else if (body.image && body.image.length > 1_000_000) errors.image = 'Image is too large';
    else out.image = body.image || '';
  }
  if (has('sku')) out.sku = String(body.sku || '').trim().toUpperCase().replace(/\s+/g, '-');

  if (Object.keys(errors).length) throw new HttpError(400, 'Please check the highlighted fields.', errors);
  return out;
}

// GET /api/products/meta -> categories + suggestions
router.get(
  '/meta',
  asyncHandler(async (req, res) => {
    const used = await Product.distinct('category', { owner: req.user._id });
    const categories = [...new Set([...PRODUCT_CATEGORIES, ...used])];
    res.json({ categories });
  })
);

// GET /api/products/sku?name=&category=  -> preview an auto-generated SKU
router.get(
  '/sku',
  asyncHandler(async (req, res) => {
    const sku = await generateUniqueSku(req.user._id, {
      prefix: req.user.preferences?.skuPrefix || 'NV',
      category: req.query.category || '',
      name: req.query.name || '',
    });
    res.json({ sku });
  })
);

// GET /api/products
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search = '', category = '', status = '', stock = '' } = req.query;
    const filter = { owner: req.user._id };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search.trim()) {
      const re = { $regex: escapeRegex(search.trim()), $options: 'i' };
      filter.$or = [{ name: re }, { sku: re }, { category: re }, { supplier: re }];
    }
    let products = await Product.find(filter).sort({ createdAt: -1 });
    if (stock === 'low') products = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold);
    if (stock === 'out') products = products.filter((p) => p.stock <= 0);
    if (stock === 'in') products = products.filter((p) => p.stock > p.lowStockThreshold);

    const all = await Product.find({ owner: req.user._id }).select('price cost stock lowStockThreshold status');
    const summary = all.reduce(
      (acc, p) => {
        acc.total += 1;
        acc.units += p.stock;
        acc.value += p.price * p.stock;
        acc.costValue += (p.cost || 0) * p.stock;
        if (p.stock <= 0) acc.out += 1;
        else if (p.stock <= p.lowStockThreshold) acc.low += 1;
        if (p.status === 'active') acc.active += 1;
        return acc;
      },
      { total: 0, units: 0, value: 0, costValue: 0, low: 0, out: 0, active: 0 }
    );
    summary.value = round2(summary.value);
    summary.costValue = round2(summary.costValue);

    res.json({ products, summary });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, owner: req.user._id });
    if (!product) throw new HttpError(404, 'Product not found');
    res.json({ product });
  })
);

// POST /api/products
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const prefs = req.user.preferences || {};
    const data = parseProductBody(req.body, { defaults: { lowStockThreshold: prefs.lowStockThreshold } });
    if (!data.sku) {
      data.sku = await generateUniqueSku(req.user._id, { prefix: prefs.skuPrefix || 'NV', category: data.category, name: data.name });
    } else if (await Product.exists({ owner: req.user._id, sku: data.sku })) {
      throw new HttpError(409, 'This SKU is already used by another product.', { sku: 'SKU already exists. Generate a new one.' });
    }

    const product = await Product.create({ ...data, owner: req.user._id });
    await notify(req.user, {
      type: 'product',
      title: 'Product added',
      message: `${product.name} (${product.sku}) was added with ${product.stock} units.`,
      link: '/dashboard/products',
    });
    await notifyStockLevel(req.user, product);
    res.status(201).json({ product });
  })
);

// PATCH /api/products/:id
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, owner: req.user._id });
    if (!product) throw new HttpError(404, 'Product not found');
    const data = parseProductBody(req.body, { partial: true });

    if (data.sku !== undefined) {
      if (!data.sku) delete data.sku;
      else if (data.sku !== product.sku && (await Product.exists({ owner: req.user._id, sku: data.sku, _id: { $ne: product._id } }))) {
        throw new HttpError(409, 'This SKU is already used by another product.', { sku: 'SKU already exists' });
      }
    }

    const prevStock = product.stock;
    Object.assign(product, data);
    await product.save();

    if (product.stock !== prevStock && product.stock <= product.lowStockThreshold) await notifyStockLevel(req.user, product);
    res.json({ product });
  })
);

// POST /api/products/:id/adjust-stock  { delta, reason }
router.post(
  '/:id/adjust-stock',
  asyncHandler(async (req, res) => {
    const delta = Math.round(toNumber(req.body?.delta, 0));
    if (!delta) throw new HttpError(400, 'Enter a quantity to add or remove.');
    const product = await Product.findOne({ _id: req.params.id, owner: req.user._id });
    if (!product) throw new HttpError(404, 'Product not found');
    if (product.stock + delta < 0) throw new HttpError(400, `Only ${product.stock} units available to remove.`);
    product.stock += delta;
    await product.save();
    if (delta < 0) await notifyStockLevel(req.user, product);
    else
      await notify(req.user, {
        type: 'stock',
        title: `Restocked ${product.name}`,
        message: `+${delta} units. New stock level: ${product.stock}.`,
        link: '/dashboard/products',
      });
    res.json({ product });
  })
);

router.post(
  '/bulk-delete',
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.slice(0, 500) : [];
    if (!ids.length) throw new HttpError(400, 'Select at least one product.');
    const result = await Product.deleteMany({ owner: req.user._id, _id: { $in: ids } });
    await notify(req.user, {
      type: 'product',
      title: `${result.deletedCount} products deleted`,
      message: 'The selected products were removed from your catalog.',
      link: '/dashboard/products',
    });
    res.json({ deleted: result.deletedCount });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!product) throw new HttpError(404, 'Product not found');
    await notify(req.user, {
      type: 'product',
      title: 'Product deleted',
      message: `${product.name} (${product.sku}) was removed from your catalog.`,
      link: '/dashboard/products',
    });
    res.json({ message: 'Product deleted' });
  })
);

export default router;

import { Router } from 'express';
import mongoose from 'mongoose';
import Order, { ORDER_CHANNELS, ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from '../models/Order.js';
import Product from '../models/Product.js';
import { nextSequence } from '../models/Counter.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, HttpError, escapeRegex, qstr, round2, toNumber } from '../utils/asyncHandler.js';
import { notify, notifyStockLevel } from '../utils/notify.js';

const router = Router();
router.use(protect);

const STATUS_LABEL = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/** Atomically reserve stock for each item. Rolls back on failure. */
async function reserveStock(ownerId, items) {
  const done = [];
  for (const item of items) {
    // eslint-disable-next-line no-await-in-loop
    const r = await Product.updateOne(
      { _id: item.product, owner: ownerId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );
    if (!r.modifiedCount) {
      for (const d of done) {
        // eslint-disable-next-line no-await-in-loop
        await Product.updateOne({ _id: d.product, owner: ownerId }, { $inc: { stock: d.quantity } });
      }
      // eslint-disable-next-line no-await-in-loop
      const p = await Product.findById(item.product).select('stock name');
      throw new HttpError(400, `Not enough stock for ${item.name}. ${p ? p.stock : 0} available.`);
    }
    done.push(item);
  }
}

async function releaseStock(ownerId, items) {
  for (const item of items) {
    // eslint-disable-next-line no-await-in-loop
    await Product.updateOne({ _id: item.product, owner: ownerId }, { $inc: { stock: item.quantity } });
  }
}

async function checkStockAlerts(user, items) {
  const ids = items.map((i) => i.product);
  const products = await Product.find({ owner: user._id, _id: { $in: ids } });
  for (const p of products) {
    // eslint-disable-next-line no-await-in-loop
    if (p.stock <= p.lowStockThreshold) await notifyStockLevel(user, p);
  }
}

// GET /api/orders
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [search, status, paymentStatus, limit] = ['search', 'status', 'paymentStatus', 'limit'].map((k) => qstr(req.query[k]));
    const filter = { owner: req.user._id };
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search.trim()) {
      const re = { $regex: escapeRegex(search.trim()), $options: 'i' };
      filter.$or = [{ orderNumber: re }, { 'customer.name': re }, { 'customer.email': re }];
    }
    let q = Order.find(filter).sort({ createdAt: -1 });
    if (limit) q = q.limit(Math.min(100, Number(limit) || 10));
    const orders = await q;

    const all = await Order.find({ owner: req.user._id }).select('status paymentStatus total');
    const summary = all.reduce(
      (acc, o) => {
        acc.total += 1;
        if (o.status !== 'cancelled') acc.revenue += o.total;
        if (o.status === 'pending' || o.status === 'processing') acc.open += 1;
        if (o.status === 'delivered') acc.delivered += 1;
        if (o.paymentStatus === 'pending' && o.status !== 'cancelled') acc.unpaid += o.total;
        return acc;
      },
      { total: 0, revenue: 0, open: 0, delivered: 0, unpaid: 0 }
    );
    summary.revenue = round2(summary.revenue);
    summary.unpaid = round2(summary.unpaid);
    res.json({ orders, summary, meta: { statuses: ORDER_STATUSES, paymentStatuses: PAYMENT_STATUSES, paymentMethods: PAYMENT_METHODS, channels: ORDER_CHANNELS } });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, owner: req.user._id });
    if (!order) throw new HttpError(404, 'Order not found');
    res.json({ order });
  })
);

// POST /api/orders
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const errors = {};
    const customer = {
      name: String(b.customer?.name || '').trim(),
      email: String(b.customer?.email || '').trim().toLowerCase(),
      phone: String(b.customer?.phone || '').trim(),
      address: String(b.customer?.address || '').trim(),
    };
    if (customer.name.length < 2) errors['customer.name'] = 'Enter the customer name';
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customer.email)) errors['customer.email'] = 'Enter a valid email';

    const rawItems = Array.isArray(b.items) ? b.items : [];
    if (!rawItems.length) errors.items = 'Add at least one product';

    const merged = new Map();
    for (const it of rawItems) {
      const id = String(it.product || '');
      const qty = Math.round(toNumber(it.quantity, 0));
      if (!mongoose.isValidObjectId(id) || qty < 1) {
        errors.items = 'Each line needs a product and a quantity of at least 1';
        continue;
      }
      merged.set(id, (merged.get(id) || 0) + qty);
    }
    if (Object.keys(errors).length) throw new HttpError(400, 'Please check the highlighted fields.', errors);

    const products = await Product.find({ owner: req.user._id, _id: { $in: [...merged.keys()] } });
    if (products.length !== merged.size) throw new HttpError(400, 'One or more products no longer exist.', { items: 'Refresh and pick products again' });

    const items = products.map((p) => ({
      product: p._id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      price: p.price,
      cost: p.cost || 0,
      quantity: merged.get(String(p._id)),
    }));
    for (const it of items) {
      const p = products.find((x) => String(x._id) === String(it.product));
      if (p.status === 'archived') throw new HttpError(400, `${p.name} is archived and cannot be ordered.`, { items: `${p.name} is archived` });
      if (p.stock < it.quantity) throw new HttpError(400, `Not enough stock for ${p.name}. ${p.stock} available.`, { items: `Only ${p.stock} units of ${p.name} left` });
    }

    const subtotal = round2(items.reduce((s, i) => s + i.price * i.quantity, 0));
    const discount = Math.min(subtotal, Math.max(0, round2(toNumber(b.discount, 0))));
    const shipping = Math.max(0, round2(toNumber(b.shipping, 0)));
    const taxRate = b.taxRate !== undefined ? toNumber(b.taxRate, 0) : req.user.preferences?.taxRate || 0;
    const tax = Math.max(0, round2(((subtotal - discount) * Math.min(100, Math.max(0, taxRate))) / 100));
    const total = round2(subtotal - discount + shipping + tax);

    const status = ORDER_STATUSES.includes(b.status) ? b.status : 'pending';
    if (status === 'cancelled') throw new HttpError(400, 'New orders cannot start as cancelled.', { status: 'Pick another status' });

    await reserveStock(req.user._id, items);

    let order;
    try {
      const seq = await nextSequence(`${req.user._id}:order`, 1000);
      const prefix = req.user.preferences?.skuPrefix || 'NV';
      order = await Order.create({
        owner: req.user._id,
        orderNumber: `${prefix}-${seq}`,
        customer,
        items,
        subtotal,
        discount,
        shipping,
        tax,
        total,
        status,
        paymentStatus: PAYMENT_STATUSES.includes(b.paymentStatus) ? b.paymentStatus : 'pending',
        paymentMethod: PAYMENT_METHODS.includes(b.paymentMethod) ? b.paymentMethod : 'card',
        channel: ORDER_CHANNELS.includes(b.channel) ? b.channel : 'online_store',
        notes: String(b.notes || '').trim(),
        timeline: [{ status, note: 'Order created', at: new Date() }],
      });
    } catch (err) {
      await releaseStock(req.user._id, items);
      throw err;
    }

    const units = items.reduce((s, i) => s + i.quantity, 0);
    await notify(req.user, {
      type: 'order',
      title: `New order ${order.orderNumber}`,
      message: `${customer.name} ordered ${units} item${units === 1 ? '' : 's'}.`,
      link: '/dashboard/orders',
    });
    await checkStockAlerts(req.user, items);

    res.status(201).json({ order });
  })
);

// PATCH /api/orders/:id  { status, paymentStatus, notes }
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, owner: req.user._id });
    if (!order) throw new HttpError(404, 'Order not found');
    const b = req.body || {};
    const prevStatus = order.status;

    if (b.status && b.status !== prevStatus) {
      if (!ORDER_STATUSES.includes(b.status)) throw new HttpError(400, 'Invalid status');
      if (b.status === 'cancelled') await releaseStock(req.user._id, order.items);
      if (prevStatus === 'cancelled') await reserveStock(req.user._id, order.items);
      order.status = b.status;
      order.timeline.push({ status: b.status, note: String(b.note || '').trim() || `Marked as ${STATUS_LABEL[b.status]}`, at: new Date() });
    }
    if (b.paymentStatus && b.paymentStatus !== order.paymentStatus) {
      if (!PAYMENT_STATUSES.includes(b.paymentStatus)) throw new HttpError(400, 'Invalid payment status');
      order.paymentStatus = b.paymentStatus;
      order.timeline.push({ status: order.status, note: `Payment ${b.paymentStatus}`, at: new Date() });
    }
    if (typeof b.notes === 'string') order.notes = b.notes.trim();
    await order.save();

    if (order.status !== prevStatus) {
      await notify(req.user, {
        type: 'order',
        title: `${order.orderNumber} is ${STATUS_LABEL[order.status].toLowerCase()}`,
        message: `Order for ${order.customer.name} moved from ${STATUS_LABEL[prevStatus]} to ${STATUS_LABEL[order.status]}.`,
        link: '/dashboard/orders',
      });
      if (prevStatus === 'cancelled') await checkStockAlerts(req.user, order.items);
    }
    res.json({ order });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, owner: req.user._id });
    if (!order) throw new HttpError(404, 'Order not found');
    const returnsStock = order.status !== 'cancelled' && order.status !== 'delivered';
    if (returnsStock) await releaseStock(req.user._id, order.items);
    await Order.deleteOne({ _id: order._id });
    await notify(req.user, {
      type: 'order',
      title: `Order ${order.orderNumber} deleted`,
      message: returnsStock ? 'Reserved stock was returned to inventory.' : 'The order was removed from your records.',
      link: '/dashboard/orders',
    });
    res.json({ message: 'Order deleted' });
  })
);

export default router;

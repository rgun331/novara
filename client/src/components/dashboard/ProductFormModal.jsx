import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ArrowsClockwise, Barcode, ImageSquare, LockSimple, LockSimpleOpen, Package, Trash } from '@phosphor-icons/react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { Segmented } from '../ui/Segmented';
import { api } from '../../lib/api';
import { resizeImage } from '../../lib/image';
import { formatMoney } from '../../lib/format';
import { useDashboard } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useDebounced } from '../../hooks/useApi';

const EMPTY = { name: '', category: '', sku: '', price: '', cost: '', stock: '', lowStockThreshold: '', status: 'active', supplier: '', tags: '', description: '', image: '' };

export function ProductFormModal() {
  const { productModal, closeProduct, bump } = useDashboard();
  const { user, currency } = useAuth();
  const { refresh } = useNotifications();
  const editing = productModal.product;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [skuAuto, setSkuAuto] = useState(true);
  const [skuLoading, setSkuLoading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!productModal.open) return;
    setErrors({});
    if (editing) {
      setForm({
        ...EMPTY,
        ...editing,
        price: String(editing.price ?? ''),
        cost: String(editing.cost ?? ''),
        stock: String(editing.stock ?? ''),
        lowStockThreshold: String(editing.lowStockThreshold ?? ''),
        tags: (editing.tags || []).join(', '),
      });
      setSkuAuto(false);
    } else {
      setForm({ ...EMPTY, lowStockThreshold: String(user?.preferences?.lowStockThreshold ?? 10) });
      setSkuAuto(true);
    }
    api('/products/meta')
      .then((d) => setCategories(d.categories))
      .catch(() => {});
  }, [productModal.open, editing, user]);

  const debName = useDebounced(form.name, 280);
  const debCat = useDebounced(form.category, 100);

  // Auto SKU preview from the server (guaranteed unique)
  useEffect(() => {
    if (!productModal.open || !skuAuto || editing) return;
    if (!debName.trim() && !debCat) {
      setForm((f) => ({ ...f, sku: '' }));
      return;
    }
    let live = true;
    setSkuLoading(true);
    api('/products/sku', { params: { name: debName, category: debCat } })
      .then((d) => live && setForm((f) => ({ ...f, sku: d.sku })))
      .catch(() => {})
      .finally(() => live && setSkuLoading(false));
    return () => {
      live = false;
    };
  }, [debName, debCat, skuAuto, productModal.open, editing]);

  const regenerate = async () => {
    setSkuLoading(true);
    try {
      const d = await api('/products/sku', { params: { name: form.name, category: form.category } });
      setForm((f) => ({ ...f, sku: d.sku }));
      setSkuAuto(true);
    } finally {
      setSkuLoading(false);
    }
  };

  const set = (k) => (e) => {
    const v = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const margin = useMemo(() => {
    const p = Number(form.price);
    const c = Number(form.cost);
    if (!p || !c) return null;
    return { pct: ((p - c) / p) * 100, profit: p - c };
  }, [form.price, form.cost]);

  const onImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await resizeImage(file, { size: 360 });
      setForm((f) => ({ ...f, image: url }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Enter a product name';
    if (!form.category) errs.category = 'Choose a category';
    if (form.price === '' || Number(form.price) < 0 || Number.isNaN(Number(form.price))) errs.price = 'Enter a valid price';
    if (form.stock !== '' && (Number(form.stock) < 0 || !Number.isInteger(Number(form.stock)))) errs.stock = 'Use a whole number';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      cost: Number(form.cost || 0),
      stock: Number(form.stock || 0),
      lowStockThreshold: Number(form.lowStockThreshold || 0),
      tags: form.tags,
    };
    delete payload._id;
    delete payload.id;
    delete payload.owner;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.stockStatus;
    delete payload.__v;
    try {
      if (editing) {
        await api(`/products/${editing._id}`, { method: 'PATCH', body: payload });
        toast.success('Product updated', { description: `${payload.name} was saved.` });
      } else {
        const d = await api('/products', { method: 'POST', body: payload });
        toast.success('Product added', { description: `${d.product.name} is now in your catalog as ${d.product.sku}.` });
      }
      bump();
      refresh();
      closeProduct();
    } catch (err) {
      setErrors(err.details || {});
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={productModal.open}
      onClose={closeProduct}
      size="lg"
      icon={Package}
      title={editing ? 'Edit product' : 'Add a product'}
      description={editing ? `Update details for ${editing.sku}` : 'Fill in the basics. The SKU is generated for you.'}
      footer={
        <>
          <Button variant="secondary" onClick={closeProduct}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" loading={saving}>
            {editing ? 'Save changes' : 'Add product'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} className="grid gap-5 md:grid-cols-[180px_1fr]" noValidate>
        {/* Image */}
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-ink-800">Image</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative grid aspect-square w-full max-w-[180px] place-items-center overflow-hidden rounded-2xl border border-dashed border-line-strong bg-canvas text-ink-500 transition hover:border-pine-400 hover:bg-pine-50/50"
          >
            {form.image ? (
              <img src={form.image} alt="Product preview" className="absolute inset-0 size-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 px-3 text-center text-xs">
                <ImageSquare className="size-7 text-ink-500 transition group-hover:text-pine-600" weight="duotone" />
                Upload a photo
                <span className="text-[11px] text-ink-500">PNG, JPG or WebP</span>
              </span>
            )}
          </button>
          {form.image && (
            <button type="button" onClick={() => setForm((f) => ({ ...f, image: '' }))} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-ink hover:underline">
              <Trash className="size-3.5" /> Remove image
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onImage} />
          {errors.image && <p className="mt-1.5 text-xs text-rose-ink">{errors.image}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product name" htmlFor="p-name" error={errors.name} required className="sm:col-span-2">
            <Input id="p-name" placeholder="Stoneware Mug 350ml" value={form.name} onChange={set('name')} invalid={!!errors.name} maxLength={120} />
          </Field>
          <Field label="Category" htmlFor="p-cat" error={errors.category} required>
            <Select id="p-cat" value={form.category} onChange={set('category')} invalid={!!errors.category}>
              <option value="">Choose a category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="SKU"
            htmlFor="p-sku"
            error={errors.sku}
            hint={skuAuto ? 'Generated automatically' : 'Custom SKU'}
            action={
              <button type="button" onClick={regenerate} className="inline-flex items-center gap-1 text-xs font-medium text-pine-700 hover:underline" disabled={skuLoading}>
                <ArrowsClockwise className={`size-3.5 ${skuLoading ? 'animate-spin' : ''}`} weight="bold" /> Regenerate
              </button>
            }
          >
            <Input
              id="p-sku"
              className="font-mono"
              placeholder="Auto"
              value={form.sku}
              readOnly={skuAuto}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))}
              invalid={!!errors.sku}
              prefix={<Barcode className="size-4 text-ink-500" />}
              suffix={
                <button
                  type="button"
                  onClick={() => setSkuAuto((a) => !a)}
                  className="grid size-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                  title={skuAuto ? 'Edit SKU manually' : 'Lock to automatic SKU'}
                  aria-label={skuAuto ? 'Edit SKU manually' : 'Use automatic SKU'}
                >
                  {skuAuto ? <LockSimple className="size-4" /> : <LockSimpleOpen className="size-4" />}
                </button>
              }
            />
          </Field>
          <Field label="Selling price" htmlFor="p-price" error={errors.price} required>
            <Input id="p-price" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={set('price')} invalid={!!errors.price} prefix={currency} />
          </Field>
          <Field label="Unit cost" htmlFor="p-cost" error={errors.cost} hint={margin ? `Margin ${margin.pct.toFixed(1)}%, ${formatMoney(margin.profit, currency)} per unit` : 'Used for profit and margin'}>
            <Input id="p-cost" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" value={form.cost} onChange={set('cost')} prefix={currency} />
          </Field>
          <Field label="Stock on hand" htmlFor="p-stock" error={errors.stock}>
            <Input id="p-stock" type="number" inputMode="numeric" min="0" step="1" placeholder="0" value={form.stock} onChange={set('stock')} invalid={!!errors.stock} suffix={<span className="pr-2 text-xs text-ink-500">units</span>} />
          </Field>
          <Field label="Low stock alert at" htmlFor="p-low" hint="Notify me when stock reaches this level">
            <Input id="p-low" type="number" inputMode="numeric" min="0" step="1" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} suffix={<span className="pr-2 text-xs text-ink-500">units</span>} />
          </Field>
          <Field label="Status" className="sm:col-span-2">
            <Segmented
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
          </Field>
          <Field label="Supplier" htmlFor="p-sup">
            <Input id="p-sup" placeholder="Optional" value={form.supplier} onChange={set('supplier')} />
          </Field>
          <Field label="Tags" htmlFor="p-tags" hint="Separate with commas">
            <Input id="p-tags" placeholder="ceramic, handmade" value={form.tags} onChange={set('tags')} />
          </Field>
          <Field label="Description" htmlFor="p-desc" className="sm:col-span-2">
            <Textarea id="p-desc" rows={3} placeholder="Materials, sizes, care notes" value={form.description} onChange={set('description')} maxLength={1000} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

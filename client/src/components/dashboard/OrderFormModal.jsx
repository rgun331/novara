import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Minus, Plus, Receipt, Trash } from '@phosphor-icons/react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { EmptyState } from '../ui/EmptyState';
import { BoxesIllustration } from '../brand/Illustrations';
import { api } from '../../lib/api';
import { formatMoney, titleCase } from '../../lib/format';
import { useDashboard } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';

const PAYMENT_METHODS = ['card', 'cash', 'bank_transfer', 'cash_on_delivery', 'wallet'];
const CHANNELS = ['online_store', 'retail', 'wholesale', 'social', 'marketplace'];
const newLine = () => ({ key: Math.random().toString(36).slice(2), product: '', quantity: 1 });

export function OrderFormModal() {
  const { orderModal, closeOrder, openProduct, bump } = useDashboard();
  const { user, currency } = useAuth();
  const { refresh } = useNotifications();
  const [products, setProducts] = useState(null);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '' });
  const [lines, setLines] = useState([newLine()]);
  const [meta, setMeta] = useState({ shipping: '', discount: '', taxRate: '', paymentMethod: 'card', paymentStatus: 'pending', status: 'pending', channel: 'online_store', notes: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!orderModal) return;
    setCustomer({ name: '', email: '', phone: '', address: '' });
    setLines([newLine()]);
    setMeta((m) => ({ ...m, shipping: '', discount: '', taxRate: String(user?.preferences?.taxRate ?? 0), paymentStatus: 'pending', status: 'pending', notes: '' }));
    setErrors({});
    setProducts(null);
    api('/products')
      .then((d) => setProducts(d.products.filter((p) => p.status !== 'archived')))
      .catch(() => setProducts([]));
  }, [orderModal, user]);

  const byId = useMemo(() => new Map((products || []).map((p) => [p._id, p])), [products]);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + (byId.get(l.product)?.price || 0) * (Number(l.quantity) || 0), 0);
    const discount = Math.min(subtotal, Math.max(0, Number(meta.discount) || 0));
    const shipping = Math.max(0, Number(meta.shipping) || 0);
    const tax = ((subtotal - discount) * Math.min(100, Math.max(0, Number(meta.taxRate) || 0))) / 100;
    return { subtotal, discount, shipping, tax, total: subtotal - discount + shipping + tax, units: lines.reduce((s, l) => s + (l.product ? Number(l.quantity) || 0 : 0), 0) };
  }, [lines, byId, meta]);

  const setLine = (key, patch) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (customer.name.trim().length < 2) errs['customer.name'] = 'Enter the customer name';
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customer.email)) errs['customer.email'] = 'Enter a valid email';
    const valid = lines.filter((l) => l.product);
    if (!valid.length) errs.items = 'Add at least one product';
    for (const l of valid) {
      const p = byId.get(l.product);
      if (p && Number(l.quantity) > p.stock) errs.items = `Only ${p.stock} units of ${p.name} in stock`;
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const d = await api('/orders', {
        method: 'POST',
        body: {
          customer,
          items: valid.map((l) => ({ product: l.product, quantity: Number(l.quantity) })),
          shipping: Number(meta.shipping || 0),
          discount: Number(meta.discount || 0),
          taxRate: Number(meta.taxRate || 0),
          paymentMethod: meta.paymentMethod,
          paymentStatus: meta.paymentStatus,
          status: meta.status,
          channel: meta.channel,
          notes: meta.notes,
        },
      });
      toast.success(`Order ${d.order.orderNumber} created`, { description: `${formatMoney(d.order.total, currency)} for ${d.order.customer.name}` });
      bump();
      refresh();
      closeOrder();
    } catch (err) {
      setErrors(err.details || {});
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const noProducts = products && products.length === 0;

  return (
    <Modal
      open={orderModal}
      onClose={closeOrder}
      size="xl"
      icon={Receipt}
      title="Create an order"
      description="Stock is reserved as soon as the order is saved."
      footer={
        noProducts ? null : (
          <>
            <Button variant="secondary" onClick={closeOrder}>
              Cancel
            </Button>
            <Button type="submit" form="order-form" loading={saving} disabled={!products}>
              Create order, {formatMoney(totals.total, currency)}
            </Button>
          </>
        )
      }
    >
      {noProducts ? (
        <EmptyState
          compact
          illustration={BoxesIllustration}
          title="Add a product first"
          description="Orders are built from products in your catalog. Add one and come back."
          action={
            <Button
              onClick={() => {
                closeOrder();
                setTimeout(() => openProduct(), 200);
              }}
            >
              <Plus weight="bold" className="size-4" /> Add product
            </Button>
          }
        />
      ) : (
        <form id="order-form" onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_300px]" noValidate>
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-ink-900">Customer</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="o-name" error={errors['customer.name']} required>
                  <Input id="o-name" placeholder="Bilal Ahmed" value={customer.name} onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))} invalid={!!errors['customer.name']} />
                </Field>
                <Field label="Email" htmlFor="o-email" error={errors['customer.email']}>
                  <Input id="o-email" type="email" placeholder="Optional" value={customer.email} onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))} invalid={!!errors['customer.email']} />
                </Field>
                <Field label="Phone" htmlFor="o-phone">
                  <Input id="o-phone" placeholder="Optional" value={customer.phone} onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))} />
                </Field>
                <Field label="Shipping address" htmlFor="o-addr">
                  <Input id="o-addr" placeholder="Optional" value={customer.address} onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))} />
                </Field>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink-900">Products</h3>
                <Button size="xs" variant="secondary" onClick={() => setLines((ls) => [...ls, newLine()])}>
                  <Plus weight="bold" className="size-3" /> Add line
                </Button>
              </div>
              <div className="mt-3 space-y-2.5">
                {lines.map((l) => {
                  const p = byId.get(l.product);
                  const over = p && Number(l.quantity) > p.stock;
                  return (
                    <div key={l.key} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-2xl border border-line bg-canvas/70 p-2.5 sm:grid-cols-[1fr_auto_auto_auto]">
                      <Select value={l.product} onChange={(e) => setLine(l.key, { product: e.target.value })} aria-label="Product" className="col-span-2 sm:col-span-1">
                        <option value="">{products ? 'Choose a product' : 'Loading products'}</option>
                        {(products || []).map((opt) => (
                          <option key={opt._id} value={opt._id} disabled={opt.stock <= 0}>
                            {opt.name} ({opt.sku}), {opt.stock} in stock
                          </option>
                        ))}
                      </Select>
                      <div className="flex h-10 items-center rounded-xl border border-line-strong bg-white">
                        <button type="button" className="grid h-full w-9 place-items-center text-ink-500 hover:text-ink-900" onClick={() => setLine(l.key, { quantity: Math.max(1, Number(l.quantity) - 1) })} aria-label="Decrease quantity">
                          <Minus className="size-3.5" weight="bold" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={l.quantity}
                          onChange={(e) => setLine(l.key, { quantity: Math.max(1, Math.round(Number(e.target.value) || 1)) })}
                          className={`w-10 bg-transparent text-center text-sm tabular outline-none ${over ? 'text-rose-ink' : ''}`}
                          aria-label="Quantity"
                        />
                        <button type="button" className="grid h-full w-9 place-items-center text-ink-500 hover:text-ink-900" onClick={() => setLine(l.key, { quantity: Number(l.quantity) + 1 })} aria-label="Increase quantity">
                          <Plus className="size-3.5" weight="bold" />
                        </button>
                      </div>
                      <span className="hidden w-24 text-right text-sm font-medium tabular sm:block">{formatMoney((p?.price || 0) * l.quantity, currency)}</span>
                      <button
                        type="button"
                        onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : [newLine()]))}
                        className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-rose-soft hover:text-rose-ink"
                        aria-label="Remove line"
                      >
                        <Trash className="size-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
              {errors.items && <p className="mt-2 text-xs font-medium text-rose-ink">{errors.items}</p>}
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <Field label="Order status" htmlFor="o-status">
                <Select id="o-status" value={meta.status} onChange={(e) => setMeta((m) => ({ ...m, status: e.target.value }))}>
                  {['pending', 'processing', 'shipped', 'delivered'].map((s) => (
                    <option key={s} value={s}>
                      {titleCase(s)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Sales channel" htmlFor="o-channel">
                <Select id="o-channel" value={meta.channel} onChange={(e) => setMeta((m) => ({ ...m, channel: e.target.value }))}>
                  {CHANNELS.map((c) => (
                    <option key={c} value={c}>
                      {titleCase(c)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Payment method" htmlFor="o-pm">
                <Select id="o-pm" value={meta.paymentMethod} onChange={(e) => setMeta((m) => ({ ...m, paymentMethod: e.target.value }))}>
                  {PAYMENT_METHODS.map((c) => (
                    <option key={c} value={c}>
                      {titleCase(c)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Payment status" htmlFor="o-ps">
                <Select id="o-ps" value={meta.paymentStatus} onChange={(e) => setMeta((m) => ({ ...m, paymentStatus: e.target.value }))}>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </Select>
              </Field>
              <Field label="Notes" htmlFor="o-notes" className="sm:col-span-2">
                <Textarea id="o-notes" rows={2} placeholder="Gift wrap, delivery window, anything your team should know" value={meta.notes} onChange={(e) => setMeta((m) => ({ ...m, notes: e.target.value }))} />
              </Field>
            </section>
          </div>

          <aside className="h-fit space-y-4 rounded-2xl border border-line bg-canvas p-5 lg:sticky lg:top-0">
            <h3 className="text-sm font-semibold">Summary</h3>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Shipping" htmlFor="o-ship">
                <Input id="o-ship" type="number" min="0" step="0.01" placeholder="0" value={meta.shipping} onChange={(e) => setMeta((m) => ({ ...m, shipping: e.target.value }))} />
              </Field>
              <Field label="Discount" htmlFor="o-disc">
                <Input id="o-disc" type="number" min="0" step="0.01" placeholder="0" value={meta.discount} onChange={(e) => setMeta((m) => ({ ...m, discount: e.target.value }))} />
              </Field>
              <Field label="Tax %" htmlFor="o-tax">
                <Input id="o-tax" type="number" min="0" max="100" step="0.1" placeholder="0" value={meta.taxRate} onChange={(e) => setMeta((m) => ({ ...m, taxRate: e.target.value }))} />
              </Field>
            </div>
            <dl className="space-y-2 border-t border-line pt-4 text-[13px]">
              {[
                ['Items', `${totals.units} units`],
                ['Subtotal', formatMoney(totals.subtotal, currency)],
                ['Discount', `- ${formatMoney(totals.discount, currency)}`],
                ['Shipping', formatMoney(totals.shipping, currency)],
                ['Tax', formatMoney(totals.tax, currency)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-ink-500">{k}</dt>
                  <dd className="tabular text-ink-800">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex items-end justify-between border-t border-dashed border-line-strong pt-4">
              <span className="text-sm font-medium text-ink-600">Total</span>
              <span className="font-display text-2xl font-semibold tracking-tight tabular">{formatMoney(totals.total, currency)}</span>
            </div>
          </aside>
        </form>
      )}
    </Modal>
  );
}

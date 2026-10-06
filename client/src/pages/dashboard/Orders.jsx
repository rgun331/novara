import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle, Clock, CurrencyCircleDollar, DownloadSimple, Eye, MagnifyingGlass, Plus, Receipt, Trash, Truck, X } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useApi, useDebounced } from '../../hooks/useApi';
import { useDashboard } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { api } from '../../lib/api';
import { formatDate, formatDateTime, formatMoney, titleCase } from '../../lib/format';
import { downloadCsv } from '../../lib/csv';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { Segmented } from '../../components/ui/Segmented';
import { Badge, ORDER_STATUS_TONE, PAYMENT_TONE } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Drawer } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { StatCard } from '../../components/dashboard/StatCard';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { ReceiptIllustration } from '../../components/brand/Illustrations';
import { cn } from '../../lib/cn';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const { version, openOrder, bump } = useDashboard();
  const { currency } = useAuth();
  const { refresh } = useNotifications();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const [status, setStatus] = useState('all');
  const [payment, setPayment] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeId, setActiveId] = useState(null);
  const q = useDebounced(search, 250);

  useEffect(() => {
    const fromUrl = params.get('q');
    if (fromUrl !== null) setSearch(fromUrl);
  }, [params]);

  const { data, loading, error, reload } = useApi('/orders', {
    params: { search: q, status: status === 'all' ? '' : status, paymentStatus: payment },
    deps: [version],
  });
  const all = useApi('/orders', { params: { limit: 100 }, deps: [version] });

  const orders = data?.orders || [];
  const summary = data?.summary;
  const counts = useMemo(() => {
    const c = { all: summary?.total || 0 };
    (all.data?.orders || []).forEach((o) => (c[o.status] = (c[o.status] || 0) + 1));
    return c;
  }, [all.data, summary]);
  const pageItems = orders.slice((page - 1) * pageSize, page * pageSize);
  const active = orders.find((o) => o._id === activeId) || (all.data?.orders || []).find((o) => o._id === activeId);

  useEffect(() => setPage(1), [q, status, payment, pageSize]);

  const exportCsv = () =>
    downloadCsv(`novara-orders-${new Date().toISOString().slice(0, 10)}.csv`, orders, [
      { label: 'Order', value: 'orderNumber' },
      { label: 'Date', value: (r) => formatDate(r.createdAt) },
      { label: 'Customer', value: (r) => r.customer.name },
      { label: 'Email', value: (r) => r.customer.email },
      { label: 'Items', value: (r) => r.items.reduce((s, i) => s + i.quantity, 0) },
      { label: 'Total', value: 'total' },
      { label: 'Status', value: 'status' },
      { label: 'Payment', value: 'paymentStatus' },
      { label: 'Method', value: 'paymentMethod' },
      { label: 'Channel', value: 'channel' },
    ]);

  const totalEmpty = !loading && summary?.total === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Every sale, its status and what it did to your stock."
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv} disabled={!orders.length}>
              <DownloadSimple className="size-4" /> Export
            </Button>
            <Button onClick={openOrder}>
              <Plus weight="bold" className="size-4" /> Create order
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard index={0} label="Total orders" value={summary?.total || 0} icon={Receipt} loading={loading && !data} />
        <StatCard index={1} label="Revenue" value={summary?.revenue || 0} decimals={2} format={(v) => formatMoney(v, currency)} icon={CurrencyCircleDollar} hint="excluding cancelled" loading={loading && !data} tone="ink" />
        <StatCard index={2} label="Open orders" value={summary?.open || 0} icon={Clock} hint="pending or processing" loading={loading && !data} />
        <StatCard index={3} label="Awaiting payment" value={summary?.unpaid || 0} decimals={2} format={(v) => formatMoney(v, currency)} icon={Truck} loading={loading && !data} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-soft">
        <div className="flex flex-col gap-3 border-b border-line p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="scrollbar-thin -mx-1 overflow-x-auto px-1">
            <Segmented
              size="sm"
              value={status}
              onChange={setStatus}
              options={[{ value: 'all', label: 'All', count: counts.all }, ...STATUSES.map((s) => ({ value: s, label: titleCase(s), count: counts[s] || 0 }))]}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (params.get('q')) setParams({}, { replace: true });
                }}
                placeholder="Order number or customer"
                className="pl-10"
                aria-label="Search orders"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-ink-500 hover:bg-ink-100" aria-label="Clear search">
                  <X className="size-3.5" weight="bold" />
                </button>
              )}
            </div>
            <Select value={payment} onChange={(e) => setPayment(e.target.value)} className="w-[150px]" aria-label="Payment status">
              <option value="">Any payment</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </Select>
          </div>
        </div>

        {loading && !data ? (
          <TableSkeleton />
        ) : error ? (
          <div className="p-10 text-center text-sm text-rose-ink">
            {error.message}{' '}
            <button className="font-semibold underline" onClick={() => reload()}>
              Try again
            </button>
          </div>
        ) : totalEmpty ? (
          <EmptyState
            illustration={ReceiptIllustration}
            title="No orders yet"
            description="Create an order from your products. Totals, tax and stock levels are handled for you."
            action={
              <Button onClick={openOrder}>
                <Plus weight="bold" className="size-4" /> Create your first order
              </Button>
            }
          />
        ) : orders.length === 0 ? (
          <EmptyState
            compact
            illustration={ReceiptIllustration}
            title="No orders match"
            description="Try another status, payment filter or search."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setStatus('all');
                  setPayment('');
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-canvas/60 text-xs text-ink-500">
                    <th className="py-3 pl-5 pr-4 font-medium">Order</th>
                    <th className="py-3 pr-4 font-medium">Customer</th>
                    <th className="py-3 pr-4 font-medium">Items</th>
                    <th className="py-3 pr-4 text-right font-medium">Total</th>
                    <th className="py-3 pr-4 font-medium">Payment</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="w-14 py-3 pr-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pageItems.map((o, i) => {
                    const units = o.items.reduce((s, it) => s + it.quantity, 0);
                    return (
                      <motion.tr
                        key={o._id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.025 } }}
                        onClick={() => setActiveId(o._id)}
                        className="cursor-pointer transition-colors hover:bg-canvas/70"
                      >
                        <td className="py-3.5 pl-5 pr-4">
                          <span className="font-mono text-[13px] font-medium text-ink-900">{o.orderNumber}</span>
                          <span className="block text-xs text-ink-500">{titleCase(o.channel)}</span>
                        </td>
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={o.customer.name} size={32} />
                            <div className="min-w-0">
                              <p className="max-w-[200px] truncate font-medium text-ink-900">{o.customer.name}</p>
                              <p className="max-w-[200px] truncate text-xs text-ink-500">{o.customer.email || o.customer.phone || 'No contact'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4 text-ink-600">
                          <span className="tabular">{units}</span> unit{units === 1 ? '' : 's'}
                          <span className="block max-w-[180px] truncate text-xs text-ink-500">{o.items.map((it) => it.name).join(', ')}</span>
                        </td>
                        <td className="py-3.5 pr-4 text-right font-semibold tabular">{formatMoney(o.total, currency)}</td>
                        <td className="py-3.5 pr-4">
                          <Badge tone={PAYMENT_TONE[o.paymentStatus]}>{titleCase(o.paymentStatus)}</Badge>
                          <span className="mt-1 block text-xs text-ink-500">{titleCase(o.paymentMethod)}</span>
                        </td>
                        <td className="py-3.5 pr-4">
                          <Badge tone={ORDER_STATUS_TONE[o.status]}>{titleCase(o.status)}</Badge>
                        </td>
                        <td className="py-3.5 pr-4 text-ink-500">{formatDateTime(o.createdAt)}</td>
                        <td className="py-3.5 pr-4">
                          <span className="grid size-8 place-items-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900">
                            <Eye className="size-4.5" />
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={pageSize} total={orders.length} onPage={setPage} onPageSize={setPageSize} />
          </>
        )}
      </div>

      <OrderDrawer
        order={active}
        open={!!activeId && !!active}
        onClose={() => setActiveId(null)}
        currency={currency}
        onChanged={() => {
          bump();
          refresh();
        }}
      />
    </div>
  );
}

function OrderDrawer({ order, open, onClose, currency, onChanged }) {
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState(false);

  const update = async (body, label) => {
    setBusy(label);
    try {
      await api(`/orders/${order._id}`, { method: 'PATCH', body });
      toast.success('Order updated', { description: `${order.orderNumber} ${label}` });
      onChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const remove = async () => {
    setBusy('delete');
    try {
      await api(`/orders/${order._id}`, { method: 'DELETE' });
      toast.success(`Order ${order.orderNumber} deleted`);
      setConfirm(false);
      onClose();
      onChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const flow = ['pending', 'processing', 'shipped', 'delivered'];
  const idx = order ? flow.indexOf(order.status) : -1;
  const next = idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={order ? `Order ${order.orderNumber}` : ''}
        subtitle={order ? `Placed ${formatDateTime(order.createdAt)}` : ''}
        footer={
          order && (
            <>
              <Button variant="danger-ghost" onClick={() => setConfirm(true)}>
                <Trash className="size-4" /> Delete
              </Button>
              <div className="flex-1" />
              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <Button variant="secondary" loading={busy === 'cancelled'} onClick={() => update({ status: 'cancelled' }, 'cancelled')}>
                  Cancel order
                </Button>
              )}
              {next && (
                <Button loading={busy === next} onClick={() => update({ status: next }, `marked ${next}`)}>
                  Mark {titleCase(next)}
                </Button>
              )}
              {order.status === 'cancelled' && (
                <Button loading={busy === 'pending'} onClick={() => update({ status: 'pending' }, 'reopened')}>
                  Reopen order
                </Button>
              )}
            </>
          )
        }
      >
        {order && (
          <div className="space-y-6">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between">
                <Badge tone={ORDER_STATUS_TONE[order.status]}>{titleCase(order.status)}</Badge>
                <Badge tone={PAYMENT_TONE[order.paymentStatus]}>Payment {order.paymentStatus}</Badge>
              </div>
              {order.status !== 'cancelled' && (
                <div className="mt-4 grid grid-cols-4 gap-1.5">
                  {flow.map((s, i) => (
                    <div key={s}>
                      <div className={cn('h-1.5 rounded-full transition-colors', i <= idx ? 'bg-pine-600' : 'bg-ink-100')} />
                      <p className={cn('mt-1.5 text-[11px] font-medium', i <= idx ? 'text-ink-800' : 'text-ink-500')}>{titleCase(s)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <section className="rounded-2xl border border-line p-4">
              <div className="flex items-center gap-3">
                <Avatar name={order.customer.name} size={40} />
                <div className="min-w-0">
                  <p className="font-semibold">{order.customer.name}</p>
                  <p className="truncate text-[13px] text-ink-500">{[order.customer.email, order.customer.phone].filter(Boolean).join(', ') || 'No contact details'}</p>
                </div>
              </div>
              {order.customer.address && <p className="mt-3 border-t border-line pt-3 text-[13px] text-ink-600">{order.customer.address}</p>}
            </section>

            <section>
              <h3 className="text-sm font-semibold">Items</h3>
              <div className="mt-3 divide-y divide-line rounded-2xl border border-line">
                {order.items.map((it) => (
                  <div key={it.sku} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{it.name}</p>
                      <p className="font-mono text-xs text-ink-500">{it.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium tabular">{formatMoney(it.price * it.quantity, currency)}</p>
                      <p className="text-xs text-ink-500 tabular">
                        {it.quantity} x {formatMoney(it.price, currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <dl className="mt-4 space-y-1.5 text-[13px]">
                {[
                  ['Subtotal', order.subtotal],
                  ['Discount', -order.discount],
                  ['Shipping', order.shipping],
                  ['Tax', order.tax],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <dt className="text-ink-500">{k}</dt>
                    <dd className="tabular">{formatMoney(v, currency)}</dd>
                  </div>
                ))}
                <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular">{formatMoney(order.total, currency)}</dd>
                </div>
              </dl>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-canvas p-3">
                <p className="text-xs text-ink-500">Payment method</p>
                <p className="mt-0.5 text-sm font-medium">{titleCase(order.paymentMethod)}</p>
              </div>
              <div className="rounded-xl bg-canvas p-3">
                <p className="text-xs text-ink-500">Payment status</p>
                <Select
                  value={order.paymentStatus}
                  onChange={(e) => update({ paymentStatus: e.target.value }, `payment ${e.target.value}`)}
                  className="mt-1"
                  aria-label="Payment status"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </Select>
              </div>
            </section>

            {order.notes && (
              <section className="rounded-2xl bg-kraft-100/60 p-4 text-[13px] leading-relaxed text-ink-700">
                <p className="mb-1 text-xs font-semibold text-ink-900">Notes</p>
                {order.notes}
              </section>
            )}

            <section>
              <h3 className="text-sm font-semibold">Timeline</h3>
              <ol className="mt-3 space-y-0">
                {[...(order.timeline || [])].reverse().map((t, i, arr) => (
                  <li key={i} className="relative flex gap-3 pb-4">
                    {i < arr.length - 1 && <span className="absolute left-[11px] top-6 h-full w-px bg-line" />}
                    <span className={cn('relative z-10 grid size-6 shrink-0 place-items-center rounded-full', i === 0 ? 'bg-pine-600 text-paper' : 'bg-ink-100 text-ink-500')}>
                      <CheckCircle className="size-3.5" weight="fill" />
                    </span>
                    <div>
                      <p className="text-[13px] font-medium">{t.note}</p>
                      <p className="text-xs text-ink-500">{formatDateTime(t.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </Drawer>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
        loading={busy === 'delete'}
        title={`Delete order ${order?.orderNumber}?`}
        description="Reserved stock will be returned to inventory unless the order was delivered or cancelled."
      />
    </>
  );
}

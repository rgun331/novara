import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowsDownUp,
  Copy,
  CurrencyCircleDollar,
  DotsThree,
  DownloadSimple,
  MagnifyingGlass,
  Package,
  PencilSimple,
  Plus,
  Stack,
  Trash,
  Warning,
  X,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useApi, useDebounced } from '../../hooks/useApi';
import { useDashboard } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { api } from '../../lib/api';
import { formatDate, formatMoney, formatNumber } from '../../lib/format';
import { downloadCsv } from '../../lib/csv';
import { Button } from '../../components/ui/Button';
import { Input, Select, Field } from '../../components/ui/Field';
import { Segmented } from '../../components/ui/Segmented';
import { Badge, PRODUCT_STATUS_TONE } from '../../components/ui/Badge';
import { Dropdown, DropdownItem, DropdownSeparator } from '../../components/ui/Dropdown';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Modal';
import { StatCard } from '../../components/dashboard/StatCard';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { BoxesIllustration } from '../../components/brand/Illustrations';
import { cn } from '../../lib/cn';

function StockCell({ p }) {
  const tone = p.stock <= 0 ? 'rose' : p.stock <= p.lowStockThreshold ? 'amber' : 'pine';
  const label = p.stock <= 0 ? 'Out of stock' : p.stock <= p.lowStockThreshold ? 'Low stock' : 'In stock';
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="font-medium tabular text-ink-900">{formatNumber(p.stock)}</span>
      <Badge tone={tone} icon={tone !== 'pine' ? Warning : undefined}>
        {label}
      </Badge>
    </div>
  );
}

function ProductThumb({ p }) {
  if (p.image) return <img src={p.image} alt="" className="size-10 shrink-0 rounded-xl object-cover ring-1 ring-line" />;
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-pine-50 font-display text-sm font-semibold text-pine-700 ring-1 ring-pine-100">
      {p.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

const SORTS = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  name: (a, b) => a.name.localeCompare(b.name),
  price: (a, b) => b.price - a.price,
  stock: (a, b) => a.stock - b.stock,
};

export default function Products() {
  const { version, openProduct, bump } = useDashboard();
  const { currency } = useAuth();
  const { refresh } = useNotifications();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [stock, setStock] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(new Set());
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [adjust, setAdjust] = useState(null);
  const q = useDebounced(search, 250);

  useEffect(() => {
    const fromUrl = params.get('q');
    if (fromUrl !== null) setSearch(fromUrl);
  }, [params]);

  const { data, loading, error, reload } = useApi('/products', {
    params: { search: q, category, status, stock: stock === 'all' ? '' : stock },
    deps: [version],
  });
  const meta = useApi('/products/meta', { deps: [version] });

  const products = useMemo(() => [...(data?.products || [])].sort(SORTS[sort]), [data, sort]);
  const summary = data?.summary;
  const pageItems = products.slice((page - 1) * pageSize, page * pageSize);
  const hasFilters = q || category || status || stock !== 'all';

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [q, category, status, stock, pageSize]);

  const toggle = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allOnPage = pageItems.length > 0 && pageItems.every((p) => selected.has(p._id));
  const toggleAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      pageItems.forEach((p) => (allOnPage ? n.delete(p._id) : n.add(p._id)));
      return n;
    });

  const doDelete = async () => {
    setDeleting(true);
    try {
      if (confirm.type === 'bulk') {
        const d = await api('/products/bulk-delete', { method: 'POST', body: { ids: [...selected] } });
        toast.success(`${d.deleted} products deleted`);
        setSelected(new Set());
      } else {
        await api(`/products/${confirm.product._id}`, { method: 'DELETE' });
        toast.success('Product deleted', { description: confirm.product.name });
      }
      setConfirm(null);
      bump();
      refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const copySku = async (sku) => {
    try {
      await navigator.clipboard.writeText(sku);
      toast.success('SKU copied', { description: sku });
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const exportCsv = () =>
    downloadCsv(`novara-products-${new Date().toISOString().slice(0, 10)}.csv`, products, [
      { label: 'Name', value: 'name' },
      { label: 'SKU', value: 'sku' },
      { label: 'Category', value: 'category' },
      { label: 'Price', value: 'price' },
      { label: 'Cost', value: 'cost' },
      { label: 'Stock', value: 'stock' },
      { label: 'Low stock threshold', value: 'lowStockThreshold' },
      { label: 'Status', value: 'status' },
      { label: 'Supplier', value: 'supplier' },
      { label: 'Created', value: (r) => formatDate(r.createdAt) },
    ]);

  const totalEmpty = !loading && summary?.total === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Your catalog, stock levels and auto-generated SKUs."
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv} disabled={!products.length}>
              <DownloadSimple className="size-4" /> Export
            </Button>
            <Button onClick={() => openProduct()}>
              <Plus weight="bold" className="size-4" /> Add product
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard index={0} label="Products" value={summary?.total || 0} icon={Package} hint={`${summary?.active || 0} active`} loading={loading && !data} />
        <StatCard index={1} label="Units in stock" value={summary?.units || 0} icon={Stack} format={(v) => formatNumber(v)} loading={loading && !data} />
        <StatCard index={2} label="Inventory value" value={summary?.value || 0} icon={CurrencyCircleDollar} format={(v) => formatMoney(v, currency)} decimals={2} hint="at selling price" loading={loading && !data} />
        <StatCard index={3} label="Need restock" value={(summary?.low || 0) + (summary?.out || 0)} icon={Warning} hint={`${summary?.out || 0} out of stock`} loading={loading && !data} tone="ink" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-soft">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-line p-4 xl:flex-row xl:items-center">
          <div className="relative flex-1 xl:max-w-sm">
            <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (params.get('q')) setParams({}, { replace: true });
              }}
              placeholder="Search name, SKU or supplier"
              className="pl-10"
              aria-label="Search products"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-ink-400 hover:bg-ink-100" aria-label="Clear search">
                <X className="size-3.5" weight="bold" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              size="sm"
              value={stock}
              onChange={setStock}
              options={[
                { value: 'all', label: 'All' },
                { value: 'in', label: 'In stock' },
                { value: 'low', label: 'Low' },
                { value: 'out', label: 'Out' },
              ]}
            />
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-[150px]" aria-label="Filter by category">
              <option value="">All categories</option>
              {(meta.data?.categories || []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-[130px]" aria-label="Filter by status">
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </Select>
            <Dropdown
              trigger={({ toggle }) => (
                <Button variant="secondary" size="md" onClick={toggle} aria-label="Sort">
                  <ArrowsDownUp className="size-4" /> Sort
                </Button>
              )}
            >
              {[
                ['newest', 'Newest first'],
                ['name', 'Name A to Z'],
                ['price', 'Price, high to low'],
                ['stock', 'Stock, low to high'],
              ].map(([k, l]) => (
                <DropdownItem key={k} onClick={() => setSort(k)} className={sort === k ? 'bg-ink-100 text-ink-900' : ''}>
                  {l}
                </DropdownItem>
              ))}
            </Dropdown>
          </div>
        </div>

        {/* Bulk bar */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 bg-ink-900 px-4 py-2.5 text-sm text-paper">
                <span>
                  <span className="font-semibold tabular">{selected.size}</span> selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="text-ink-300 hover:bg-white/10 hover:text-paper" onClick={() => setSelected(new Set())}>
                    Clear
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setConfirm({ type: 'bulk' })}>
                    <Trash className="size-4" /> Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
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
            illustration={BoxesIllustration}
            title="No products yet"
            description="Add your first product and Novara will generate its SKU, track its stock and alert you before it runs out."
            action={
              <Button onClick={() => openProduct()}>
                <Plus weight="bold" className="size-4" /> Add your first product
              </Button>
            }
          />
        ) : products.length === 0 ? (
          <EmptyState
            compact
            illustration={BoxesIllustration}
            title="No products match"
            description="Try a different search or clear the filters."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setCategory('');
                  setStatus('');
                  setStock('all');
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-canvas/60 text-xs font-medium text-ink-500">
                    <th className="w-12 py-3 pl-5">
                      <input type="checkbox" checked={allOnPage} onChange={toggleAll} className="size-4 rounded accent-pine-600" aria-label="Select all on page" />
                    </th>
                    <th className="py-3 pr-4 font-medium">Product</th>
                    <th className="py-3 pr-4 font-medium">SKU</th>
                    <th className="py-3 pr-4 text-right font-medium">Price</th>
                    <th className="py-3 pr-4 text-right font-medium">Margin</th>
                    <th className="py-3 pr-4 font-medium">Stock</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Updated</th>
                    <th className="w-14 py-3 pr-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <AnimatePresence initial={false}>
                    {pageItems.map((p, i) => {
                      const margin = p.price > 0 && p.cost ? ((p.price - p.cost) / p.price) * 100 : null;
                      return (
                        <motion.tr
                          key={p._id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.025 } }}
                          exit={{ opacity: 0 }}
                          className={cn('group transition-colors hover:bg-canvas/70', selected.has(p._id) && 'bg-pine-50/60')}
                        >
                          <td className="py-3.5 pl-5">
                            <input type="checkbox" checked={selected.has(p._id)} onChange={() => toggle(p._id)} className="size-4 rounded accent-pine-600" aria-label={`Select ${p.name}`} />
                          </td>
                          <td className="py-3.5 pr-4">
                            <button className="flex items-center gap-3 text-left" onClick={() => openProduct(p)}>
                              <ProductThumb p={p} />
                              <span className="min-w-0">
                                <span className="block max-w-[260px] truncate font-semibold text-ink-900 group-hover:text-pine-700">{p.name}</span>
                                <span className="block text-xs text-ink-500">{p.category}</span>
                              </span>
                            </button>
                          </td>
                          <td className="py-3.5 pr-4">
                            <button onClick={() => copySku(p.sku)} className="group/sku inline-flex items-center gap-1.5 rounded-lg bg-canvas px-2 py-1 font-mono text-xs text-ink-700 ring-1 ring-line hover:ring-pine-300" title="Copy SKU">
                              {p.sku}
                              <Copy className="size-3.5 text-ink-400 group-hover/sku:text-pine-600" />
                            </button>
                          </td>
                          <td className="py-3.5 pr-4 text-right font-medium tabular">{formatMoney(p.price, currency)}</td>
                          <td className="py-3.5 pr-4 text-right tabular text-ink-600">{margin === null ? <span className="text-ink-300">-</span> : `${margin.toFixed(1)}%`}</td>
                          <td className="py-3.5 pr-4">
                            <StockCell p={p} />
                          </td>
                          <td className="py-3.5 pr-4">
                            <Badge tone={PRODUCT_STATUS_TONE[p.status]} className="capitalize">
                              {p.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 pr-4 text-ink-500">{formatDate(p.updatedAt, { day: 'numeric', month: 'short' })}</td>
                          <td className="py-3.5 pr-4">
                            <Dropdown
                              trigger={({ toggle: t }) => (
                                <button onClick={t} className="grid size-8 place-items-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900" aria-label={`Actions for ${p.name}`}>
                                  <DotsThree className="size-5" weight="bold" />
                                </button>
                              )}
                            >
                              <DropdownItem icon={PencilSimple} onClick={() => openProduct(p)}>
                                Edit product
                              </DropdownItem>
                              <DropdownItem icon={Stack} onClick={() => setAdjust({ product: p, delta: '', mode: 'add' })}>
                                Adjust stock
                              </DropdownItem>
                              <DropdownItem icon={Copy} onClick={() => copySku(p.sku)}>
                                Copy SKU
                              </DropdownItem>
                              <DropdownSeparator />
                              <DropdownItem icon={Trash} tone="danger" onClick={() => setConfirm({ type: 'one', product: p })}>
                                Delete
                              </DropdownItem>
                            </Dropdown>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={pageSize} total={products.length} onPage={setPage} onPageSize={setPageSize} />
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        loading={deleting}
        title={confirm?.type === 'bulk' ? `Delete ${selected.size} products?` : `Delete ${confirm?.product?.name}?`}
        description="Past orders keep their line items, but the product leaves your catalog."
      />

      <AdjustStockModal state={adjust} onClose={() => setAdjust(null)} onDone={() => { bump(); refresh(); }} />
    </div>
  );
}

function AdjustStockModal({ state, onClose, onDone }) {
  const [mode, setMode] = useState('add');
  const [qty, setQty] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const p = state?.product;

  useEffect(() => {
    if (state) {
      setMode('add');
      setQty('');
      setErr('');
    }
  }, [state]);

  const n = Math.round(Number(qty) || 0);
  const next = p ? p.stock + (mode === 'add' ? n : -n) : 0;

  const save = async (e) => {
    e.preventDefault();
    if (n <= 0) return setErr('Enter a quantity above 0');
    if (next < 0) return setErr(`Only ${p.stock} units available`);
    setSaving(true);
    try {
      await api(`/products/${p._id}/adjust-stock`, { method: 'POST', body: { delta: mode === 'add' ? n : -n } });
      toast.success('Stock updated', { description: `${p.name} now has ${next} units.` });
      onDone();
      onClose();
    } catch (error) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!state}
      onClose={onClose}
      size="sm"
      icon={Stack}
      title="Adjust stock"
      description={p ? `${p.name}, ${p.sku}` : ''}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="adjust-form" loading={saving}>
            Update stock
          </Button>
        </>
      }
    >
      <form id="adjust-form" onSubmit={save} className="space-y-4">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'add', label: 'Add stock' },
            { value: 'remove', label: 'Remove stock' },
          ]}
        />
        <Field label="Quantity" htmlFor="adj-qty" error={err}>
          <Input id="adj-qty" type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" invalid={!!err} />
        </Field>
        <div className="flex items-center justify-between rounded-xl bg-canvas px-4 py-3 text-sm">
          <span className="text-ink-500">Current {p?.stock ?? 0}</span>
          <span className="font-semibold tabular">New level {Math.max(0, next)}</span>
        </div>
      </form>
    </Modal>
  );
}

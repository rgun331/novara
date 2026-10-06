import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Crown, DownloadSimple, EnvelopeSimple, MagnifyingGlass, Phone, Plus, Repeat, UserPlus, Users } from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import { formatDate, formatMoney, timeAgo } from '../../lib/format';
import { downloadCsv } from '../../lib/csv';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { Segmented } from '../../components/ui/Segmented';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Pagination } from '../../components/ui/Pagination';
import { StatCard } from '../../components/dashboard/StatCard';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { PeopleIllustration } from '../../components/brand/Illustrations';

const SEGMENT_META = {
  vip: { label: 'Top customer', tone: 'pine', icon: Crown },
  returning: { label: 'Returning', tone: 'slate', icon: Repeat },
  new: { label: 'New', tone: 'kraft', icon: UserPlus },
};

export default function Customers() {
  const { currency } = useAuth();
  const { version, openOrder } = useDashboard();
  const { data, loading } = useApi('/analytics/customers', { deps: [version] });
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const customers = useMemo(() => {
    const list = data?.customers || [];
    const sorted = [...list].sort((a, b) => b.spent - a.spent);
    const vipCut = Math.max(1, Math.ceil(sorted.length * 0.2));
    const vipKeys = new Set(sorted.filter((c) => c.spent > 0).slice(0, vipCut).map((c) => c.key));
    return list.map((c) => ({ ...c, segment: vipKeys.has(c.key) && list.length > 2 ? 'vip' : c.orders > 1 ? 'returning' : 'new' }));
  }, [data]);

  const filtered = customers.filter((c) => {
    if (segment !== 'all' && c.segment !== segment) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return [c.name, c.email, c.phone].some((v) => v && v.toLowerCase().includes(s));
  });
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalSpent = customers.reduce((s, c) => s + c.spent, 0);
  const returning = customers.filter((c) => c.orders > 1).length;

  const copy = async (v) => {
    try {
      await navigator.clipboard.writeText(v);
      toast.success('Copied', { description: v });
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Built automatically from your orders. No extra data entry."
        actions={
          <Button
            variant="secondary"
            disabled={!filtered.length}
            onClick={() =>
              downloadCsv('novara-customers.csv', filtered, [
                { label: 'Name', value: 'name' },
                { label: 'Email', value: 'email' },
                { label: 'Phone', value: 'phone' },
                { label: 'Address', value: 'address' },
                { label: 'Orders', value: 'orders' },
                { label: 'Total spent', value: 'spent' },
                { label: 'First order', value: (r) => formatDate(r.firstOrder) },
                { label: 'Last order', value: (r) => formatDate(r.lastOrder) },
              ])
            }
          >
            <DownloadSimple className="size-4" /> Export
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard index={0} label="Customers" value={customers.length} icon={Users} loading={loading && !data} />
        <StatCard index={1} label="Returning" value={returning} icon={Repeat} hint={customers.length ? `${Math.round((returning / customers.length) * 100)}% of customers` : ''} loading={loading && !data} />
        <StatCard index={2} label="Lifetime revenue" value={totalSpent} decimals={2} format={(v) => formatMoney(v, currency)} icon={Crown} loading={loading && !data} tone="ink" />
        <StatCard index={3} label="Avg. per customer" value={customers.length ? totalSpent / customers.length : 0} decimals={2} format={(v) => formatMoney(v, currency)} icon={UserPlus} loading={loading && !data} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-soft">
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative md:w-80">
            <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, email or phone" className="pl-10" aria-label="Search customers" />
          </div>
          <Segmented
            size="sm"
            value={segment}
            onChange={(v) => { setSegment(v); setPage(1); }}
            options={[
              { value: 'all', label: 'All' },
              { value: 'vip', label: 'Top' },
              { value: 'returning', label: 'Returning' },
              { value: 'new', label: 'New' },
            ]}
          />
        </div>

        {loading && !data ? (
          <TableSkeleton />
        ) : customers.length === 0 ? (
          <EmptyState
            illustration={PeopleIllustration}
            title="Your customer list grows with every order"
            description="Novara groups orders by email or name, so repeat buyers and their lifetime value show up here automatically."
            action={
              <Button onClick={openOrder}>
                <Plus weight="bold" className="size-4" /> Create an order
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState compact illustration={PeopleIllustration} title="No customers match" description="Try another search or segment." />
        ) : (
          <>
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-canvas/60 text-xs text-ink-500">
                    <th className="py-3 pl-5 pr-4 font-medium">Customer</th>
                    <th className="py-3 pr-4 font-medium">Contact</th>
                    <th className="py-3 pr-4 font-medium">Segment</th>
                    <th className="py-3 pr-4 text-right font-medium">Orders</th>
                    <th className="py-3 pr-4 text-right font-medium">Spent</th>
                    <th className="py-3 pr-5 font-medium">Last order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((c, i) => {
                    const seg = SEGMENT_META[c.segment];
                    return (
                      <motion.tr key={c.key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.025 } }} className="hover:bg-canvas/70">
                        <td className="py-3.5 pl-5 pr-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={c.name} size={36} />
                            <div className="min-w-0">
                              <Link to={`/dashboard/orders?q=${encodeURIComponent(c.email || c.name)}`} className="block max-w-[220px] truncate font-semibold text-ink-900 hover:text-pine-700">
                                {c.name}
                              </Link>
                              <p className="max-w-[220px] truncate text-xs text-ink-500">{c.address || `Customer since ${formatDate(c.firstOrder, { month: 'short', year: 'numeric' })}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4">
                          <div className="flex flex-col items-start gap-1 text-[13px] text-ink-600">
                            {c.email && (
                              <button onClick={() => copy(c.email)} className="inline-flex items-center gap-1.5 hover:text-pine-700">
                                <EnvelopeSimple className="size-3.5" /> {c.email}
                              </button>
                            )}
                            {c.phone && (
                              <button onClick={() => copy(c.phone)} className="inline-flex items-center gap-1.5 hover:text-pine-700">
                                <Phone className="size-3.5" /> {c.phone}
                              </button>
                            )}
                            {!c.email && !c.phone && <span className="text-ink-300">-</span>}
                          </div>
                        </td>
                        <td className="py-3.5 pr-4">
                          <Badge tone={seg.tone} icon={seg.icon}>
                            {seg.label}
                          </Badge>
                        </td>
                        <td className="py-3.5 pr-4 text-right tabular">{c.orders}</td>
                        <td className="py-3.5 pr-4 text-right font-semibold tabular">{formatMoney(c.spent, currency)}</td>
                        <td className="py-3.5 pr-5 text-ink-500">{timeAgo(c.lastOrder)}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize} />
          </>
        )}
      </div>
    </div>
  );
}

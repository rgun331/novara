import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Area,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion } from 'motion/react';
import { ChartLineUp, Coins, CurrencyCircleDollar, Receipt, ShoppingBagOpen, Stack, Users } from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import { formatMoney, formatNumber, titleCase } from '../../lib/format';
import { CHART, SERIES, STATUS_COLORS, shortDate, tooltipStyle } from '../../lib/chart';
import { Segmented } from '../../components/ui/Segmented';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatCard } from '../../components/dashboard/StatCard';
import { Card } from '../../components/dashboard/Card';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { ChartIllustration } from '../../components/brand/Illustrations';

const RANGES = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '12 months' },
];

function Legend({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.name} className="flex items-center gap-2.5 text-[13px]">
          <span className="size-2.5 rounded-full" style={{ background: it.color }} />
          <span className="flex-1 text-ink-600">{it.name}</span>
          <span className="font-semibold tabular text-ink-900">{it.display}</span>
        </li>
      ))}
    </ul>
  );
}

function BarList({ rows, format }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.key || r.name}>
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate font-medium text-ink-800">{r.name}</span>
            <span className="shrink-0 font-semibold tabular">{format(r.value)}</span>
          </div>
          {r.sub && <p className="font-mono text-[11px] text-ink-500">{r.sub}</p>}
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100/70">
            <motion.div
              className="h-full rounded-full"
              style={{ background: i === 0 ? CHART.pine : CHART.pineSoft }}
              initial={{ width: 0 }}
              whileInView={{ width: `${(r.value / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.06, ease: [0.25, 1, 0.5, 1] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Analytics() {
  const { currency } = useAuth();
  const { version } = useDashboard();
  const [range, setRange] = useState('30');
  const { data: a, loading } = useApi('/analytics', { params: { range }, deps: [version] });
  const money = (v) => formatMoney(v, currency);
  const compact = (v) => formatMoney(v, currency, { compact: true });
  const first = loading && !a;
  const hasOrders = a && (a.kpis.orders > 0 || Object.keys(a.statusBreakdown).length > 0);
  const label = RANGES.find((r) => r.value === range)?.label.toLowerCase();

  // Aggregate long ranges into weeks for readability
  const series =
    a && a.series.length > 120
      ? a.series.reduce((acc, d, i) => {
          if (i % 7 === 0) acc.push({ date: d.date, revenue: 0, orders: 0, units: 0 });
          const w = acc[acc.length - 1];
          w.revenue += d.revenue;
          w.orders += d.orders;
          w.units += d.units;
          return acc;
        }, [])
      : a?.series || [];

  const statusData = a ? Object.entries(a.statusBreakdown).map(([k, v]) => ({ name: titleCase(k), value: v, color: STATUS_COLORS[k] })) : [];
  const channelData = a ? Object.entries(a.channelRevenue).sort((x, y) => y[1] - x[1]).map(([k, v], i) => ({ name: titleCase(k), value: v, color: SERIES[i % SERIES.length] })) : [];
  const paymentData = a ? Object.entries(a.paymentBreakdown).sort((x, y) => y[1] - x[1]).map(([k, v]) => ({ name: titleCase(k), value: v })) : [];
  const inv = a?.inventory;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="How your shop is performing, and where the money comes from." actions={<Segmented value={range} onChange={setRange} options={RANGES} />} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 xl:gap-4">
        <StatCard index={0} label="Revenue" value={a?.kpis.revenue || 0} decimals={2} format={money} delta={a?.deltas.revenue} icon={CurrencyCircleDollar} loading={first} />
        <StatCard index={1} label="Orders" value={a?.kpis.orders || 0} delta={a?.deltas.orders} icon={ShoppingBagOpen} loading={first} />
        <StatCard index={2} label="Avg. order" value={a?.kpis.aov || 0} decimals={2} format={money} delta={a?.deltas.aov} icon={Receipt} loading={first} />
        <StatCard index={3} label="Units sold" value={a?.kpis.units || 0} delta={a?.deltas.units} icon={Stack} loading={first} />
        <StatCard index={4} label="Gross profit" value={a?.kpis.grossProfit || 0} decimals={2} format={money} delta={a?.deltas.grossProfit} icon={Coins} loading={first} tone="ink" />
        <StatCard index={5} label="Customers" value={a?.kpis.customers || 0} delta={a?.deltas.customers} icon={Users} loading={first} />
      </div>

      {first ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <Skeleton className="h-[360px] xl:col-span-2" />
          <Skeleton className="h-[360px]" />
        </div>
      ) : !hasOrders ? (
        <div className="rounded-2xl border border-line bg-paper shadow-soft">
          <EmptyState
            illustration={ChartIllustration}
            title={`No sales in the last ${label}`}
            description="Charts for revenue, products, channels and customers fill in automatically as orders come in. Try a longer range or create an order."
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            <Card title="Revenue and orders" description={`Last ${label}${a.series.length > 120 ? ', grouped by week' : ''}`} className="xl:col-span-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={series} margin={{ top: 8, right: 0, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="an-rev" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={CHART.pine} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={CHART.pine} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="3 4" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={shortDate} axisLine={false} tickLine={false} tick={{ fill: CHART.axis, fontSize: 11 }} minTickGap={28} />
                    <YAxis yAxisId="r" axisLine={false} tickLine={false} tick={{ fill: CHART.axis, fontSize: 11 }} tickFormatter={compact} width={64} />
                    <YAxis yAxisId="o" orientation="right" axisLine={false} tickLine={false} tick={{ fill: CHART.axis, fontSize: 11 }} allowDecimals={false} width={32} />
                    <Tooltip
                      {...tooltipStyle}
                      labelFormatter={shortDate}
                      formatter={(v, n) => (n === 'revenue' ? [money(v), 'Revenue'] : [v, 'Orders'])}
                    />
                    <Bar yAxisId="o" dataKey="orders" fill={CHART.kraft} fillOpacity={0.55} radius={[4, 4, 0, 0]} maxBarSize={18} />
                    <Area yAxisId="r" type="monotone" dataKey="revenue" stroke={CHART.pine} strokeWidth={2.2} fill="url(#an-rev)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex gap-5 text-xs text-ink-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded bg-pine-600" /> Revenue
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-kraft-300" /> Orders
                </span>
              </div>
            </Card>

            <Card title="Order status" description="All orders in range">
              <div className="relative mx-auto h-[190px] max-w-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" innerRadius={62} outerRadius={88} paddingAngle={2} stroke="none" cornerRadius={4}>
                      {statusData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="font-display text-3xl font-semibold tabular">{statusData.reduce((s, d) => s + d.value, 0)}</p>
                    <p className="text-xs text-ink-500">orders</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Legend items={statusData.map((d) => ({ ...d, display: d.value }))} />
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <Card title="Top products" description="By revenue">
              {a.topProducts.length ? (
                <BarList rows={a.topProducts.map((p) => ({ key: p.id, name: p.name, sub: `${p.sku}, ${p.units} sold`, value: p.revenue }))} format={money} />
              ) : (
                <p className="text-sm text-ink-500">No product sales yet.</p>
              )}
            </Card>

            <Card title="Revenue by category">
              {a.categoryRevenue.length ? <BarList rows={a.categoryRevenue.map((c) => ({ name: c.name, value: c.revenue }))} format={money} /> : <p className="text-sm text-ink-500">No category data yet.</p>}
            </Card>

            <Card title="Sales channels" description="Revenue per channel" className="lg:col-span-2 xl:col-span-1">
              <div className="flex h-3 overflow-hidden rounded-full bg-ink-100">
                {channelData.map((c) => (
                  <motion.div
                    key={c.name}
                    initial={{ width: 0 }}
                    animate={{ width: `${(c.value / Math.max(1, a.kpis.revenue)) * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                    style={{ background: c.color }}
                  />
                ))}
              </div>
              <div className="mt-5">
                <Legend items={channelData.map((c) => ({ ...c, display: money(c.value) }))} />
              </div>
              {paymentData.length > 0 && (
                <div className="mt-6 border-t border-line pt-4">
                  <p className="mb-3 text-xs font-medium text-ink-500">Payment methods</p>
                  <div className="flex flex-wrap gap-2">
                    {paymentData.map((p) => (
                      <span key={p.name} className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1 text-xs ring-1 ring-line">
                        {p.name} <span className="font-semibold tabular">{p.value}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <Card title="Busiest days" description="Revenue by weekday">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={a.weekdays} margin={{ top: 8, right: 0, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke={CHART.grid} strokeDasharray="3 4" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: CHART.axis, fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: CHART.axis, fontSize: 11 }} tickFormatter={compact} width={64} />
                    <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(47,93,75,0.06)' }} formatter={(v, n) => (n === 'revenue' ? [money(v), 'Revenue'] : [v, 'Orders'])} />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={44}>
                      {a.weekdays.map((d) => {
                        const max = Math.max(...a.weekdays.map((w) => w.revenue));
                        return <Cell key={d.day} fill={d.revenue === max && max > 0 ? CHART.pine : CHART.pineSoft} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Inventory health" description={`${inv.products} products, ${formatNumber(inv.units)} units`}>
              <div className="flex h-3 gap-1 overflow-hidden rounded-full">
                {[
                  [inv.healthy, CHART.pine],
                  [inv.low, CHART.amber],
                  [inv.out, CHART.rose],
                ].map(([v, c], i) =>
                  v > 0 ? <motion.div key={i} className="h-full rounded-full" style={{ background: c }} initial={{ flexGrow: 0 }} animate={{ flexGrow: v }} transition={{ duration: 0.8 }} /> : null
                )}
              </div>
              <div className="mt-5">
                <Legend
                  items={[
                    { name: 'Healthy', color: CHART.pine, display: inv.healthy },
                    { name: 'Low stock', color: CHART.amber, display: inv.low },
                    { name: 'Out of stock', color: CHART.rose, display: inv.out },
                  ]}
                />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">
                <div>
                  <p className="text-xs text-ink-500">Retail value</p>
                  <p className="mt-0.5 font-display text-lg font-semibold tabular">{money(inv.value)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500">Cost value</p>
                  <p className="mt-0.5 font-display text-lg font-semibold tabular">{money(inv.cost)}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card title="Units sold" description="Daily volume" bodyClassName="pt-2">
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={series} margin={{ top: 8, right: 0, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 4" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={shortDate} axisLine={false} tickLine={false} tick={{ fill: CHART.axis, fontSize: 11 }} minTickGap={28} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: CHART.axis, fontSize: 11 }} allowDecimals={false} width={40} />
                  <Tooltip {...tooltipStyle} labelFormatter={shortDate} formatter={(v) => [v, 'Units']} />
                  <Line type="stepAfter" dataKey="units" stroke={CHART.ink} strokeWidth={1.6} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-500">
              <ChartLineUp className="size-3.5" /> {formatNumber(a.kpis.units)} units across {formatNumber(a.kpis.orders)} orders
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

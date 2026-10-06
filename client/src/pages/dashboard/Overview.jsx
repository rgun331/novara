import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  ArrowRight,
  CheckCircle,
  Circle,
  CurrencyCircleDollar,
  Package,
  Plus,
  Receipt,
  ShoppingBagOpen,
  Stack,
  Warning,
} from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import { useNotifications } from '../../context/NotificationsContext';
import { formatMoney, formatNumber, greeting, timeAgo, titleCase } from '../../lib/format';
import { CHART, shortDate, tooltipStyle } from '../../lib/chart';
import { StatCard } from '../../components/dashboard/StatCard';
import { Card } from '../../components/dashboard/Card';
import { Button } from '../../components/ui/Button';
import { Badge, ORDER_STATUS_TONE } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { BoxesIllustration, ChartIllustration, ReceiptIllustration } from '../../components/brand/Illustrations';
import { metaFor } from '../../components/dashboard/notificationMeta';
import { LogoMark } from '../../components/brand/Logo';
import { cn } from '../../lib/cn';

function Onboarding({ user, analytics, onAddProduct, onAddOrder }) {
  const steps = [
    { done: analytics.inventory.products > 0, label: 'Add your first product', action: onAddProduct },
    { done: analytics.kpis.orders > 0 || Object.keys(analytics.statusBreakdown || {}).length > 0, label: 'Create your first order', action: onAddOrder },
    { done: !!user.avatarUrl, label: 'Upload a profile photo', to: '/dashboard/settings' },
    { done: user.preferences?.currency !== 'USD' || !!user.phone || !!user.location, label: 'Set currency and details', to: '/dashboard/settings?tab=preferences' },
  ];
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-paper">Get set up</p>
        <span className="text-xs text-ink-300 tabular">
          {done} of {steps.length}
        </span>
      </div>
      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div className="h-full rounded-full bg-kraft-300" initial={{ width: 0 }} animate={{ width: `${(done / steps.length) * 100}%` }} transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }} />
      </div>
      <ul className="mt-3 space-y-1">
        {steps.map((s) => {
          const inner = (
            <>
              {s.done ? <CheckCircle className="size-[18px] text-kraft-300" weight="fill" /> : <Circle className="size-[18px] text-ink-400" />}
              <span className={cn('flex-1 text-left', s.done && 'text-ink-400 line-through decoration-ink-500')}>{s.label}</span>
              {!s.done && <ArrowRight className="size-3.5 text-ink-400" weight="bold" />}
            </>
          );
          const cls = 'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-ink-100 transition hover:bg-white/[0.06]';
          return (
            <li key={s.label}>
              {s.to ? (
                <Link to={s.to} className={cls}>
                  {inner}
                </Link>
              ) : (
                <button onClick={s.done ? undefined : s.action} className={cls}>
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Overview() {
  const { user, currency } = useAuth();
  const { version, openProduct, openOrder } = useDashboard();
  const { items: notifications } = useNotifications();
  const { data: a, loading } = useApi('/analytics', { params: { range: 30 }, deps: [version] });
  const recent = useApi('/orders', { params: { limit: 6 }, deps: [version] });

  const firstName = user?.name?.split(' ')[0] || 'there';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const hasSales = a && a.series.some((d) => d.revenue > 0);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
        className="grain relative grid gap-6 overflow-hidden rounded-[24px] bg-ink-900 p-6 text-paper md:p-8 lg:grid-cols-[1.4fr_1fr]"
      >
        <LogoMark tone="pine" className="pointer-events-none absolute -bottom-16 -right-10 size-64 opacity-[0.08] lg:hidden" />
        <div className="relative flex flex-col justify-between gap-8">
          <div>
            <p className="text-[13px] text-ink-400">{today}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] md:text-[2.4rem]">
              {greeting()}, {firstName}.
            </h2>
            <p className="mt-2 max-w-[48ch] text-[15px] leading-relaxed text-ink-300">
              {loading || !a
                ? 'Loading your workspace.'
                : a.inventory.products === 0
                  ? 'Your workspace is ready. Add a product to start tracking stock and taking orders.'
                  : `${formatNumber(a.kpis.orders)} orders and ${formatMoney(a.kpis.revenue, currency)} in the last 30 days. ${a.inventory.low + a.inventory.out} products need attention.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="light" onClick={() => openProduct()}>
              <Plus weight="bold" className="size-4" /> Add product
            </Button>
            <Button onClick={openOrder} className="bg-white/10 text-paper ring-1 ring-white/15 hover:bg-white/15">
              <Receipt className="size-4" /> Create order
            </Button>
          </div>
        </div>
        <div className="relative">{a && user && <Onboarding user={user} analytics={a} onAddProduct={() => openProduct()} onAddOrder={openOrder} />}</div>
      </motion.section>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard index={0} label="Revenue, 30 days" value={a?.kpis.revenue || 0} decimals={2} format={(v) => formatMoney(v, currency)} delta={a?.deltas.revenue} hint="vs previous" icon={CurrencyCircleDollar} loading={loading && !a} />
        <StatCard index={1} label="Orders" value={a?.kpis.orders || 0} delta={a?.deltas.orders} hint="vs previous" icon={ShoppingBagOpen} loading={loading && !a} />
        <StatCard index={2} label="Avg. order value" value={a?.kpis.aov || 0} decimals={2} format={(v) => formatMoney(v, currency)} delta={a?.deltas.aov} icon={Receipt} loading={loading && !a} />
        <StatCard index={3} label="Inventory value" value={a?.inventory.value || 0} decimals={2} format={(v) => formatMoney(v, currency)} hint={`${formatNumber(a?.inventory.units || 0)} units`} icon={Stack} loading={loading && !a} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card
          title="Revenue"
          description="Daily revenue over the last 30 days"
          action={
            <Link to="/dashboard/analytics" className="inline-flex items-center gap-1 text-[13px] font-medium text-pine-700 hover:underline">
              Analytics <ArrowRight className="size-3.5" weight="bold" />
            </Link>
          }
        >
          {loading && !a ? (
            <Skeleton className="h-64 w-full" />
          ) : hasSales ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={a.series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ov-rev" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={CHART.pine} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={CHART.pine} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 4" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={shortDate} axisLine={false} tickLine={false} tick={{ fill: CHART.axis, fontSize: 11 }} minTickGap={28} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: CHART.axis, fontSize: 11 }} tickFormatter={(v) => formatMoney(v, currency, { compact: true })} width={64} />
                  <Tooltip {...tooltipStyle} labelFormatter={shortDate} formatter={(v) => [formatMoney(v, currency), 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke={CHART.pine} strokeWidth={2.2} fill="url(#ov-rev)" animationDuration={1100} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState compact illustration={ChartIllustration} title="Your chart starts with a sale" description="Revenue appears here as soon as you create your first order." />
          )}
        </Card>

        <Card
          title="Needs restock"
          description="At or below their alert level"
          action={
            <Link to="/dashboard/products" className="inline-flex items-center gap-1 text-[13px] font-medium text-pine-700 hover:underline">
              Products <ArrowRight className="size-3.5" weight="bold" />
            </Link>
          }
          bodyClassName="p-3"
        >
          {loading && !a ? (
            <div className="space-y-2 p-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : a?.lowStock.length ? (
            <ul className="space-y-1">
              {a.lowStock.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 hover:bg-canvas">
                  <span className={cn('grid size-9 place-items-center rounded-lg', p.stock <= 0 ? 'bg-rose-soft text-rose-ink' : 'bg-amber-soft text-amber-ink')}>
                    <Warning className="size-4.5" weight="bold" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">{p.name}</p>
                    <p className="truncate font-mono text-[11px] text-ink-500">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-semibold tabular', p.stock <= 0 ? 'text-rose-ink' : 'text-amber-ink')}>{p.stock}</p>
                    <p className="text-[11px] text-ink-500">of {p.threshold}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              compact
              illustration={BoxesIllustration}
              title={a?.inventory.products ? 'Stock looks healthy' : 'No products yet'}
              description={a?.inventory.products ? 'Nothing is at or below its alert level.' : 'Products you add will be monitored here.'}
            />
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card
          title="Recent orders"
          action={
            <Link to="/dashboard/orders" className="inline-flex items-center gap-1 text-[13px] font-medium text-pine-700 hover:underline">
              All orders <ArrowRight className="size-3.5" weight="bold" />
            </Link>
          }
          bodyClassName="p-2 pt-3"
        >
          {recent.loading && !recent.data ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recent.data?.orders.length ? (
            <ul className="divide-y divide-line">
              {recent.data.orders.map((o) => (
                <li key={o._id}>
                  <Link to={`/dashboard/orders?q=${o.orderNumber}`} className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-canvas">
                    <Avatar name={o.customer.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{o.customer.name}</p>
                      <p className="text-xs text-ink-500">
                        <span className="font-mono">{o.orderNumber}</span>, {timeAgo(o.createdAt)}
                      </p>
                    </div>
                    <Badge tone={ORDER_STATUS_TONE[o.status]} className="max-sm:hidden">
                      {titleCase(o.status)}
                    </Badge>
                    <span className="w-24 text-right text-sm font-semibold tabular">{formatMoney(o.total, currency)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              compact
              illustration={ReceiptIllustration}
              title="No orders yet"
              description="Orders you create will show up here."
              action={
                <Button size="sm" onClick={openOrder}>
                  <Plus weight="bold" className="size-3.5" /> Create order
                </Button>
              }
            />
          )}
        </Card>

        <Card
          title="Activity"
          action={
            <Link to="/dashboard/notifications" className="inline-flex items-center gap-1 text-[13px] font-medium text-pine-700 hover:underline">
              View all <ArrowRight className="size-3.5" weight="bold" />
            </Link>
          }
          bodyClassName="p-5 pt-4"
        >
          {notifications.length ? (
            <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-line">
              {notifications.slice(0, 6).map((n) => {
                const m = metaFor(n.type);
                return (
                  <li key={n._id} className="relative flex gap-3">
                    <span className={cn('relative z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-paper', m.tone)}>
                      <m.icon className="size-3.5" weight="bold" />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="truncate text-[13px] font-medium text-ink-900">{n.title}</p>
                      <p className="text-xs text-ink-500">{timeAgo(n.createdAt)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="py-6 text-center text-sm text-ink-500">Activity from your workspace will appear here.</p>
          )}
        </Card>
      </div>

      {a && a.inventory.products > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper px-5 py-4 text-[13px] text-ink-600 shadow-soft">
          <Package className="size-5 text-pine-600" weight="duotone" />
          <span>
            <span className="font-semibold text-ink-900 tabular">{a.inventory.products}</span> products,{' '}
            <span className="font-semibold text-ink-900 tabular">{a.inventory.healthy}</span> healthy,{' '}
            <span className="font-semibold text-amber-ink tabular">{a.inventory.low}</span> low and{' '}
            <span className="font-semibold text-rose-ink tabular">{a.inventory.out}</span> out of stock.
          </span>
        </div>
      )}
    </div>
  );
}

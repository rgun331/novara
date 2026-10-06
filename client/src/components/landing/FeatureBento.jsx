import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { ArrowsClockwise, Bell, CheckCircle, Package, Truck, Warning } from '@phosphor-icons/react';
import { skuParts } from '../../lib/sku';
import { Reveal } from './Reveal';

const CATEGORIES = ['Home & Living', 'Apparel', 'Beauty', 'Stationery'];
const SEGMENT_STYLE = {
  prefix: 'bg-ink-900 text-paper',
  category: 'bg-pine-600 text-paper',
  name: 'bg-pine-100 text-pine-800',
  variant: 'bg-kraft-100 text-[#6b4e26]',
  seq: 'bg-paper text-ink-700 ring-1 ring-line-strong',
};

function SkuDemo() {
  const [name, setName] = useState('Stoneware Mug 350ml');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const parts = useMemo(() => skuParts({ prefix: 'KC', category, name, seq: 42 }), [name, category]);

  return (
    <div className="mt-6 space-y-4">
      <div>
        <label htmlFor="demo-name" className="text-[13px] font-medium text-ink-700">
          Product name
        </label>
        <input
          id="demo-name"
          value={name}
          maxLength={48}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-white px-3.5 text-[15px] outline-none transition focus:border-pine-500 focus:ring-4 focus:ring-pine-100"
        />
      </div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Category">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            role="radio"
            aria-checked={c === category}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition ${c === category ? 'bg-ink-900 text-paper' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-line bg-canvas p-4">
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[15px] sm:text-base">
          <AnimatePresence mode="popLayout" initial={false}>
            {parts.map((p, i) => (
              <motion.span key={p.key + p.value} layout className="flex items-center gap-1.5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ type: 'spring', stiffness: 420, damping: 30 }}>
                <span className={`rounded-lg px-2 py-1 tracking-wide ${SEGMENT_STYLE[p.key]}`}>{p.value}</span>
                {i < parts.length - 1 && <span className="text-ink-300">-</span>}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
          {parts.map((p) => (
            <span key={p.key} className="flex items-center gap-1.5">
              <span className={`size-2 rounded-sm ${SEGMENT_STYLE[p.key].split(' ')[0]}`} />
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const ALERTS = [
  { icon: Warning, tone: 'bg-amber-soft text-amber-ink', title: 'Low stock: Linen Apron', body: '4 units left, threshold is 10' },
  { icon: Package, tone: 'bg-pine-50 text-pine-700', title: 'New order KC-1052', body: 'Hamza Qureshi ordered 2 items' },
  { icon: Truck, tone: 'bg-slate-soft text-slate-ink', title: 'KC-1049 shipped', body: 'Moved from Processing to Shipped' },
  { icon: ArrowsClockwise, tone: 'bg-pine-50 text-pine-700', title: 'Restocked Cardamom Tea', body: '+60 units, now 72 in stock' },
];

function AlertFeed() {
  const [start, setStart] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => setStart((s) => (s + 1) % ALERTS.length), 2800);
    return () => clearInterval(id);
  }, []);
  const visible = [0, 1, 2].map((o) => ALERTS[(start + o) % ALERTS.length]);
  return (
    <div className="relative mt-6 space-y-2.5">
      <AnimatePresence initial={false} mode="popLayout">
        {visible.map((a, i) => (
          <motion.div
            key={a.title}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1 - i * 0.22, y: 0, scale: 1 - i * 0.02 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="flex items-start gap-3 rounded-2xl border border-line bg-paper p-3 shadow-soft"
          >
            <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${a.tone}`}>
              <a.icon className="size-4" weight="bold" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink-900">{a.title}</p>
              <p className="truncate text-xs text-ink-500">{a.body}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const SAMPLE = [
  { d: 'Mon', r: 820 },
  { d: 'Tue', r: 960 },
  { d: 'Wed', r: 870 },
  { d: 'Thu', r: 1240 },
  { d: 'Fri', r: 1490 },
  { d: 'Sat', r: 1820 },
  { d: 'Sun', r: 1360 },
];

function MiniChart() {
  return (
    <div className="mt-6 h-44 w-full lg:h-auto lg:min-h-44 lg:flex-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={SAMPLE} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="bento-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8DB39F" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#8DB39F" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: '#8A948E', fontSize: 11 }} />
          <Tooltip
            cursor={{ stroke: '#3A4540' }}
            contentStyle={{ background: '#121815', border: '1px solid #26302B', borderRadius: 12, fontSize: 12, color: '#FBFBF9' }}
            formatter={(v) => [`$${v}`, 'Revenue']}
          />
          <Area type="monotone" dataKey="r" stroke="#B9D1C4" strokeWidth={2.2} fill="url(#bento-area)" animationDuration={1400} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FeatureBento() {
  return (
    <section id="features" className="mx-auto max-w-[1320px] scroll-mt-24 px-5 py-24 md:px-8 md:py-32">
      <Reveal className="max-w-2xl">
        <h2 data-reveal className="font-display text-4xl font-semibold leading-[1.05] tracking-[-0.035em] md:text-5xl">
          Everything a growing shop runs on.
        </h2>
        <p data-reveal className="mt-4 max-w-[52ch] text-lg leading-relaxed text-ink-600">
          Products, orders, alerts and numbers share one source of truth, so the stock count on your shelf matches the one on your screen.
        </p>
      </Reveal>

      <Reveal className="mt-14 grid gap-4 lg:grid-cols-6" stagger={0.1}>
        {/* SKU generator */}
        <article data-reveal className="grid overflow-hidden rounded-[24px] border border-line bg-paper shadow-soft lg:col-span-4 lg:grid-cols-[1.15fr_1fr]">
          <div className="p-6 md:p-8">
            <h3 className="font-display text-2xl font-semibold tracking-tight">SKUs that write themselves</h3>
            <p className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-ink-600">Type a name. Novara builds a readable, unique code from your brand, category and product. Try it.</p>
            <SkuDemo />
          </div>
          <div className="relative hidden min-h-[320px] lg:block">
            <img src="/images/feature-shelves.webp" alt="Organized warehouse shelves with labeled boxes and bins" loading="lazy" className="absolute inset-0 size-full object-cover" />
          </div>
        </article>

        {/* Alerts */}
        <article data-reveal className="overflow-hidden rounded-[24px] border border-line bg-[linear-gradient(180deg,#EEF4F1_0%,#FBFBF9_70%)] p-6 md:p-8 lg:col-span-2">
          <span className="grid size-10 place-items-center rounded-xl bg-paper text-pine-700 shadow-soft">
            <Bell className="size-5" weight="duotone" />
          </span>
          <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight">Alerts before you run out</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-600">Low stock, new orders and status changes land in one inbox you control.</p>
          <AlertFeed />
        </article>

        {/* Orders */}
        <article data-reveal className="overflow-hidden rounded-[24px] border border-line bg-paper shadow-soft lg:col-span-2">
          <div className="relative h-52 overflow-hidden">
            <img src="/images/feature-courier.webp" alt="A parcel being handed over at a doorway" loading="lazy" className="size-full object-cover transition-transform duration-700 hover:scale-105" />
          </div>
          <div className="p-6 md:p-7">
            <h3 className="font-display text-2xl font-semibold tracking-tight">Orders without the spreadsheet</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-600">Pick products, and totals, tax and stock update on their own.</p>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-medium">
              {['Pending', 'Processing', 'Shipped', 'Delivered'].map((s, i) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={`rounded-full px-2.5 py-1 ${i === 3 ? 'bg-ink-900 text-paper' : 'bg-ink-100 text-ink-600'}`}>
                    {i === 3 && <CheckCircle weight="fill" className="-mt-0.5 mr-1 inline size-3.5" />}
                    {s}
                  </span>
                  {i < 3 && <span className="h-px w-2 bg-ink-300" />}
                </span>
              ))}
            </div>
          </div>
        </article>

        {/* Analytics */}
        <article data-reveal className="grain relative flex flex-col overflow-hidden rounded-[24px] border border-ink-800 bg-ink-900 p-6 text-paper md:p-8 lg:col-span-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h3 className="font-display text-2xl font-semibold tracking-tight">Know what sells, and when</h3>
              <p className="mt-2 max-w-[46ch] text-[15px] leading-relaxed text-ink-300">Revenue, best sellers, busy weekdays and inventory value, calculated from your real orders.</p>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-ink-400">Avg. order</p>
                <p className="mt-0.5 font-display text-xl font-semibold tabular">$61.40</p>
              </div>
              <div>
                <p className="text-ink-400">Best day</p>
                <p className="mt-0.5 font-display text-xl font-semibold">Saturday</p>
              </div>
            </div>
          </div>
          <MiniChart />
          <p className="mt-1 text-right text-[11px] text-ink-500">Sample data</p>
        </article>
      </Reveal>
    </section>
  );
}

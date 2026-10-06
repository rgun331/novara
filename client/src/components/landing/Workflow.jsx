import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Barcode, ChartLineUp, CheckCircle, CurrencyDollar, Package, Plus, ShoppingBagOpen, Star } from '@phosphor-icons/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

function AddVisual() {
  const rows = [
    { name: 'Stoneware Mug 350ml', sku: 'KC-HOL-STM-350-0001', stock: 48, tone: 'bg-pine-50 text-pine-700' },
    { name: 'Linen Apron, Olive', sku: 'KC-APP-LAO-0002', stock: 4, tone: 'bg-amber-soft text-amber-ink' },
    { name: 'Speckled Bowl Set', sku: 'KC-HOL-SBS-0003', stock: 22, tone: 'bg-pine-50 text-pine-700' },
  ];
  return (
    <div className="w-full rounded-[22px] border border-line bg-paper p-4 shadow-lift">
      <div className="flex items-center justify-between px-1 pb-3">
        <span className="text-sm font-semibold">Products</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-ink-900 px-3 py-1.5 text-xs font-medium text-paper">
          <Plus weight="bold" className="size-3" /> Add product
        </span>
      </div>
      <div className="divide-y divide-line rounded-2xl border border-line">
        {rows.map((r) => (
          <div key={r.sku} className="flex items-center gap-3 px-3 py-3">
            <span className="grid size-9 place-items-center rounded-xl bg-canvas text-ink-500">
              <Package className="size-4.5" weight="duotone" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{r.name}</p>
              <p className="truncate font-mono text-[11px] text-ink-500">{r.sku}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium tabular ${r.tone}`}>{r.stock} in stock</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SellVisual() {
  return (
    <div className="w-full rounded-[22px] border border-line bg-paper p-5 shadow-lift">
      <div className="flex items-center gap-3">
        <img src="/images/portrait-1.webp" alt="" className="size-10 rounded-full object-cover" loading="lazy" />
        <div>
          <p className="text-sm font-semibold">Hamza Qureshi</p>
          <p className="text-xs text-ink-500">Order KC-1052</p>
        </div>
        <span className="ml-auto rounded-full bg-amber-soft px-2 py-0.5 text-xs font-medium text-amber-ink">Pending</span>
      </div>
      <div className="mt-4 space-y-2 text-[13px]">
        {[
          ['Speckled Bowl Set', '1 x $54.00'],
          ['Stoneware Mug 350ml', '2 x $18.50'],
        ].map(([n, p]) => (
          <div key={n} className="flex justify-between rounded-xl bg-canvas px-3 py-2.5">
            <span className="text-ink-700">{n}</span>
            <span className="tabular text-ink-500">{p}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-end justify-between border-t border-dashed border-line-strong pt-4">
        <div className="text-xs text-ink-500">
          <p>Shipping $6.00</p>
          <p>Tax $9.10</p>
        </div>
        <p className="font-display text-2xl font-semibold tracking-tight tabular">$106.10</p>
      </div>
    </div>
  );
}

function ReviewVisual() {
  const bars = [38, 52, 44, 70, 62, 88, 74];
  return (
    <div className="w-full rounded-[22px] border border-line bg-paper p-5 shadow-lift">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-ink-900 p-4 text-paper">
          <CurrencyDollar className="size-5 text-kraft-300" weight="duotone" />
          <p className="mt-3 text-xs text-ink-400">Revenue</p>
          <p className="font-display text-xl font-semibold tabular">$12,480</p>
        </div>
        <div className="rounded-2xl bg-pine-50 p-4">
          <ShoppingBagOpen className="size-5 text-pine-700" weight="duotone" />
          <p className="mt-3 text-xs text-ink-500">Orders</p>
          <p className="font-display text-xl font-semibold tabular">203</p>
        </div>
      </div>
      <div className="mt-4 flex h-24 items-end gap-2">
        {bars.map((h, i) => (
          <div key={i} className={`flex-1 rounded-t-md ${i === 5 ? 'bg-pine-600' : 'bg-pine-100'}`} style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-canvas px-3 py-2.5 text-[13px]">
        <Star className="size-4 text-kraft-500" weight="fill" />
        <span className="text-ink-600">Best seller:</span>
        <span className="font-semibold">Stoneware Mug 350ml</span>
      </div>
    </div>
  );
}

const PANELS = [
  {
    verb: 'Add',
    icon: Barcode,
    title: 'Add a product in under a minute.',
    body: 'Name, price and stock. Novara generates the SKU, tracks the threshold and files it in your catalog.',
    visual: <AddVisual />,
  },
  {
    verb: 'Sell',
    icon: ShoppingBagOpen,
    title: 'Take an order, stock moves with it.',
    body: 'Choose products and quantities. Totals, tax and inventory update the moment you save.',
    visual: <SellVisual />,
  },
  {
    verb: 'Pack',
    icon: CheckCircle,
    title: 'Move every order to the door.',
    body: 'Mark orders processing, shipped or delivered. Cancelled orders return their stock automatically.',
    visual: (
      <div className="relative aspect-[4/5] w-full max-w-[360px] overflow-hidden rounded-[22px] shadow-lift">
        <img src="/images/auth-packing.webp" alt="A shop owner sealing a parcel at his packing table" loading="lazy" className="size-full object-cover" />
      </div>
    ),
  },
  {
    verb: 'Review',
    icon: ChartLineUp,
    title: 'See what is working, every week.',
    body: 'Revenue, best sellers, busy weekdays and inventory value are calculated from real orders.',
    visual: <ReviewVisual />,
  },
];

export function Workflow() {
  const section = useRef(null);
  const track = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const panels = gsap.utils.toArray('.wf-panel');
        const distance = () => track.current.scrollWidth - window.innerWidth;
        const tween = gsap.to(track.current, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        gsap.to('.wf-progress', {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: section.current, start: 'top top', end: () => `+=${distance()}`, scrub: true },
        });
        panels.forEach((p) => {
          gsap.from(p.querySelector('.wf-visual'), {
            y: 40,
            opacity: 0.4,
            scale: 0.96,
            ease: 'power2.out',
            scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 85%', end: 'left 40%', scrub: true },
          });
        });
      });
    },
    { scope: section }
  );

  return (
    <section id="workflow" ref={section} className="relative scroll-mt-0 overflow-hidden bg-paper lg:h-[100dvh]">
      <div className="mx-auto max-w-[1320px] px-5 pt-24 md:px-8 lg:pt-24">
        <h2 className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-[-0.035em] md:text-5xl">From first product to repeat customer.</h2>
      </div>

      <div ref={track} className="mt-12 flex flex-col gap-6 px-5 pb-24 md:px-8 lg:mt-14 lg:w-max lg:flex-row lg:gap-8 lg:pb-0 lg:pl-[max(2rem,calc((100vw-1320px)/2+2rem))] lg:pr-[10vw]">
        {PANELS.map((p) => (
          <article key={p.verb} className="wf-panel grid shrink-0 gap-8 rounded-[28px] border border-line bg-canvas p-6 md:p-10 lg:h-[min(60dvh,520px)] lg:w-[min(78vw,980px)] lg:grid-cols-[1fr_1.05fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 font-display text-[3.4rem] font-semibold leading-none tracking-[-0.05em] text-pine-600 md:text-[4.5rem]">
                {p.verb}
                <p.icon className="size-9 text-ink-300 md:size-11" weight="thin" />
              </span>
              <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight md:text-[1.75rem]">{p.title}</h3>
              <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed text-ink-600 md:text-base">{p.body}</p>
            </div>
            <div className="wf-visual flex justify-center lg:justify-end">{p.visual}</div>
          </article>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-10 mx-auto hidden h-[3px] max-w-[1320px] px-8 lg:block">
        <div className="h-full overflow-hidden rounded-full bg-ink-100">
          <div className="wf-progress h-full origin-left scale-x-0 rounded-full bg-pine-600" />
        </div>
      </div>
    </section>
  );
}

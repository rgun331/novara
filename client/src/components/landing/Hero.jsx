import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { ArrowRight, Barcode, CheckCircle, Package, TrendUp } from '@phosphor-icons/react';
import { Button } from '../ui/Button';

gsap.registerPlugin(useGSAP);

const SKUS = ['KC-HOL-STM-350-0042', 'KC-APP-LOO-0043', 'KC-BEA-RCS-120-0044', 'KC-STA-DGN-0045'];

function useCyclingType(words, { typeMs = 55, holdMs = 1900 } = {}) {
  const [text, setText] = useState('');
  useEffect(() => {
    let i = 0;
    let c = 0;
    let deleting = false;
    let timer;
    const tick = () => {
      const word = words[i % words.length];
      if (!deleting) {
        c += 1;
        setText(word.slice(0, c));
        if (c === word.length) {
          deleting = true;
          timer = setTimeout(tick, holdMs);
          return;
        }
      } else {
        c -= 2;
        setText(word.slice(0, Math.max(0, c)));
        if (c <= 0) {
          deleting = false;
          i += 1;
        }
      }
      timer = setTimeout(tick, deleting ? 22 : typeMs);
    };
    timer = setTimeout(tick, 1200);
    return () => clearTimeout(timer);
  }, [words, typeMs, holdMs]);
  return text;
}

function Sparkline() {
  const d = 'M2 46 C 18 44, 24 30, 40 33 S 62 40, 74 26 S 98 18, 110 22 S 134 8, 158 6';
  return (
    <svg viewBox="0 0 160 52" className="h-12 w-full" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3F735D" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#3F735D" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L158 52 L2 52 Z`} fill="url(#spark-fill)" className="hero-spark-fill" />
      <path d={d} stroke="#2F5D4B" strokeWidth="2.2" strokeLinecap="round" className="hero-spark" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
      <circle cx="158" cy="6" r="3.5" fill="#2F5D4B" className="hero-spark-dot" opacity="0" />
    </svg>
  );
}

export function Hero() {
  const root = useRef(null);
  const sku = useCyclingType(SKUS);

  // Pointer parallax for the floating cards (motion values, no re-renders)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 20 });
  const sy = useSpring(my, { stiffness: 90, damping: 20 });
  const nearX = useTransform(sx, (v) => v * 18);
  const nearY = useTransform(sy, (v) => v * 14);
  const farX = useTransform(sx, (v) => v * -10);
  const farY = useTransform(sy, (v) => v * -8);
  const imgX = useTransform(sx, (v) => v * -6);

  const onMove = (e) => {
    const r = root.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.from('.hero-word', { yPercent: 110, duration: 1.1, stagger: 0.06 })
          .from('.hero-sub', { y: 18, opacity: 0, duration: 0.9 }, '-=0.75')
          .from('.hero-cta > *', { y: 14, opacity: 0, duration: 0.7, stagger: 0.08 }, '-=0.65')
          .fromTo('.hero-frame', { clipPath: 'inset(12% 10% 12% 10% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.4 }, 0.1)
          .from('.hero-img', { scale: 1.18, duration: 1.8 }, 0.1)
          .from('.hero-card', { y: 24, opacity: 0, scale: 0.94, duration: 0.9, stagger: 0.12, ease: 'back.out(1.6)' }, 0.8)
          .to('.hero-spark', { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, 1.2)
          .to('.hero-spark-dot', { opacity: 1, duration: 0.3 }, 2.4);
      });
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('.hero-spark', { strokeDashoffset: 0 });
        gsap.set('.hero-spark-dot', { opacity: 1 });
      });
    },
    { scope: root }
  );

  const words = [
    { w: 'Inventory', c: '' },
    { w: 'and', c: '' },
    { w: 'orders,', c: '' },
    { w: 'finally', c: '' },
    { w: 'in', c: '' },
    { w: 'one', c: '' },
    { w: 'calm', c: 'text-pine-600' },
    { w: 'workspace.', c: 'text-pine-600' },
  ];

  return (
    <section ref={root} onMouseMove={onMove} className="relative overflow-hidden pt-28 md:pt-32">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-10 size-[720px] rounded-full bg-[radial-gradient(closest-side,rgba(185,209,196,0.55),rgba(243,244,240,0))]" />
      <div className="relative mx-auto grid max-w-[1320px] items-center gap-12 px-5 pb-16 md:px-8 lg:min-h-[calc(100dvh-8rem)] lg:grid-cols-[1.08fr_1fr] lg:gap-10 lg:pb-20">
        <div className="max-w-[640px]">
          <h1 className="font-display text-[2.85rem] font-semibold leading-[1.02] tracking-[-0.045em] text-ink-900 sm:text-6xl lg:text-[4.35rem]">
            {words.map(({ w, c }, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <span className={`hero-word inline-block ${c}`}>{w}</span>
                {i < words.length - 1 && <span>&nbsp;</span>}
              </span>
            ))}
          </h1>
          <p className="hero-sub mt-6 max-w-[34rem] text-lg leading-relaxed text-ink-600">
            Novara gives growing brands one place to add products, take orders and see what sells. SKUs write themselves.
          </p>
          <div className="hero-cta mt-9 flex flex-wrap items-center gap-3">
            <Button as={Link} to="/signup" size="lg" className="group pr-5">
              Sign up
              <span className="grid size-6 place-items-center rounded-full bg-white/12 transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowRight weight="bold" className="size-3.5" />
              </span>
            </Button>
            <Button as={Link} to="/login" variant="secondary" size="lg">
              Log in
            </Button>
          </div>
        </div>

        {/* Visual */}
        <div className="relative mx-auto w-full max-w-[540px] lg:ml-auto lg:mr-6">
          <motion.div style={{ x: imgX }} className="hero-frame relative aspect-[4/5] overflow-hidden rounded-[28px] bg-ink-100 shadow-lift">
            <img
              src="/images/hero-founder.webp"
              alt="A ceramics studio founder checking stock on a tablet in her workshop"
              className="hero-img size-full object-cover object-[30%_center]"
              fetchPriority="high"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink-950/25 to-transparent" />
          </motion.div>

          {/* New order card */}
          <motion.div style={{ x: nearX, y: nearY }} className="hero-card absolute -left-4 top-10 w-[248px] rounded-2xl border border-line bg-paper/95 p-3.5 shadow-lift backdrop-blur sm:-left-14">
            <div className="flex items-center gap-3">
              <img src="/images/portrait-2.webp" alt="" className="size-9 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink-900">Leila Haddad</p>
                <p className="text-xs text-ink-500">Order KC-1048, 3 items</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <span className="font-display text-lg font-semibold tracking-tight tabular">$148.50</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-pine-50 px-2 py-0.5 text-xs font-medium text-pine-700">
                <CheckCircle weight="fill" className="size-3.5" /> Paid
              </span>
            </div>
          </motion.div>

          {/* Revenue card */}
          <motion.div style={{ x: farX, y: farY }} className="hero-card absolute -right-3 top-[44%] w-[212px] rounded-2xl border border-line bg-paper/95 p-4 shadow-lift backdrop-blur sm:-right-10">
            <div className="flex items-center justify-between text-xs text-ink-500">
              <span className="font-medium">Revenue, 30 days</span>
              <TrendUp className="size-4 text-pine-600" weight="bold" />
            </div>
            <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight tabular">$12,480</p>
            <Sparkline />
          </motion.div>

          {/* SKU card */}
          <motion.div style={{ x: nearX, y: farY }} className="hero-card absolute -bottom-6 left-6 rounded-2xl border border-ink-800 bg-ink-900 px-4 py-3.5 text-paper shadow-lift sm:left-10">
            <div className="flex items-center gap-2 text-[11px] font-medium text-ink-300">
              <Barcode className="size-4 text-kraft-300" weight="bold" /> Auto SKU
              <span className="ml-3 inline-flex items-center gap-1 text-ink-400">
                <Package className="size-3.5" /> Stoneware Mug 350ml
              </span>
            </div>
            <p className="mt-1.5 min-h-[1.5rem] font-mono text-[15px] tracking-wide text-paper">
              {sku}
              <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-kraft-300" />
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

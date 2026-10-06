import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { Button } from '../ui/Button';
import { Reveal } from './Reveal';

const ParcelScene = lazy(() => import('./ParcelScene'));

/** Mounts children only once the element is near the viewport (saves ~240 KB of 3D code on first load). */
function useNearViewport(margin = '400px') {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return undefined;
    if (!('IntersectionObserver' in window)) {
      setNear(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: margin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin, near]);
  return [ref, near];
}

export function CtaBlock() {
  const [sceneRef, showScene] = useNearViewport();
  return (
    <section className="mx-auto max-w-[1320px] px-5 pb-24 md:px-8">
      <Reveal className="grain relative grid overflow-hidden rounded-[32px] bg-ink-900 text-paper lg:grid-cols-[1.05fr_1fr]">
        <div className="relative z-10 p-8 md:p-14">
          <h2 data-reveal className="max-w-[16ch] font-display text-4xl font-semibold leading-[1.04] tracking-[-0.035em] md:text-[3.4rem]">
            Your first product takes about a minute.
          </h2>
          <p data-reveal className="mt-5 max-w-[42ch] text-lg leading-relaxed text-ink-300">
            Create a workspace, add a product and watch the SKU appear. Your dashboard starts empty and grows with you.
          </p>
          <div data-reveal className="mt-9 flex flex-wrap gap-3">
            <Button as={Link} to="/signup" variant="light" size="lg">
              Sign up <ArrowRight weight="bold" className="size-4" />
            </Button>
            <Button as={Link} to="/login" size="lg" className="bg-transparent text-paper ring-1 ring-white/20 hover:bg-white/8">
              Log in
            </Button>
          </div>
        </div>
        <div ref={sceneRef} className="relative h-[320px] md:h-[400px] lg:h-auto lg:min-h-[440px]">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(closest-side_at_55%_50%,rgba(63,115,93,0.45),transparent)]" />
          {showScene && (
            <Suspense fallback={null}>
              <ParcelScene />
            </Suspense>
          )}
        </div>
      </Reveal>
    </section>
  );
}

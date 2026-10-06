import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Scroll-reveals direct children marked with [data-reveal] in sequence. */
export function Reveal({ as: Comp = 'div', children, className, stagger = 0.09, y = 28, start = 'top 82%', ...props }) {
  const ref = useRef(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const items = gsap.utils.toArray('[data-reveal]', ref.current);
        if (!items.length) return;
        gsap.from(items, {
          y,
          opacity: 0,
          duration: 0.95,
          ease: 'expo.out',
          stagger,
          scrollTrigger: { trigger: ref.current, start, once: true },
        });
      });
    },
    { scope: ref }
  );
  return (
    <Comp ref={ref} className={className} {...props}>
      {children}
    </Comp>
  );
}

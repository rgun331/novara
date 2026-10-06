import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/** Tweens a number with GSAP and returns the in-flight value. */
export function useCountUp(target, { duration = 1.1, decimals = 0 } = {}) {
  const [value, setValue] = useState(0);
  const obj = useRef({ v: 0 });

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      obj.current.v = target;
      setValue(target);
      return undefined;
    }
    const tween = gsap.to(obj.current, {
      v: Number(target) || 0,
      duration,
      ease: 'power3.out',
      onUpdate: () => setValue(Number(obj.current.v.toFixed(decimals))),
    });
    return () => tween.kill();
  }, [target, duration, decimals]);

  return value;
}

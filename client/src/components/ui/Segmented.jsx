import { useId } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/cn';

export function Segmented({ options, value, onChange, className, size = 'md' }) {
  const id = useId();
  return (
    <div className={cn('inline-flex items-center gap-0.5 rounded-full border border-line bg-paper p-1', className)} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative whitespace-nowrap rounded-full font-medium transition-colors',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-[13px]',
              active ? 'text-paper' : 'text-ink-600 hover:text-ink-900'
            )}
          >
            {active && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full bg-ink-900" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {o.label}
              {o.count !== undefined && (
                <span className={cn('rounded-full px-1.5 text-[11px] tabular', active ? 'bg-white/15' : 'bg-ink-100 text-ink-600')}>{o.count}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

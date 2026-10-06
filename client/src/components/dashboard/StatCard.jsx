import { ArrowDownRight, ArrowUpRight } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useCountUp } from '../../hooks/useCountUp';
import { cn } from '../../lib/cn';
import { Skeleton } from '../ui/Skeleton';

export function StatCard({ label, value, format = (v) => v, decimals = 0, delta, icon: Icon, hint, loading, tone = 'paper', index = 0 }) {
  const animated = useCountUp(loading ? 0 : value, { decimals });
  const positive = delta >= 0;
  const dark = tone === 'ink';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.25, 1, 0.5, 1] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5',
        dark ? 'border-ink-800 bg-ink-900 text-paper' : 'border-line bg-paper shadow-soft'
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn('text-[13px] font-medium', dark ? 'text-ink-300' : 'text-ink-500')}>{label}</span>
        {Icon && (
          <span className={cn('grid size-8 place-items-center rounded-lg', dark ? 'bg-white/8 text-kraft-300' : 'bg-pine-50 text-pine-700')}>
            <Icon className="size-4.5" weight="duotone" />
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-8 w-32" />
      ) : (
        <div className="mt-3 font-display text-[28px] font-semibold leading-none tracking-[-0.03em] tabular">{format(animated)}</div>
      )}
      <div className="mt-3 flex items-center gap-2 text-xs">
        {delta !== undefined && delta !== null && !loading && delta === 0 && (
          <span className={cn('rounded-full px-1.5 py-0.5 font-semibold', dark ? 'bg-white/10 text-ink-300' : 'bg-ink-100 text-ink-600')}>No change</span>
        )}
        {delta !== undefined && delta !== null && !loading && delta !== 0 && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold tabular',
              positive ? (dark ? 'bg-pine-500/25 text-pine-200' : 'bg-pine-50 text-pine-700') : dark ? 'bg-rose-ink/30 text-rose-soft' : 'bg-rose-soft text-rose-ink'
            )}
          >
            {positive ? <ArrowUpRight weight="bold" className="size-3" /> : <ArrowDownRight weight="bold" className="size-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className={dark ? 'text-ink-400' : 'text-ink-500'}>{hint}</span>}
      </div>
    </motion.div>
  );
}

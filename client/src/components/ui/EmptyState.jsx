import { motion } from 'motion/react';
import { cn } from '../../lib/cn';

export function EmptyState({ illustration: Illustration, title, description, action, secondary, className, compact }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
      className={cn('flex flex-col items-center px-6 text-center', compact ? 'py-10' : 'py-16 md:py-20', className)}
    >
      {Illustration && <Illustration className={cn(compact ? 'h-28' : 'h-36 md:h-40', 'w-auto')} />}
      <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-ink-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">{description}</p>}
      {(action || secondary) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondary}
        </div>
      )}
    </motion.div>
  );
}

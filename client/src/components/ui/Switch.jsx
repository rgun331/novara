import { motion } from 'motion/react';
import { cn } from '../../lib/cn';

export function Switch({ checked, onChange, label, description, disabled }) {
  return (
    <label className={cn('flex cursor-pointer items-start justify-between gap-4', disabled && 'cursor-not-allowed opacity-60')}>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink-900">{label}</span>
        {description && <span className="mt-0.5 block text-[13px] text-ink-500">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200', checked ? 'bg-pine-600' : 'bg-ink-200')}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 36 }}
          className={cn('block size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(18,24,21,0.25)]', checked && 'ml-auto')}
        />
      </button>
    </label>
  );
}

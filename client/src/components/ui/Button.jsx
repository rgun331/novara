import { forwardRef } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '../../lib/cn';

const VARIANTS = {
  primary: 'bg-ink-900 text-paper hover:bg-ink-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_1px_2px_rgba(18,24,21,0.2)]',
  accent: 'bg-pine-600 text-paper hover:bg-pine-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_2px_rgba(18,24,21,0.18)]',
  secondary: 'bg-paper text-ink-900 border border-line-strong hover:border-ink-300 hover:bg-white shadow-[0_1px_2px_rgba(18,24,21,0.05)]',
  ghost: 'text-ink-700 hover:bg-ink-100 hover:text-ink-900',
  danger: 'bg-rose-ink text-paper hover:bg-[#86312a]',
  'danger-ghost': 'text-rose-ink hover:bg-rose-soft',
  light: 'bg-paper text-ink-900 hover:bg-white',
};

const SIZES = {
  xs: 'h-7 px-2.5 text-xs gap-1.5',
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-10 px-4.5 text-sm gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
  icon: 'size-9 justify-center',
  'icon-sm': 'size-8 justify-center',
};

export const Button = forwardRef(function Button(
  { as: Comp = 'button', variant = 'primary', size = 'md', loading = false, className, children, disabled, type, ...props },
  ref
) {
  return (
    <Comp
      ref={ref}
      type={Comp === 'button' ? type || 'button' : undefined}
      disabled={Comp === 'button' ? disabled || loading : undefined}
      className={cn(
        'relative inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-medium tracking-[-0.01em]',
        'transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-[var(--ease-out-quart)]',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading && <CircleNotch className="size-4 animate-spin" weight="bold" />}
      {children}
    </Comp>
  );
});

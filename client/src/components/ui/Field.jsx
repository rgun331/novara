import { forwardRef, useId } from 'react';
import { CaretDown, WarningCircle } from '@phosphor-icons/react';
import { cn } from '../../lib/cn';

export function Field({ label, hint, error, htmlFor, required, className, children, action }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || action) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-800">
              {label}
              {required && <span className="ml-0.5 text-rose-ink">*</span>}
            </label>
          )}
          {action}
        </div>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs font-medium text-rose-ink" role="alert">
          <WarningCircle weight="fill" className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

const base =
  'w-full rounded-xl border bg-white text-sm text-ink-900 placeholder:text-ink-500 transition-[border-color,box-shadow] duration-150 outline-none ' +
  'focus:border-pine-500 focus:ring-4 focus:ring-pine-100 disabled:bg-ink-100 disabled:text-ink-500';

export const Input = forwardRef(function Input({ className, invalid, prefix, suffix, ...props }, ref) {
  if (prefix || suffix) {
    return (
      <div
        className={cn(
          'flex items-center rounded-xl border bg-white transition-[border-color,box-shadow] focus-within:border-pine-500 focus-within:ring-4 focus-within:ring-pine-100',
          invalid ? 'border-rose-ink/60' : 'border-line-strong',
          className
        )}
      >
        {prefix && <span className="pl-3.5 text-sm text-ink-500">{prefix}</span>}
        <input ref={ref} className="h-10 w-full min-w-0 bg-transparent px-3 text-sm text-ink-900 outline-none placeholder:text-ink-500" {...props} />
        {suffix && <span className="pr-1.5">{suffix}</span>}
      </div>
    );
  }
  return <input ref={ref} className={cn(base, 'h-10 px-3.5', invalid ? 'border-rose-ink/60' : 'border-line-strong', className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className, invalid, ...props }, ref) {
  return <textarea ref={ref} className={cn(base, 'min-h-[88px] resize-y px-3.5 py-2.5 leading-relaxed', invalid ? 'border-rose-ink/60' : 'border-line-strong', className)} {...props} />;
});

export const Select = forwardRef(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <div className={cn('relative', className)}>
      <select
        ref={ref}
        className={cn(base, 'h-10 appearance-none pl-3.5 pr-9', invalid ? 'border-rose-ink/60' : 'border-line-strong')}
        {...props}
      >
        {children}
      </select>
      <CaretDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
    </div>
  );
});

export function useFieldId(id) {
  const auto = useId();
  return id || auto;
}

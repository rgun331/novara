import { cn } from '../../lib/cn';

/**
 * Novara mark: an "N" whose right stem resolves into a rising four-point star.
 * The star stands for "nova" (a new star), the steady stems for inventory you can count on.
 */
export function LogoMark({ className, tone = 'ink', title = 'Novara' }) {
  const tile = tone === 'light' ? '#F3F4F0' : tone === 'pine' ? '#2F5D4B' : '#17201C';
  const stroke = tone === 'light' ? '#17201C' : '#F3F4F0';
  return (
    <svg viewBox="0 0 40 40" className={cn('shrink-0', className)} role="img" aria-label={title}>
      <rect width="40" height="40" rx="11" fill={tile} />
      <rect x="10" y="10" width="5" height="20" rx="2.5" fill={stroke} />
      <path
        d="M11.2 11.6c.9-1.6 3.1-1.7 4.2-.3l13.9 16.1c1.4 1.6.2 4.1-1.9 4.1c-.8 0-1.5-.3-2-.9L11.5 14.5c-.7-.8-.8-2-.3-2.9z"
        fill={stroke}
      />
      <rect x="25" y="19.5" width="5" height="10.5" rx="2.5" fill={stroke} />
      <path d="M27.5 6.8c.5 3.6 2 5.1 5.6 5.7-3.6.6-5.1 2.1-5.6 5.7-.5-3.6-2-5.1-5.6-5.7 3.6-.6 5.1-2.1 5.6-5.7z" fill="#E2C08D" />
    </svg>
  );
}

export function Logo({ className, markClassName, tone = 'ink', wordClassName }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={cn('size-8', markClassName)} tone={tone} />
      <span
        className={cn(
          'font-display text-[1.32rem] font-semibold tracking-[-0.03em] leading-none',
          tone === 'light' ? 'text-paper' : 'text-ink-900',
          wordClassName
        )}
      >
        novara
      </span>
    </span>
  );
}

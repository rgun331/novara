import { cn } from '../../lib/cn';

const TONES = {
  neutral: 'bg-ink-100 text-ink-700',
  pine: 'bg-pine-100 text-pine-800',
  amber: 'bg-amber-soft text-amber-ink',
  rose: 'bg-rose-soft text-rose-ink',
  slate: 'bg-slate-soft text-slate-ink',
  ink: 'bg-ink-900 text-paper',
  outline: 'border border-line-strong text-ink-700',
  kraft: 'bg-kraft-100 text-[#6B4E26]',
};

export function Badge({ tone = 'neutral', className, children, icon: Icon }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', TONES[tone], className)}>
      {Icon && <Icon weight="bold" className="size-3" />}
      {children}
    </span>
  );
}

export const ORDER_STATUS_TONE = { pending: 'amber', processing: 'slate', shipped: 'pine', delivered: 'ink', cancelled: 'rose' };
export const PAYMENT_TONE = { paid: 'pine', pending: 'amber', refunded: 'neutral' };
export const PRODUCT_STATUS_TONE = { active: 'pine', draft: 'neutral', archived: 'outline' };

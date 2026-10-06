import { Gear, Package, Receipt, Sparkle, UserCircle, Warning } from '@phosphor-icons/react';

export const NOTIFICATION_META = {
  order: { icon: Receipt, tone: 'bg-pine-50 text-pine-700', label: 'Orders' },
  stock: { icon: Warning, tone: 'bg-amber-soft text-amber-ink', label: 'Stock' },
  product: { icon: Package, tone: 'bg-slate-soft text-slate-ink', label: 'Products' },
  account: { icon: UserCircle, tone: 'bg-ink-100 text-ink-700', label: 'Account' },
  system: { icon: Sparkle, tone: 'bg-kraft-100 text-[#6b4e26]', label: 'System' },
  default: { icon: Gear, tone: 'bg-ink-100 text-ink-700', label: 'Other' },
};
export const metaFor = (type) => NOTIFICATION_META[type] || NOTIFICATION_META.default;

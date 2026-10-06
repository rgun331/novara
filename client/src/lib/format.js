const LOCALES = { USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', PKR: 'en-PK', AED: 'en-AE', INR: 'en-IN' };

export function formatMoney(value, currency = 'USD', { compact = false } = {}) {
  const n = Number(value) || 0;
  try {
    return new Intl.NumberFormat(LOCALES[currency] || 'en-US', {
      style: 'currency',
      currency,
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : 2,
      minimumFractionDigits: compact ? 0 : 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export const formatNumber = (n, opts = {}) => new Intl.NumberFormat('en-US', opts).format(Number(n) || 0);

export function formatDate(d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!d) return '';
  return new Intl.DateTimeFormat('en-GB', opts).format(new Date(d));
}

export function formatDateTime(d) {
  if (!d) return '';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d));
}

export function timeAgo(d) {
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d, { day: 'numeric', month: 'short' });
}

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'N';

export const titleCase = (s = '') => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export const pctLabel = (n) => `${n > 0 ? '+' : ''}${(Number(n) || 0).toFixed(1)}%`;

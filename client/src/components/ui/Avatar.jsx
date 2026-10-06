import { cn } from '../../lib/cn';
import { initials } from '../../lib/format';

const PALETTE = [
  ['#DCE8E1', '#1F3D32'],
  ['#F4EBDD', '#6B4E26'],
  ['#E3E9F1', '#3E5470'],
  ['#E9ECE8', '#26302B'],
  ['#F6E1DD', '#7A2E27'],
];

export function Avatar({ src, name = '', size = 36, className, ring = false }) {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length;
  const [bg, fg] = PALETTE[idx];
  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold', ring && 'ring-2 ring-paper', className)}
      style={{ width: size, height: size, background: src ? undefined : bg, color: fg, fontSize: Math.max(10, size * 0.38) }}
      aria-label={name}
    >
      {src ? <img src={src} alt={name} className="size-full object-cover" /> : <span className="leading-none tracking-tight">{initials(name)}</span>}
    </span>
  );
}

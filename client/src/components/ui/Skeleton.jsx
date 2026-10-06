import { cn } from '../../lib/cn';

export const Skeleton = ({ className }) => <div className={cn('skeleton rounded-lg', className)} />;

export function TableSkeleton({ rows = 6, cols = 6 }) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-6 px-5 py-4">
          <Skeleton className="size-9 shrink-0 rounded-xl" />
          {Array.from({ length: cols - 1 }).map((__, c) => (
            <Skeleton key={c} className={cn('h-3.5', c === 0 ? 'w-40' : 'w-20', c > 2 && 'hidden md:block')} />
          ))}
        </div>
      ))}
    </div>
  );
}

import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { cn } from '../../lib/cn';

export function Pagination({ page, pageSize, total, onPage, onPageSize }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn = 'grid size-8 place-items-center rounded-full border border-line-strong bg-paper text-ink-700 transition hover:bg-white disabled:opacity-40 disabled:pointer-events-none';
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-5 py-3.5 text-[13px] text-ink-500 sm:flex-row">
      <div className="flex items-center gap-3">
        <span className="tabular">
          {from}-{to} of {total}
        </span>
        {onPageSize && (
          <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="rounded-full border border-line-strong bg-paper px-2 py-1 text-xs text-ink-700 outline-none">
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <CaretLeft className="size-3.5" weight="bold" />
        </button>
        <span className={cn('px-2 tabular text-ink-700')}>
          {page} / {pages}
        </span>
        <button className={btn} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <CaretRight className="size-3.5" weight="bold" />
        </button>
      </div>
    </div>
  );
}

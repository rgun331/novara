import { cn } from '../../lib/cn';

export function Card({ title, description, action, children, className, bodyClassName }) {
  return (
    <section className={cn('rounded-2xl border border-line bg-paper shadow-soft', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            {title && <h3 className="text-[15px] font-semibold tracking-tight text-ink-900">{title}</h3>}
            {description && <p className="mt-0.5 text-[13px] text-ink-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

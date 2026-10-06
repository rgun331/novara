export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-display text-[1.7rem] font-semibold leading-tight tracking-[-0.03em] md:text-3xl">{title}</h2>
        {description && <p className="mt-1 text-[15px] text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

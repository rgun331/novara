import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../lib/cn';

export function Dropdown({ trigger, children, align = 'right', className, panelClassName }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.25, 1, 0.5, 1] }}
            className={cn(
              'absolute top-[calc(100%+8px)] z-50 min-w-[200px] origin-top rounded-2xl border border-line bg-paper p-1.5 shadow-lift',
              align === 'right' ? 'right-0' : 'left-0',
              panelClassName
            )}
            onClick={(e) => e.target.closest('[data-close]') && setOpen(false)}
          >
            {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DropdownItem({ icon: Icon, children, onClick, tone, className, as: Comp = 'button', ...props }) {
  return (
    <Comp
      data-close
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium transition-colors',
        tone === 'danger' ? 'text-rose-ink hover:bg-rose-soft' : 'text-ink-700 hover:bg-ink-100 hover:text-ink-900',
        className
      )}
      {...props}
    >
      {Icon && <Icon className="size-4 shrink-0" weight="regular" />}
      {children}
    </Comp>
  );
}

export const DropdownSeparator = () => <div className="my-1 h-px bg-line" />;

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from '@phosphor-icons/react';
import { cn } from '../../lib/cn';

const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-4xl' };

function useLockScroll(open) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

export function Modal({ open, onClose, title, description, icon: Icon, size = 'md', children, footer, className }) {
  const panel = useRef(null);
  useLockScroll(open);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => {
      const el = panel.current?.querySelector('input:not([type=hidden]):not([disabled]), select, textarea');
      el?.focus();
    }, 80);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            className="absolute inset-0 bg-ink-950/45 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            className={cn(
              'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[22px] border border-line bg-paper shadow-lift sm:rounded-[22px]',
              SIZES[size],
              className
            )}
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            <div className="flex items-start gap-3.5 border-b border-line px-6 pb-4 pt-5">
              {Icon && (
                <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-pine-50 text-pine-700 ring-1 ring-pine-100">
                  <Icon className="size-5" weight="duotone" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">{title}</h2>
                {description && <p className="mt-0.5 text-[13px] text-ink-500">{description}</p>}
              </div>
              <button onClick={onClose} className="-mr-2 grid size-9 place-items-center rounded-full text-ink-500 transition hover:bg-ink-100 hover:text-ink-900" aria-label="Close">
                <X className="size-4.5" weight="bold" />
              </button>
            </div>
            <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex flex-col-reverse gap-2 border-t border-line bg-canvas/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'max-w-lg' }) {
  useLockScroll(open);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            className={cn('relative flex h-full w-full flex-col border-l border-line bg-paper shadow-lift', width)}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-5">
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
                {subtitle && <p className="mt-0.5 text-[13px] text-ink-500">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="-mr-2 grid size-9 place-items-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900" aria-label="Close">
                <X className="size-4.5" weight="bold" />
              </button>
            </div>
            <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex gap-2 border-t border-line px-6 py-4">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

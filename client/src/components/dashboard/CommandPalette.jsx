import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowElbowDownLeft, MagnifyingGlass, Package, Plus, Receipt, SignOut } from '@phosphor-icons/react';
import { NAV } from './Sidebar';
import { api } from '../../lib/api';
import { useDebounced } from '../../hooks/useApi';
import { useDashboard } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/cn';

export function CommandPalette() {
  const { paletteOpen: open, setPaletteOpen, openProduct, openOrder } = useDashboard();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [results, setResults] = useState({ products: [], orders: [] });
  const debounced = useDebounced(q, 200);
  const inputRef = useRef(null);
  const close = () => setPaletteOpen(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPaletteOpen]);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open || debounced.trim().length < 2) {
      setResults({ products: [], orders: [] });
      return;
    }
    let live = true;
    Promise.all([api('/products', { params: { search: debounced } }), api('/orders', { params: { search: debounced, limit: 5 } })])
      .then(([p, o]) => live && setResults({ products: p.products.slice(0, 5), orders: o.orders.slice(0, 5) }))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [debounced, open]);

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    const actions = [
      { id: 'new-product', group: 'Actions', label: 'Add product', icon: Plus, run: () => openProduct() },
      { id: 'new-order', group: 'Actions', label: 'Create order', icon: Plus, run: () => openOrder() },
      ...NAV.map((n) => ({ id: n.to, group: 'Go to', label: n.label, icon: n.icon, run: () => navigate(n.to) })),
      { id: 'logout', group: 'Account', label: 'Log out', icon: SignOut, run: logout },
    ].filter((a) => !term || a.label.toLowerCase().includes(term));
    const prods = results.products.map((p) => ({ id: p._id, group: 'Products', label: p.name, sub: p.sku, icon: Package, run: () => navigate(`/dashboard/products?q=${encodeURIComponent(p.sku)}`) }));
    const ords = results.orders.map((o) => ({ id: o._id, group: 'Orders', label: `${o.orderNumber}, ${o.customer.name}`, sub: o.status, icon: Receipt, run: () => navigate(`/dashboard/orders?q=${encodeURIComponent(o.orderNumber)}`) }));
    return [...prods, ...ords, ...actions];
  }, [q, results, navigate, openProduct, openOrder, logout]);

  useEffect(() => setActive(0), [q, results]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && items[active]) {
      e.preventDefault();
      items[active].run();
      close();
    } else if (e.key === 'Escape') close();
  };

  let lastGroup = null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center px-3 pt-[12vh]">
          <motion.div className="absolute inset-0 bg-ink-950/40 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="relative w-full max-w-xl overflow-hidden rounded-[22px] border border-line bg-paper shadow-lift"
            role="dialog"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <MagnifyingGlass className="size-5 text-ink-400" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search products, orders or jump to a page"
                className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-400"
              />
              <kbd className="rounded-md border border-line-strong px-1.5 py-0.5 font-mono text-[11px] text-ink-500">Esc</kbd>
            </div>
            <div className="scrollbar-thin max-h-[52vh] overflow-y-auto p-2">
              {items.length === 0 && <p className="px-3 py-8 text-center text-sm text-ink-500">No matches for &ldquo;{q}&rdquo;</p>}
              {items.map((it, i) => {
                const header = it.group !== lastGroup ? it.group : null;
                lastGroup = it.group;
                return (
                  <div key={`${it.group}-${it.id}`}>
                    {header && <p className="px-3 pb-1 pt-3 text-[11px] font-semibold text-ink-400">{header}</p>}
                    <button
                      onMouseEnter={() => setActive(i)}
                      onClick={() => {
                        it.run();
                        close();
                      }}
                      className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm', i === active ? 'bg-ink-900 text-paper' : 'text-ink-800')}
                    >
                      <it.icon className={cn('size-4.5', i === active ? 'text-kraft-300' : 'text-ink-500')} />
                      <span className="flex-1 truncate font-medium">{it.label}</span>
                      {it.sub && <span className={cn('font-mono text-xs', i === active ? 'text-ink-300' : 'text-ink-400')}>{it.sub}</span>}
                      {i === active && <ArrowElbowDownLeft className="size-4 text-ink-300" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

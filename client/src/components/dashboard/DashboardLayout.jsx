import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Plus } from '@phosphor-icons/react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import { ProductFormModal } from './ProductFormModal';
import { OrderFormModal } from './OrderFormModal';
import { NotificationsProvider } from '../../context/NotificationsContext';
import { DashboardProvider, useDashboard } from '../../context/DashboardContext';
import { cn } from '../../lib/cn';

function Shell() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('novara.sidebar') === 'collapsed');
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { openProduct } = useDashboard();

  useEffect(() => {
    localStorage.setItem('novara.sidebar', collapsed ? 'collapsed' : 'open');
  }, [collapsed]);
  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="min-h-[100dvh] bg-canvas">
      <aside className={cn('fixed inset-y-0 left-0 z-50 hidden transition-[width] duration-300 ease-[var(--ease-out-quart)] lg:block', collapsed ? 'w-[84px]' : 'w-[264px]')}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <motion.div className="absolute inset-0 bg-ink-950/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.div className="absolute inset-y-0 left-0" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', stiffness: 360, damping: 36 }}>
              <Sidebar mobile onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className={cn('transition-[padding] duration-300 ease-[var(--ease-out-quart)]', collapsed ? 'lg:pl-[84px]' : 'lg:pl-[264px]')}>
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <button onClick={() => openProduct()} className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-pine-600 text-paper shadow-lift sm:hidden" aria-label="Add product">
        <Plus className="size-6" weight="bold" />
      </button>

      <CommandPalette />
      <ProductFormModal />
      <OrderFormModal />
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <NotificationsProvider>
      <DashboardProvider>
        <Shell />
      </DashboardProvider>
    </NotificationsProvider>
  );
}

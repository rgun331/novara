import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bell, CaretDoubleLeft, ChartLineUp, GearSix, Package, Receipt, SignOut, SquaresFour, UsersThree } from '@phosphor-icons/react';
import { Logo, LogoMark } from '../brand/Logo';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/cn';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';

export const NAV = [
  { to: '/dashboard', label: 'Overview', icon: SquaresFour, end: true },
  { to: '/dashboard/products', label: 'Products', icon: Package },
  { to: '/dashboard/orders', label: 'Orders', icon: Receipt },
  { to: '/dashboard/customers', label: 'Customers', icon: UsersThree },
  { to: '/dashboard/analytics', label: 'Analytics', icon: ChartLineUp },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell, badge: true },
  { to: '/dashboard/settings', label: 'Settings', icon: GearSix },
];

export function Sidebar({ collapsed, onToggle, onNavigate, mobile = false }) {
  const { user, logout } = useAuth();
  const { unread } = useNotifications();
  const isCollapsed = collapsed && !mobile;

  return (
    <div className={cn('flex h-full flex-col bg-ink-900 text-ink-200', mobile ? 'w-[280px]' : '')}>
      <div className={cn('flex h-[72px] items-center', isCollapsed ? 'justify-center px-0' : 'justify-between px-5')}>
        {isCollapsed ? <LogoMark className="size-9" tone="light" /> : <Logo tone="light" markClassName="size-8" />}
        {!mobile && !isCollapsed && (
          <button onClick={onToggle} className="grid size-8 place-items-center rounded-lg text-ink-400 transition hover:bg-white/8 hover:text-paper" aria-label="Collapse sidebar">
            <CaretDoubleLeft className="size-4" weight="bold" />
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="mx-4 mb-4 rounded-2xl border border-white/8 bg-white/[0.04] p-3">
          <p className="truncate text-[13px] font-semibold text-paper">{user?.businessName || 'My workspace'}</p>
          <p className="mt-0.5 text-xs text-ink-400">
            SKU prefix <span className="font-mono text-kraft-300">{user?.preferences?.skuPrefix || 'NV'}</span>
          </p>
        </div>
      )}

      <nav className={cn('scrollbar-thin flex-1 space-y-0.5 overflow-y-auto', isCollapsed ? 'px-3' : 'px-3')}>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex h-11 items-center gap-3 rounded-xl text-[14px] font-medium transition-colors',
                isCollapsed ? 'justify-center' : 'px-3',
                isActive ? 'text-paper' : 'text-ink-400 hover:bg-white/[0.05] hover:text-ink-100'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span layoutId={mobile ? 'nav-active-m' : 'nav-active'} className="absolute inset-0 rounded-xl bg-white/[0.09] ring-1 ring-white/10" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                )}
                {isActive && !isCollapsed && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-kraft-300" />}
                <item.icon className="relative size-5 shrink-0" weight={isActive ? 'fill' : 'regular'} />
                {!isCollapsed && <span className="relative flex-1">{item.label}</span>}
                {item.badge && unread > 0 && (
                  <span className={cn('relative grid min-w-5 place-items-center rounded-full bg-kraft-300 px-1.5 text-[11px] font-semibold leading-5 text-ink-900 tabular', isCollapsed && 'absolute right-1.5 top-1.5 min-w-4 px-1 text-[10px] leading-4')}>
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={cn('border-t border-white/8 p-3', isCollapsed && 'flex flex-col items-center gap-2')}>
        {isCollapsed ? (
          <>
            <button onClick={onToggle} className="grid size-10 place-items-center rounded-xl text-ink-400 hover:bg-white/8 hover:text-paper" aria-label="Expand sidebar">
              <CaretDoubleLeft className="size-4 rotate-180" weight="bold" />
            </button>
            <Avatar src={user?.avatarUrl} name={user?.name} size={36} />
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-xl p-2">
            <Avatar src={user?.avatarUrl} name={user?.name} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-paper">{user?.name}</p>
              <p className="truncate text-xs text-ink-400">{user?.email}</p>
            </div>
            <button onClick={logout} className="grid size-8 place-items-center rounded-lg text-ink-400 transition hover:bg-white/8 hover:text-paper" aria-label="Log out" title="Log out">
              <SignOut className="size-4.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

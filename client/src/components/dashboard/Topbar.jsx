import { Link, useLocation } from 'react-router-dom';
import { CaretDown, GearSix, List, MagnifyingGlass, Package, Plus, Receipt, SignOut, UserCircle } from '@phosphor-icons/react';
import { Dropdown, DropdownItem, DropdownSeparator } from '../ui/Dropdown';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { NotificationBell } from './NotificationBell';
import { NAV } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';

export function Topbar({ onMenu }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { openProduct, openOrder, setPaletteOpen } = useDashboard();
  const current = [...NAV].sort((a, b) => b.to.length - a.to.length).find((n) => pathname.startsWith(n.to)) || NAV[0];
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="flex h-[68px] items-center gap-3 px-4 md:px-8">
        <button onClick={onMenu} className="grid size-10 place-items-center rounded-full border border-line bg-paper lg:hidden" aria-label="Open menu">
          <List className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="hidden text-xs text-ink-500 sm:block">{user?.businessName || 'Workspace'}</p>
          <h1 className="truncate font-display text-lg font-semibold leading-tight tracking-tight">{current.label}</h1>
        </div>

        <button
          onClick={() => setPaletteOpen(true)}
          className="hidden h-10 w-[260px] items-center gap-2.5 rounded-full border border-line bg-paper px-3.5 text-[13px] text-ink-500 transition hover:border-line-strong md:flex xl:w-[320px]"
        >
          <MagnifyingGlass className="size-4" />
          <span className="flex-1 text-left">Search or jump to</span>
          <kbd className="rounded-md border border-line px-1.5 font-mono text-[11px] text-ink-500">{isMac ? 'Cmd' : 'Ctrl'} K</kbd>
        </button>
        <button onClick={() => setPaletteOpen(true)} className="grid size-10 place-items-center rounded-full border border-line bg-paper text-ink-700 md:hidden" aria-label="Search">
          <MagnifyingGlass className="size-[18px]" />
        </button>

        <Dropdown
          trigger={({ toggle }) => (
            <Button onClick={toggle} variant="accent" size="md" className="max-sm:hidden">
              <Plus weight="bold" className="size-4" /> New <CaretDown weight="bold" className="size-3 opacity-70" />
            </Button>
          )}
        >
          <DropdownItem icon={Package} onClick={() => openProduct()}>
            Add product
          </DropdownItem>
          <DropdownItem icon={Receipt} onClick={openOrder}>
            Create order
          </DropdownItem>
        </Dropdown>

        <NotificationBell />

        <Dropdown
          trigger={({ toggle }) => (
            <button onClick={toggle} className="flex items-center gap-2 rounded-full p-0.5 transition hover:bg-ink-100" aria-label="Account menu">
              <Avatar src={user?.avatar} name={user?.name} size={38} />
            </button>
          )}
        >
          <div className="flex items-center gap-3 px-2.5 py-2">
            <Avatar src={user?.avatar} name={user?.name} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-ink-500">{user?.email}</p>
            </div>
          </div>
          <DropdownSeparator />
          <DropdownItem as={Link} to="/dashboard/settings" icon={UserCircle}>
            Profile
          </DropdownItem>
          <DropdownItem as={Link} to="/dashboard/settings?tab=preferences" icon={GearSix}>
            Preferences
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem icon={SignOut} tone="danger" onClick={logout}>
            Log out
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}

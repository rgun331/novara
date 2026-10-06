import { Link, useNavigate } from 'react-router-dom';
import { Bell, Checks } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { Dropdown } from '../ui/Dropdown';
import { useNotifications } from '../../context/NotificationsContext';
import { timeAgo } from '../../lib/format';
import { cn } from '../../lib/cn';
import { metaFor } from './notificationMeta';
import { BellIllustration } from '../brand/Illustrations';

export function NotificationBell() {
  const { items, unread, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const latest = items.slice(0, 6);

  return (
    <Dropdown
      panelClassName="w-[min(380px,calc(100vw-24px))] p-0 -right-14 sm:right-0"
      trigger={({ toggle, open }) => (
        <button onClick={toggle} className={cn('relative grid size-10 place-items-center rounded-full border border-line bg-paper text-ink-700 transition hover:text-ink-900', open && 'border-ink-300')} aria-label={`Notifications, ${unread} unread`}>
          <Bell className="size-[18px]" weight={open ? 'fill' : 'regular'} />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                key={unread}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-pine-600 px-1 text-[10px] font-semibold leading-[18px] text-paper ring-2 ring-canvas tabular"
              >
                {unread > 9 ? '9+' : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      )}
    >
      {({ close }) => (
        <div>
          <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-xs text-ink-500">{unread ? `${unread} unread` : 'You are all caught up'}</p>
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-pine-700 hover:bg-pine-50">
                <Checks className="size-3.5" weight="bold" /> Mark all read
              </button>
            )}
          </div>
          <div className="scrollbar-thin max-h-[380px] overflow-y-auto p-1.5">
            {latest.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <BellIllustration className="h-20 w-auto" />
                <p className="mt-2 text-[13px] text-ink-500">Nothing new yet.</p>
              </div>
            ) : (
              latest.map((n) => {
                const m = metaFor(n.type);
                return (
                  <button
                    key={n._id}
                    onClick={() => {
                      if (!n.read) markRead(n._id);
                      close();
                      if (n.link) navigate(n.link);
                    }}
                    className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition hover:bg-ink-100/70"
                  >
                    <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', m.tone)}>
                      <m.icon className="size-4" weight="bold" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate text-[13px]', n.read ? 'font-medium text-ink-700' : 'font-semibold text-ink-900')}>{n.title}</span>
                      <span className="line-clamp-2 block text-xs leading-relaxed text-ink-500">{n.message}</span>
                      <span className="mt-1 block text-[11px] text-ink-500">{timeAgo(n.createdAt)}</span>
                    </span>
                    {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-pine-500" aria-label="Unread" />}
                  </button>
                );
              })
            )}
          </div>
          <Link to="/dashboard/notifications" onClick={close} className="block border-t border-line px-4 py-3 text-center text-[13px] font-semibold text-ink-700 hover:bg-ink-100/60">
            View all notifications
          </Link>
        </div>
      )}
    </Dropdown>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { Broom, Checks, Envelope, EnvelopeOpen, Trash } from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi';
import { useNotifications } from '../../context/NotificationsContext';
import { api } from '../../lib/api';
import { timeAgo, formatDateTime } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Segmented';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { metaFor } from '../../components/dashboard/notificationMeta';
import { BellIllustration } from '../../components/brand/Illustrations';
import { cn } from '../../lib/cn';

const TYPES = [
  { value: '', label: 'All types' },
  { value: 'order', label: 'Orders' },
  { value: 'stock', label: 'Stock' },
  { value: 'product', label: 'Products' },
  { value: 'account', label: 'Account' },
];

function dayLabel(d) {
  const date = new Date(d);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === y.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function Notifications() {
  const navigate = useNavigate();
  const ctx = useNotifications();
  const [filter, setFilter] = useState('all');
  const [type, setType] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const { data, loading, reload, setData } = useApi('/notifications', {
    params: { filter: filter === 'unread' ? 'unread' : '', type, limit: 200 },
    deps: [ctx.unread, ctx.items.length],
  });

  const list = data?.notifications || [];
  const groups = useMemo(() => {
    const g = [];
    for (const n of list) {
      const label = dayLabel(n.createdAt);
      const last = g[g.length - 1];
      if (last && last.label === label) last.items.push(n);
      else g.push({ label, items: [n] });
    }
    return g;
  }, [list]);

  const patchLocal = (id, patch) => setData((d) => d && { ...d, notifications: d.notifications.map((n) => (n._id === id ? { ...n, ...patch } : n)) });

  const toggleRead = async (n) => {
    patchLocal(n._id, { read: !n.read });
    try {
      await api(`/notifications/${n._id}`, { method: 'PATCH', body: { read: !n.read } });
      ctx.refresh();
    } catch (err) {
      toast.error(err.message);
      reload();
    }
  };

  const remove = async (n) => {
    setData((d) => d && { ...d, notifications: d.notifications.filter((x) => x._id !== n._id) });
    try {
      await ctx.remove(n._id);
    } catch (err) {
      toast.error(err.message);
      reload();
    }
  };

  const open = async (n) => {
    if (!n.read) {
      patchLocal(n._id, { read: true });
      ctx.markRead(n._id);
    }
    if (n.link) navigate(n.link);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Notifications"
        description="Orders, stock alerts and account activity, in one feed."
        actions={
          <>
            <Button variant="secondary" disabled={!ctx.unread} onClick={async () => { await ctx.markAllRead(); reload(); toast.success('All caught up'); }}>
              <Checks className="size-4" /> Mark all read
            </Button>
            <Button variant="ghost" onClick={() => setConfirmClear(true)}>
              <Broom className="size-4" /> Clear read
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread', count: ctx.unread },
          ]}
        />
        <div className="scrollbar-thin flex gap-1.5 overflow-x-auto">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition',
                type === t.value ? 'bg-ink-900 text-paper' : 'bg-paper text-ink-600 ring-1 ring-line hover:text-ink-900'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-soft">
        {loading && !data ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            illustration={BellIllustration}
            title={filter === 'unread' ? 'You are all caught up' : 'Nothing here yet'}
            description={filter === 'unread' ? 'New orders and stock alerts will appear here as they happen.' : 'Novara will notify you about orders, low stock and account changes.'}
          />
        ) : (
          groups.map((g) => (
            <div key={g.label}>
              <p className="sticky top-0 z-[1] border-b border-line bg-canvas/80 px-5 py-2 text-xs font-semibold text-ink-500 backdrop-blur">{g.label}</p>
              <ul className="divide-y divide-line">
                <AnimatePresence initial={false}>
                  {g.items.map((n) => {
                    const m = metaFor(n.type);
                    return (
                      <motion.li
                        key={n._id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn('group relative flex gap-4 px-5 py-4 transition-colors hover:bg-canvas/70', !n.read && 'bg-pine-50/40')}
                      >
                        {!n.read && <span className="absolute left-2 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-pine-600" />}
                        <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', m.tone)}>
                          <m.icon className="size-4.5" weight="bold" />
                        </span>
                        <button onClick={() => open(n)} className="min-w-0 flex-1 text-left">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <p className={cn('text-sm', n.read ? 'font-medium text-ink-700' : 'font-semibold text-ink-900')}>{n.title}</p>
                            <span className="text-xs text-ink-400" title={formatDateTime(n.createdAt)}>
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>
                          {n.message && <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">{n.message}</p>}
                          <span className="mt-1.5 inline-block text-[11px] font-medium uppercase tracking-wide text-ink-400">{m.label}</span>
                        </button>
                        <div className="flex shrink-0 items-start gap-1 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                          <button onClick={() => toggleRead(n)} className="grid size-8 place-items-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900" aria-label={n.read ? 'Mark as unread' : 'Mark as read'} title={n.read ? 'Mark as unread' : 'Mark as read'}>
                            {n.read ? <Envelope className="size-4" /> : <EnvelopeOpen className="size-4" />}
                          </button>
                          <button onClick={() => remove(n)} className="grid size-8 place-items-center rounded-full text-ink-500 hover:bg-rose-soft hover:text-rose-ink" aria-label="Delete notification" title="Delete">
                            <Trash className="size-4" />
                          </button>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={async () => {
          await ctx.clearRead();
          setConfirmClear(false);
          reload();
          toast.success('Read notifications cleared');
        }}
        title="Clear read notifications?"
        description="Unread notifications stay. This cannot be undone."
        confirmLabel="Clear"
      />
    </div>
  );
}

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext(null);
const POLL_MS = 20000;

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const seen = useRef(null);

  const refresh = useCallback(async ({ announce = false } = {}) => {
    try {
      const d = await api('/notifications', { params: { limit: 60 } });
      if (announce && seen.current) {
        const fresh = d.notifications.filter((n) => !seen.current.has(n._id) && !n.read);
        fresh.slice(0, 2).forEach((n) => toast(n.title, { description: n.message }));
      }
      seen.current = new Set(d.notifications.map((n) => n._id));
      setItems(d.notifications);
      setUnread(d.unread);
    } catch {
      /* silent: polling */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    refresh();
    const id = setInterval(() => refresh({ announce: true }), POLL_MS);
    const onFocus = () => refresh({ announce: true });
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [isAuthenticated, refresh]);

  const markRead = useCallback(async (id, read = true) => {
    setItems((list) => list.map((n) => (n._id === id ? { ...n, read } : n)));
    setUnread((u) => Math.max(0, u + (read ? -1 : 1)));
    await api(`/notifications/${id}`, { method: 'PATCH', body: { read } }).catch(() => refresh());
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await api('/notifications/read-all', { method: 'PATCH' }).catch(() => refresh());
  }, [refresh]);

  const remove = useCallback(async (id) => {
    setItems((list) => list.filter((n) => n._id !== id));
    await api(`/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
    refresh();
  }, [refresh]);

  const clearRead = useCallback(async () => {
    setItems((list) => list.filter((n) => !n.read));
    await api('/notifications/clear', { method: 'DELETE' }).catch(() => {});
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ items, unread, loading, refresh, markRead, markAllRead, remove, clearRead }),
    [items, unread, loading, refresh, markRead, markAllRead, remove, clearRead]
  );
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export const useNotifications = () => useContext(NotificationsContext);

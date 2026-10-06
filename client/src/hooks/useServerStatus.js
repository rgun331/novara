import { useEffect, useState } from 'react';

/**
 * Polls /api/health so auth pages can tell the user when the API or database
 * is unavailable (for example while a preview is restarting).
 * status: 'checking' | 'ok' | 'offline' | 'db'
 */
export function useServerStatus(interval = 4000) {
  const [state, setState] = useState({ status: 'checking', demo: null });

  useEffect(() => {
    let alive = true;
    let timer;
    const check = async () => {
      let next;
      try {
        const res = await fetch('/api/health', { headers: { Accept: 'application/json' }, cache: 'no-store' });
        const ok = res.ok && (res.headers.get('content-type') || '').includes('application/json');
        const data = ok ? await res.json() : null;
        next = !data ? { status: 'offline', demo: null } : { status: data.db === 'connected' ? 'ok' : 'db', demo: data.demo || null };
      } catch {
        next = { status: 'offline', demo: null };
      }
      if (!alive) return;
      setState(next);
      // Poll quickly while there is a problem, slowly once healthy
      timer = setTimeout(check, next.status === 'ok' ? interval * 5 : interval);
    };
    check();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [interval]);

  return state;
}

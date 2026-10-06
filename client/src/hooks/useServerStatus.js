import { useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';

/**
 * Polls /api/health so auth pages can tell the user when the API or database
 * is unavailable (for example during a deploy or a database outage).
 * status: 'checking' | 'ok' | 'offline' | 'db'
 */
export function useServerStatus(interval = 4000) {
  const [state, setState] = useState({ status: 'checking' });

  useEffect(() => {
    let alive = true;
    let timer;
    const check = async () => {
      let next;
      try {
        const res = await fetch(`${API_BASE}/api/health`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
        const ok = res.ok && (res.headers.get('content-type') || '').includes('application/json');
        const data = ok ? await res.json() : null;
        next = { status: !data ? 'offline' : data.db === 'connected' ? 'ok' : 'db' };
      } catch {
        next = { status: 'offline' };
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

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

/** Small data-fetching hook with loading/error state and manual reload. */
export function useApi(path, { params, deps = [], enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const key = JSON.stringify(params || {});
  const ctrl = useRef(null);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!enabled) return;
      ctrl.current?.abort();
      const c = new AbortController();
      ctrl.current = c;
      if (!silent) setLoading(true);
      try {
        const d = await api(path, { params: JSON.parse(key), signal: c.signal });
        setData(d);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err);
      } finally {
        if (!c.signal.aborted) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [path, key, enabled]
  );

  useEffect(() => {
    load({ silent: data !== null });
    return () => ctrl.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, ...deps]);

  return { data, error, loading, reload: load, setData };
}

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

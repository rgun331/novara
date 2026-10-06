import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler } from '../lib/api';

const AuthContext = createContext(null);

// The session itself is an httpOnly cookie the browser sends automatically,
// so this context only tracks who is signed in.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  // Local sign-out, used when the server reports the session is gone
  const clearSession = useCallback(() => {
    setUser(null);
    setStatus('guest');
  }, []);

  const logout = useCallback(async () => {
    clearSession();
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
  }, [clearSession]);

  const logoutEverywhere = useCallback(async () => {
    await api('/auth/logout-all', { method: 'POST' });
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    let active = true;
    api('/auth/session')
      .then((d) => {
        if (!active) return;
        setUser(d.user);
        setStatus(d.user ? 'authenticated' : 'guest');
      })
      .catch(() => active && setStatus('guest'));
    return () => {
      active = false;
    };
  }, [clearSession]);

  const login = useCallback(async ({ email, password, remember = true }) => {
    const d = await api('/auth/login', { method: 'POST', body: { email, password, remember } });
    setUser(d.user);
    setStatus('authenticated');
    return d.user;
  }, []);

  const signup = useCallback(async (payload) => {
    const d = await api('/auth/signup', { method: 'POST', body: payload });
    setUser(d.user);
    setStatus('authenticated');
    return d.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      currency: user?.preferences?.currency || 'USD',
      login,
      signup,
      logout,
      logoutEverywhere,
      clearSession,
      setUser,
    }),
    [user, status, login, signup, logout, logoutEverywhere, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

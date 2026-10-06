import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(tokenStore.get() ? 'loading' : 'guest');

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus('guest');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) return;
    let active = true;
    api('/auth/me')
      .then((d) => {
        if (!active) return;
        setUser(d.user);
        setStatus('authenticated');
      })
      .catch(() => active && logout());
    return () => {
      active = false;
    };
  }, [logout]);

  const login = useCallback(async ({ email, password, remember = true }) => {
    const d = await api('/auth/login', { method: 'POST', body: { email, password } });
    tokenStore.set(d.token, remember);
    setUser(d.user);
    setStatus('authenticated');
    return d.user;
  }, []);

  const signup = useCallback(async (payload) => {
    const d = await api('/auth/signup', { method: 'POST', body: payload });
    tokenStore.set(d.token, true);
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
      setUser,
    }),
    [user, status, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

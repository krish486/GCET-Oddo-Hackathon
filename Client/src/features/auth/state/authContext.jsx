import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api } from '../../../shared/api/client';

const AuthContext = createContext(null);
const storageKey = 'stocksense-session';
const storedSession = () => { try { return JSON.parse(localStorage.getItem(storageKey)) || null; } catch { return null; } };

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(storedSession);
  const setSession = (next) => { setSessionState(next); if (next) localStorage.setItem(storageKey, JSON.stringify(next)); else localStorage.removeItem(storageKey); };
  const login = useCallback(async (credentials) => { const next = await api('/auth/login', { method: 'POST', body: credentials }); setSession(next); return next; }, []);
  const signup = useCallback(async (details) => { const next = await api('/auth/signup', { method: 'POST', body: details }); setSession(next); return next; }, []);
  const logout = useCallback(async () => { try { if (session?.token) await api('/auth/logout', { method: 'POST', token: session.token }); } finally { setSession(null); } }, [session?.token]);
  const value = useMemo(() => ({ session, user: session?.user || null, token: session?.token || null, login, signup, logout, setSession }), [session, login, signup, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
// This hook deliberately shares the context module with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used inside AuthProvider'); return value; };

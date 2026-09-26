import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../../../shared/api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  /**
   * `user` holds the public user object (id, name, email, role).
   * We no longer store any token in state or localStorage.
   * The HttpOnly session cookie is managed entirely by the browser / server.
   *
   * On first render we check /auth/me to restore the session from the cookie
   * (page refresh, new tab, etc.).  `initializing` gates the app until that
   * check completes so protected routes don't flash the login page.
   */
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Restore session from existing cookie on mount
  useEffect(() => {
    api('/auth/me')
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setInitializing(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await api('/auth/login', { method: 'POST', body: credentials });
    // The server set the cookie; we just store the user object in React state
    setUser(data.user);
    return data;
  }, []);

  const signup = useCallback(async (details) => {
    const data = await api('/auth/signup', { method: 'POST', body: details });
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // Even if the request fails, clear local state
    } finally {
      setUser(null);
    }
  }, []);

  /**
   * updateSession lets pages (e.g. ProfilePage, ResetPasswordPage) push a
   * refreshed user object into context after a successful server call.
   */
  const updateUser = useCallback((updatedUser) => setUser(updatedUser), []);

  const value = useMemo(
    () => ({ user, initializing, login, signup, logout, updateUser }),
    [user, initializing, login, signup, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
};

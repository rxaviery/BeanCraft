// Keeps track of who is logged in, for the whole app.
//   const { user, signIn, signUp, signOut } = useAuth();
// The session (user + token) is saved on the device and restored on launch.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { login, logout, register, setToken, setUnauthorizedHandler, type User } from '@/api/client';
import { useToast } from '@/components/Toast';
import { loadItem, saveItem } from './storage';

const SESSION_KEY = 'beancraft.session';

type AuthValue = {
  user: User | null;
  restoring: boolean; // true while reading the saved session on launch
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(true);

  // Starts (or with null, ends) a session: memory, API client and device storage.
  const saveSession = useCallback(async (session: { user: User; token: string } | null) => {
    setToken(session?.token ?? null);
    setUser(session?.user ?? null);
    await saveItem(SESSION_KEY, session ? JSON.stringify(session) : null);
  }, []);

  useEffect(() => {
    // Restore the saved session when the app opens.
    loadItem(SESSION_KEY)
      .then((saved) => {
        if (!saved) return;
        const session = JSON.parse(saved);
        setToken(session.token);
        setUser(session.user);
      })
      .catch(() => {}) // unreadable storage = just start logged out
      .finally(() => setRestoring(false));

    // If the server rejects our token (expired / logged out elsewhere), log out.
    setUnauthorizedHandler(() => {
      saveSession(null);
      toast('Your session expired. Please log in again.', 'error');
    });
  }, [saveSession, toast]);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      restoring,
      signIn: async (email, password) => saveSession(await login(email, password)),
      signUp: async (name, email, password) => saveSession(await register(name, email, password)),
      signOut: async () => {
        await logout().catch(() => {}); // log out locally even if the server can't be reached
        await saveSession(null);
      },
    }),
    [user, restoring, saveSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

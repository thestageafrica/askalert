'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { publicSupabaseEnv, tryCreateAuthBrowserClient } from '@askalert/db';

type AdminUser = {
  id: string;
  email?: string | null;
};

type AdminAuthContextValue = {
  ready: boolean;
  user: AdminUser | null;
  supabaseConfigured: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

function adminEnv() {
  return publicSupabaseEnv({
    useSupabase: process.env.NEXT_PUBLIC_USE_SUPABASE,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => tryCreateAuthBrowserClient(adminEnv()), []);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!client) {
      setReady(true);
      return;
    }

    let active = true;
    const syncUser = (next: AdminUser | null) => {
      if (!active) return;
      setUser(next);
      setReady(true);
    };

    void client.auth.getSession().then(({ data }) => {
      const nextUser = data.session?.user;
      syncUser(nextUser ? { id: nextUser.id, email: nextUser.email } : null);
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, next) => {
      const nextUser = next?.user;
      syncUser(nextUser ? { id: nextUser.id, email: nextUser.email } : null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [client]);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!client) {
        return { error: 'Supabase is not configured for admin yet.' };
      }
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (!error && data.user) {
        setUser({ id: data.user.id, email: data.user.email });
      }
      return { error: error?.message ?? null };
    },
    [client],
  );

  const signOut = useCallback(async () => {
    if (!client) {
      return;
    }
    await client.auth.signOut();
    setUser(null);
  }, [client]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      ready,
      user,
      supabaseConfigured: Boolean(client),
      signInWithPassword,
      signOut,
    }),
    [client, ready, user, signInWithPassword, signOut],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
}

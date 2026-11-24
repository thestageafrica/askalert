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
import type { Session, User } from '@supabase/supabase-js';
import { publicSupabaseEnv, tryCreateAuthBrowserClient } from '@askalert/db';

type AdminAuthContextValue = {
  ready: boolean;
  session: Session | null;
  user: User | null;
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
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!client) {
      setReady(true);
      return;
    }

    let active = true;
    void client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setReady(true);
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setReady(true);
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
      const { error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      return { error: error?.message ?? null };
    },
    [client],
  );

  const signOut = useCallback(async () => {
    if (!client) {
      return;
    }
    await client.auth.signOut();
    setSession(null);
  }, [client]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      supabaseConfigured: Boolean(client),
      signInWithPassword,
      signOut,
    }),
    [client, ready, session, signInWithPassword, signOut],
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

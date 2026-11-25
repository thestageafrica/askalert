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
import {
  buildConsentRows,
  type AppMode,
  type ConsentInput,
  type UserRoleRecord,
} from '@askalert/db';
import { authClient, authRedirectTo } from './supabase-auth';
import { toE164Phone } from './phone';

export type AccountProfile = {
  id: string;
  displayName: string;
  phoneE164: string | null;
  phoneVerifiedAt: string | null;
  avatarUrl: string | null;
  deletionRequestedAt: string | null;
};

type AuthContextValue = {
  ready: boolean;
  session: Session | null;
  user: User | null;
  profile: AccountProfile | null;
  roles: UserRoleRecord[];
  lastMode: AppMode;
  supabaseConfigured: boolean;
  refreshAccount: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  resendAuthEmail: (input: {
    email: string;
    kind: 'signup' | 'magiclink' | 'recovery';
  }) => Promise<{ error: string | null }>;
  signUp: (input: {
    email: string;
    password: string;
    displayName: string;
    phone: string;
    consents: ConsentInput[];
  }) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  signOut: (everywhere?: boolean) => Promise<void>;
  setLastMode: (mode: AppMode) => Promise<void>;
  requestDeletion: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = authClient();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [roles, setRoles] = useState<UserRoleRecord[]>([]);
  const [lastMode, setLastModeState] = useState<AppMode>('buyer');

  const loadAccount = useCallback(
    async (userId: string) => {
      if (!client) {
        return;
      }
      const [profileRes, rolesRes, settingsRes] = await Promise.all([
        client.from('profiles').select('*').eq('id', userId).maybeSingle(),
        client.from('user_roles').select('role, status, verified_tier').eq('user_id', userId),
        client.from('user_settings').select('last_mode').eq('user_id', userId).maybeSingle(),
      ]);

      if (profileRes.data) {
        setProfile({
          id: profileRes.data.id,
          displayName: profileRes.data.display_name,
          phoneE164: profileRes.data.phone_e164,
          phoneVerifiedAt: profileRes.data.phone_verified_at,
          avatarUrl: profileRes.data.avatar_url,
          deletionRequestedAt: profileRes.data.deletion_requested_at,
        });
      } else {
        setProfile(null);
      }

      setRoles(
        (rolesRes.data ?? []).map((row) => ({
          role: row.role as UserRoleRecord['role'],
          status: row.status as UserRoleRecord['status'],
          verifiedTier: row.verified_tier,
        })),
      );

      if (settingsRes.data?.last_mode === 'vendor' || settingsRes.data?.last_mode === 'buyer') {
        setLastModeState(settingsRes.data.last_mode);
      }
    },
    [client],
  );

  const refreshAccount = useCallback(async () => {
    if (!client || !session?.user.id) {
      setProfile(null);
      setRoles([]);
      return;
    }
    await loadAccount(session.user.id);
  }, [client, loadAccount, session?.user.id]);

  useEffect(() => {
    if (!client) {
      setReady(true);
      return;
    }

    const auth = client;
    let mounted = true;

    async function boot() {
      // detectSessionInUrl exchanges ?code= once during client init.
      // Do not call exchangeCodeForSession here — that races the callback page
      // and burns the one-time PKCE code (signup / magic link / Google).
      if (!mounted) {
        return;
      }
      const { data } = await auth.auth.getSession();
      if (!mounted) {
        return;
      }
      setSession(data.session);
      if (data.session?.user.id) {
        await loadAccount(data.session.user.id);
      }
      if (mounted) {
        setReady(true);
      }
    }

    void boot();

    const { data: sub } = auth.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'PASSWORD_RECOVERY' && typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (!path.includes('/auth/reset-password')) {
          window.location.replace('/auth/reset-password/');
          return;
        }
      }
      if (next?.user.id) {
        void loadAccount(next.user.id);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [client, loadAccount]);

  const value = useMemo<AuthContextValue>(() => {
    const fail = (error: string) => ({ error });

    return {
      ready,
      session,
      user: session?.user ?? null,
      profile,
      roles,
      lastMode,
      supabaseConfigured: Boolean(client),
      refreshAccount,
      async signInWithPassword(email, password) {
        if (!client) {
          return fail('Supabase is not configured yet.');
        }
        const { error } = await client.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
      },
      async signInWithMagicLink(email) {
        if (!client) {
          return fail('Supabase is not configured yet.');
        }
        const { error } = await client.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: authRedirectTo('/auth/callback/') },
        });
        return { error: error?.message ?? null };
      },
      async signInWithGoogle() {
        if (!client) {
          return fail('Supabase is not configured yet.');
        }
        const { data, error } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: authRedirectTo('/auth/callback/'),
            // Force a fresh account picker; helps when Google hangs on a stale session.
            queryParams: { prompt: 'select_account', access_type: 'online' },
            skipBrowserRedirect: true,
          },
        });
        if (error) {
          return { error: error.message };
        }
        if (!data.url) {
          return fail('Google sign-in did not return a redirect URL. Check the Google provider in Supabase.');
        }
        window.location.assign(data.url);
        return { error: null };
      },
      async resendAuthEmail(input: {
        email: string;
        kind: 'signup' | 'magiclink' | 'recovery';
      }) {
        if (!client) {
          return fail('Supabase is not configured yet.');
        }
        const email = input.email.trim();
        if (!email) {
          return fail('Enter your email first.');
        }
        if (input.kind === 'signup') {
          const { error } = await client.auth.resend({
            type: 'signup',
            email,
            options: { emailRedirectTo: authRedirectTo('/auth/callback/') },
          });
          return { error: error?.message ?? null };
        }
        if (input.kind === 'recovery') {
          const { error } = await client.auth.resetPasswordForEmail(email, {
            redirectTo: authRedirectTo('/auth/reset-password/'),
          });
          return { error: error?.message ?? null };
        }
        const { error } = await client.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: authRedirectTo('/auth/callback/') },
        });
        return { error: error?.message ?? null };
      },
      async signUp({ email, password, displayName, phone, consents }) {
        if (!client) {
          return fail('Supabase is not configured yet.');
        }
        const phoneE164 = toE164Phone(phone);
        if (!phoneE164) {
          return fail('Enter a valid Nigerian phone number.');
        }
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: authRedirectTo('/auth/callback/'),
            data: {
              display_name: displayName,
              phone_e164: phoneE164,
            },
          },
        });
        if (error) {
          return { error: error.message };
        }
        const userId = data.user?.id;
        if (userId) {
          await client.from('profiles').upsert({
            id: userId,
            display_name: displayName,
            phone_e164: phoneE164,
          });
          const rows = buildConsentRows(consents).map((row) => ({
            ...row,
            user_id: userId,
          }));
          await client.from('consents').upsert(rows, {
            onConflict: 'user_id,type,version',
          });
        }
        return { error: null };
      },
      async resetPassword(email) {
        if (!client) {
          return fail('Supabase is not configured yet.');
        }
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: authRedirectTo('/auth/reset-password/'),
        });
        return { error: error?.message ?? null };
      },
      async updatePassword(password) {
        if (!client) {
          return fail('Supabase is not configured yet.');
        }
        const { error } = await client.auth.updateUser({ password });
        return { error: error?.message ?? null };
      },
      async signOut(everywhere = false) {
        if (!client) {
          return;
        }
        await client.auth.signOut({
          scope: everywhere ? 'global' : 'local',
        });
      },
      async setLastMode(mode) {
        setLastModeState(mode);
        if (!client || !session?.user.id) {
          return;
        }
        await client.from('user_settings').upsert({
          user_id: session.user.id,
          last_mode: mode,
        });
      },
      async requestDeletion() {
        if (!client) {
          return fail('Supabase is not configured yet.');
        }
        const { error } = await client.rpc('request_account_deletion', {
          retention_note:
            'Soft delete requested. We keep records needed for disputes and legal duties, then remove the rest.',
        });
        if (!error) {
          await refreshAccount();
        }
        return { error: error?.message ?? null };
      },
    };
  }, [client, lastMode, profile, ready, refreshAccount, roles, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

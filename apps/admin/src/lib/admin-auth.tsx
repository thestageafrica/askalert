'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  pickPrimaryAdminRole,
  publicSupabaseEnv,
  tryCreateAuthBrowserClient,
  type AdminUiRole,
} from '@askalert/db';
import { adminRpc } from './admin-rpc';
import {
  ADMIN_IDLE_MS,
  isAdminIdle,
  touchAdminActivity,
} from './admin-session';

type AdminUser = {
  id: string;
  email?: string | null;
};

type MfaFactor = {
  id: string;
  friendlyName?: string;
};

type MfaEnrollState = {
  factorId: string;
  qrCode: string;
  secret: string;
};

type AdminAuthContextValue = {
  ready: boolean;
  user: AdminUser | null;
  role: AdminUiRole | null;
  supabaseConfigured: boolean;
  mfaRequired: boolean;
  mfaVerified: boolean;
  pendingMfaFactorId: string | null;
  enrollState: MfaEnrollState | null;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  startMfaEnroll: () => Promise<{ error: string | null }>;
  verifyMfaEnroll: (code: string) => Promise<{ error: string | null }>;
  verifyMfaChallenge: (code: string) => Promise<{ error: string | null }>;
  acceptInvitation: () => Promise<boolean>;
  refreshRoles: () => Promise<AdminUiRole | null>;
  signOut: (everywhere?: boolean) => Promise<void>;
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
  const [role, setRole] = useState<AdminUiRole | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [pendingMfaFactorId, setPendingMfaFactorId] = useState<string | null>(null);
  const [enrollState, setEnrollState] = useState<MfaEnrollState | null>(null);
  const idleTimer = useRef<number | null>(null);

  const clearIdleTimer = () => {
    if (idleTimer.current != null) {
      window.clearInterval(idleTimer.current);
      idleTimer.current = null;
    }
  };

  const refreshRoles = useCallback(async (): Promise<AdminUiRole | null> => {
    if (!client) {
      setRole(null);
      return null;
    }
    const { data, error } = await adminRpc<Array<{ role: string; status: string }>>(
      client,
      'admin_list_my_roles',
    );
    if (error || !data) {
      // Fallback: direct table read if RPC not migrated yet.
      const { data: rows } = await client
        .from('user_roles')
        .select('role, status')
        .eq('user_id', (await client.auth.getUser()).data.user?.id ?? '');
      const picked = pickPrimaryAdminRole(
        (rows ?? []).map((row) => ({
          role: row.role as 'admin_super' | 'admin_operations' | 'admin_support' | 'admin_readonly',
          status: row.status as string,
        })),
      );
      setRole(picked);
      return picked;
    }
    const picked = pickPrimaryAdminRole(
      data.map((row) => ({
        role: row.role as 'admin_super' | 'admin_operations' | 'admin_support' | 'admin_readonly',
        status: row.status,
      })),
    );
    setRole(picked);
    return picked;
  }, [client]);

  const evaluateMfa = useCallback(async () => {
    if (!client) {
      setMfaRequired(false);
      setMfaVerified(true);
      return;
    }
    const { data, error } = await client.auth.mfa.listFactors();
    if (error) {
      // MFA may be disabled on the project — still require password session only.
      setMfaRequired(false);
      setMfaVerified(true);
      setPendingMfaFactorId(null);
      return;
    }
    const verified = data.totp.filter((factor) => factor.status === 'verified');
    if (verified.length === 0) {
      setMfaRequired(true);
      setMfaVerified(false);
      setPendingMfaFactorId(null);
      return;
    }
    setMfaRequired(true);
    setPendingMfaFactorId(verified[0]!.id);
    // After password login AAL1; require challenge for AAL2.
    const { data: aal } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    const ok = aal?.currentLevel === 'aal2';
    setMfaVerified(Boolean(ok));
  }, [client]);

  const signOut = useCallback(
    async (everywhere = false) => {
      clearIdleTimer();
      setUser(null);
      setRole(null);
      setMfaVerified(false);
      setMfaRequired(false);
      setPendingMfaFactorId(null);
      setEnrollState(null);
      if (!client) {
        return;
      }
      await client.auth.signOut({
        scope: everywhere ? 'global' : 'local',
      });
    },
    [client],
  );

  const bootSession = useCallback(async () => {
    if (!client) {
      setReady(true);
      return;
    }
    const { data } = await client.auth.getSession();
    const nextUser = data.session?.user;
    if (!nextUser) {
      setUser(null);
      setRole(null);
      setReady(true);
      return;
    }
    setUser({ id: nextUser.id, email: nextUser.email });
    touchAdminActivity();
    await adminRpc(client, 'admin_accept_invitation');
    await refreshRoles();
    await evaluateMfa();
    setReady(true);
  }, [client, evaluateMfa, refreshRoles]);

  useEffect(() => {
    void bootSession();
    if (!client) {
      return;
    }
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user;
      if (!nextUser) {
        setUser(null);
        setRole(null);
        setMfaVerified(false);
        return;
      }
      setUser({ id: nextUser.id, email: nextUser.email });
      touchAdminActivity();
      void refreshRoles();
      void evaluateMfa();
    });
    return () => sub.subscription.unsubscribe();
  }, [bootSession, client, evaluateMfa, refreshRoles]);

  useEffect(() => {
    if (!user || !mfaVerified) {
      clearIdleTimer();
      return;
    }
    touchAdminActivity();
    const onActivity = () => touchAdminActivity();
    window.addEventListener('pointerdown', onActivity);
    window.addEventListener('keydown', onActivity);
    idleTimer.current = window.setInterval(() => {
      if (isAdminIdle()) {
        void signOut(false).then(() => {
          window.location.href = '/sign-in/?idle=1';
        });
      }
    }, 30_000);
    return () => {
      window.removeEventListener('pointerdown', onActivity);
      window.removeEventListener('keydown', onActivity);
      clearIdleTimer();
    };
  }, [mfaVerified, signOut, user]);

  // Silence unused constant warning in builds that tree-shake interval only.
  void ADMIN_IDLE_MS;

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!client) {
        return { error: 'Supabase is not configured for admin yet.' };
      }
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error || !data.user) {
        return { error: error?.message ?? 'Sign in failed.' };
      }
      setUser({ id: data.user.id, email: data.user.email });
      touchAdminActivity();
      await adminRpc(client, 'admin_accept_invitation');
      const nextRole = await refreshRoles();
      if (!nextRole) {
        await client.auth.signOut();
        setUser(null);
        return {
          error:
            'This account is not an AskAlert admin. Ask a super admin to invite you, then try again.',
        };
      }
      await evaluateMfa();
      return { error: null };
    },
    [client, evaluateMfa, refreshRoles],
  );

  const startMfaEnroll = useCallback(async () => {
    if (!client) {
      return { error: 'Supabase is not configured.' };
    }
    const { data, error } = await client.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'AskAlert Admin',
    });
    if (error || !data) {
      return { error: error?.message ?? 'Could not start authenticator setup.' };
    }
    setEnrollState({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
    return { error: null };
  }, [client]);

  const verifyMfaEnroll = useCallback(
    async (code: string) => {
      if (!client || !enrollState) {
        return { error: 'Start authenticator setup first.' };
      }
      const challenge = await client.auth.mfa.challenge({ factorId: enrollState.factorId });
      if (challenge.error || !challenge.data) {
        return { error: challenge.error?.message ?? 'Challenge failed.' };
      }
      const verified = await client.auth.mfa.verify({
        factorId: enrollState.factorId,
        challengeId: challenge.data.id,
        code: code.trim(),
      });
      if (verified.error) {
        return { error: verified.error.message };
      }
      setEnrollState(null);
      setMfaVerified(true);
      setPendingMfaFactorId(enrollState.factorId);
      touchAdminActivity();
      return { error: null };
    },
    [client, enrollState],
  );

  const verifyMfaChallenge = useCallback(
    async (code: string) => {
      if (!client || !pendingMfaFactorId) {
        return { error: 'No authenticator is enrolled on this account.' };
      }
      const challenge = await client.auth.mfa.challenge({ factorId: pendingMfaFactorId });
      if (challenge.error || !challenge.data) {
        return { error: challenge.error?.message ?? 'Challenge failed.' };
      }
      const verified = await client.auth.mfa.verify({
        factorId: pendingMfaFactorId,
        challengeId: challenge.data.id,
        code: code.trim(),
      });
      if (verified.error) {
        return { error: verified.error.message };
      }
      setMfaVerified(true);
      touchAdminActivity();
      return { error: null };
    },
    [client, pendingMfaFactorId],
  );

  const acceptInvitation = useCallback(async () => {
    if (!client) {
      return false;
    }
    const { data, error } = await adminRpc<boolean>(client, 'admin_accept_invitation');
    if (error) {
      return false;
    }
    await refreshRoles();
    return Boolean(data);
  }, [client, refreshRoles]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      ready,
      user,
      role,
      supabaseConfigured: Boolean(client),
      mfaRequired,
      mfaVerified,
      pendingMfaFactorId,
      enrollState,
      signInWithPassword,
      startMfaEnroll,
      verifyMfaEnroll,
      verifyMfaChallenge,
      acceptInvitation,
      refreshRoles,
      signOut,
    }),
    [
      acceptInvitation,
      client,
      enrollState,
      mfaRequired,
      mfaVerified,
      pendingMfaFactorId,
      ready,
      refreshRoles,
      role,
      signInWithPassword,
      signOut,
      startMfaEnroll,
      user,
      verifyMfaChallenge,
      verifyMfaEnroll,
    ],
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

export type { MfaEnrollState, MfaFactor };

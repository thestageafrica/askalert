'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isSignInRateLimited, nextSignInAttempts } from '@askalert/db';
import { Button, Input } from '@askalert/ui';
import { AdminAuthShell } from '../../components/admin-auth-shell';
import { useAdminAuth } from '../../lib/admin-auth';
import { ADMIN_SIGNIN_ATTEMPTS_KEY } from '../../lib/admin-session';

function AdminSignInForm() {
  const {
    signInWithPassword,
    supabaseConfigured,
    ready,
    user,
    role,
    mfaRequired,
    mfaVerified,
    pendingMfaFactorId,
    enrollState,
    startMfaEnroll,
    verifyMfaEnroll,
    verifyMfaChallenge,
  } = useAdminAuth();
  const router = useRouter();
  const search = useSearchParams();
  const nextParam = search.get('next');
  const next = nextParam && nextParam.startsWith('/') ? nextParam : '/';
  const idle = search.get('idle') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'password' | 'mfa'>('password');

  useEffect(() => {
    if (!ready || !user || !role) {
      return;
    }
    if (mfaRequired && !mfaVerified) {
      setStep('mfa');
      return;
    }
    if (!mfaRequired || mfaVerified) {
      router.replace(next);
    }
  }, [mfaRequired, mfaVerified, next, ready, role, router, user]);

  useEffect(() => {
    if (step === 'mfa' && !pendingMfaFactorId && !enrollState) {
      void startMfaEnroll();
    }
  }, [enrollState, pendingMfaFactorId, startMfaEnroll, step]);

  return (
    <AdminAuthShell
      title={step === 'password' ? 'Admin sign in' : 'Two-factor authentication'}
      subtitle={
        step === 'password'
          ? 'Invitation-only. No public sign-up.'
          : pendingMfaFactorId
            ? 'Enter the 6-digit code from your authenticator app.'
            : 'Scan the QR code, then enter the first code to finish setup.'
      }
    >
      <div className="space-y-4">
        {idle ? (
          <p className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm text-navy-900">
            You were signed out after 30 minutes of inactivity.
          </p>
        ) : null}
        {!supabaseConfigured ? (
          <p className="rounded-2xl border border-warning/40 bg-warning/15 px-3 py-2 text-sm text-navy-900">
            Supabase is not configured on this admin deploy. Set{' '}
            <code className="text-xs">NEXT_PUBLIC_USE_SUPABASE</code>, URL and anon key, then redeploy.
          </p>
        ) : null}

        {step === 'password' ? (
          <>
            <Input
              label="Work email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </>
        ) : (
          <>
            {enrollState ? (
              <div className="space-y-3 rounded-2xl border border-border bg-card-muted/50 p-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  Authenticator secret (if you cannot scan): {enrollState.secret}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={enrollState.qrCode}
                  alt="Authenticator QR code"
                  className="mx-auto h-44 w-44 rounded-xl bg-surface p-2"
                />
              </div>
            ) : null}
            <Input
              label="Authenticator code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </>
        )}

        {error ? (
          <p className="rounded-2xl border border-danger/40 bg-danger/15 px-3 py-2 text-sm text-navy-900">
            {error}
          </p>
        ) : null}

        <Button
          className="w-full"
          loading={loading}
          disabled={!supabaseConfigured}
          onClick={() => {
            setError(null);
            if (step === 'password') {
              const raw = window.localStorage.getItem(ADMIN_SIGNIN_ATTEMPTS_KEY);
              const attempts = raw ? (JSON.parse(raw) as number[]) : [];
              if (isSignInRateLimited(attempts)) {
                setError('Too many tries. Wait a few minutes.');
                return;
              }
              window.localStorage.setItem(
                ADMIN_SIGNIN_ATTEMPTS_KEY,
                JSON.stringify(nextSignInAttempts(attempts)),
              );
              setLoading(true);
              void signInWithPassword(email, password).then(({ error: signError }) => {
                setLoading(false);
                if (signError) {
                  setError(signError);
                }
                // MFA / redirect handled by session effect.
              });
              return;
            }
            setLoading(true);
            const run = pendingMfaFactorId
              ? verifyMfaChallenge(code)
              : verifyMfaEnroll(code);
            void run.then(({ error: mfaError }) => {
              setLoading(false);
              if (mfaError) {
                setError(mfaError);
                return;
              }
              window.localStorage.removeItem(ADMIN_SIGNIN_ATTEMPTS_KEY);
              router.replace(next);
            });
          }}
        >
          {step === 'password' ? 'Continue' : 'Verify and enter'}
        </Button>
      </div>
    </AdminAuthShell>
  );
}

export default function AdminSignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-navy-950 text-sm text-surface/70">
          Loading sign in…
        </div>
      }
    >
      <AdminSignInForm />
    </Suspense>
  );
}

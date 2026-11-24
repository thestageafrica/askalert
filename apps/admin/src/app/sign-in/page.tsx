'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isSignInRateLimited, nextSignInAttempts } from '@askalert/db';
import { Button, Input } from '@askalert/ui';
import { AdminAuthShell } from '../../components/admin-auth-shell';
import { useAdminAuth } from '../../lib/admin-auth';

const ATTEMPTS_KEY = 'askalert.admin.signin.attempts';

function AdminSignInForm() {
  const { signInWithPassword, supabaseConfigured, ready, user } = useAdminAuth();
  const router = useRouter();
  const search = useSearchParams();
  const nextParam = search.get('next');
  const next = nextParam && nextParam.startsWith('/') ? nextParam : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) {
      router.replace(next);
    }
  }, [next, ready, router, user]);

  return (
    <AdminAuthShell
      title="Admin sign in"
      subtitle="Invitation-only. Two-factor authentication lands in Prompt 27. No public sign-up."
    >
      <div className="space-y-4">
        {!supabaseConfigured ? (
          <p className="rounded-2xl border border-warning/40 bg-warning/15 px-3 py-2 text-sm text-navy-900">
            Supabase is not configured on this admin deploy. Set{' '}
            <code className="text-xs">NEXT_PUBLIC_USE_SUPABASE</code>,{' '}
            <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then redeploy.
          </p>
        ) : null}
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
            const raw = window.localStorage.getItem(ATTEMPTS_KEY);
            const attempts = raw ? (JSON.parse(raw) as number[]) : [];
            if (isSignInRateLimited(attempts)) {
              setError('Too many tries. Wait a few minutes.');
              return;
            }
            window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(nextSignInAttempts(attempts)));
            setLoading(true);
            setError(null);
            void signInWithPassword(email, password).then(({ error: signError }) => {
              setLoading(false);
              if (signError) {
                setError(signError);
                return;
              }
              router.replace(next);
            });
          }}
        >
          Sign in
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

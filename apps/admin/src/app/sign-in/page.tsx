'use client';

import { useState } from 'react';
import {
  isSignInRateLimited,
  nextSignInAttempts,
  publicSupabaseEnv,
  tryCreateAuthBrowserClient,
} from '@askalert/db';
import { Button, Input, Logo } from '@askalert/ui';

const ATTEMPTS_KEY = 'askalert.admin.signin.attempts';

function adminAuthEnv() {
  return publicSupabaseEnv({
    useSupabase: process.env.NEXT_PUBLIC_USE_SUPABASE,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export default function AdminSignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 px-4 py-10 text-surface">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_0%,_var(--glow-orange-strong),_transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_100%,_color-mix(in_srgb,var(--navy-700)_70%,transparent),_transparent_50%)]"
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-[1.75rem] border border-surface/15 bg-surface/5 p-7 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <Logo variant="reversed" className="h-8 w-auto" />
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Admin sign in</h1>
        <p className="mt-2 text-sm text-surface/70">
          Invitation-only. Two-factor authentication lands in Prompt 27. No public sign-up.
        </p>
        <div className="mt-6 space-y-4">
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
            <p className="rounded-2xl border border-danger/40 bg-danger/15 px-3 py-2 text-sm text-surface">
              {error}
            </p>
          ) : null}
          <Button
            className="w-full"
            loading={loading}
            onClick={() => {
              const raw = window.localStorage.getItem(ATTEMPTS_KEY);
              const attempts = raw ? (JSON.parse(raw) as number[]) : [];
              if (isSignInRateLimited(attempts)) {
                setError('Too many tries. Wait a few minutes.');
                return;
              }
              window.localStorage.setItem(
                ATTEMPTS_KEY,
                JSON.stringify(nextSignInAttempts(attempts)),
              );
              const client = tryCreateAuthBrowserClient(adminAuthEnv());
              if (!client) {
                setError('Supabase is not configured for admin yet.');
                return;
              }
              setLoading(true);
              void client.auth
                .signInWithPassword({ email: email.trim(), password })
                .then(({ error: signError }) => {
                  setLoading(false);
                  if (signError) {
                    setError(signError.message);
                    return;
                  }
                  window.location.href = '/';
                });
            }}
          >
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
}

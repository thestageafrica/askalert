'use client';

import { useState } from 'react';
import {
  isSignInRateLimited,
  nextSignInAttempts,
  publicSupabaseEnv,
  tryCreateAuthBrowserClient,
} from '@askalert/db';
import { Button, Input } from '@askalert/ui';
import { AdminAuthShell } from '../../components/admin-auth-shell';

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
    <AdminAuthShell
      title="Admin sign in"
      subtitle="Invitation-only. Two-factor authentication lands in Prompt 27. No public sign-up."
    >
      <div className="space-y-4">
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
          onClick={() => {
            const raw = window.localStorage.getItem(ATTEMPTS_KEY);
            const attempts = raw ? (JSON.parse(raw) as number[]) : [];
            if (isSignInRateLimited(attempts)) {
              setError('Too many tries. Wait a few minutes.');
              return;
            }
            window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(nextSignInAttempts(attempts)));
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
    </AdminAuthShell>
  );
}

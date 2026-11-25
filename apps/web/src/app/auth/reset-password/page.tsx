'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { scorePassword } from '@askalert/db';
import { Button } from '@askalert/ui';
import { AuthShell } from '../../../components/auth/auth-shell';
import { PasswordField } from '../../../components/auth/password-field';
import { useAuth } from '../../../lib/auth/auth-provider';

export default function ResetPasswordPage() {
  const { updatePassword, ready, session } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [waited, setWaited] = useState(false);

  // AuthProvider exchanges ?code= on boot. Give it a moment, then show help if no session.
  useEffect(() => {
    if (!ready) {
      return;
    }
    if (session) {
      setWaited(true);
      return;
    }
    const timer = window.setTimeout(() => setWaited(true), 800);
    return () => window.clearTimeout(timer);
  }, [ready, session]);

  if (!ready || !waited) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 text-sm text-surface/80">
        Opening reset link…
      </div>
    );
  }

  if (!session) {
    return (
      <AuthShell
        title="Reset link needed"
        subtitle="That reset link is invalid, expired, or was opened on the wrong site. Request a new one from askalert.com."
        footer={
          <Link href="/auth/forgot-password/" className="font-bold text-orange-700 dark:text-orange-400">
            Request a new reset email
          </Link>
        }
      >
        <Button href="/auth/forgot-password/" className="w-full">
          Forgot password
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Make it strong. You will use this the next time you sign in."
      footer={
        <Link href="/auth/sign-in/" className="font-bold text-orange-700 dark:text-orange-400">
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-4">
        <PasswordField
          value={password}
          onChange={setPassword}
          showStrength
          autoComplete="new-password"
        />
        {error ? (
          <p className="rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <Button
          className="w-full"
          loading={loading}
          onClick={() => {
            if (!scorePassword(password).ok) {
              setError('Choose a stronger password.');
              return;
            }
            setLoading(true);
            void updatePassword(password).then((result) => {
              setLoading(false);
              if (result.error) {
                setError(result.error);
                return;
              }
              router.replace('/app/');
            });
          }}
        >
          Save password
        </Button>
      </div>
    </AuthShell>
  );
}

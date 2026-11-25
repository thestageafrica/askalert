'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Input } from '@askalert/ui';
import { AuthShell } from '../../../components/auth/auth-shell';
import { useAuth } from '../../../lib/auth/auth-provider';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We will email you a secure link. Use the same inbox you signed up with."
      footer={
        <Link href="/auth/sign-in/" className="font-bold text-orange-700 dark:text-orange-400">
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {error ? (
          <p className="rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <Button
          className="w-full"
          loading={loading}
          loadingText="Sending link…"
          onClick={() => {
            setError(null);
            if (!email.trim()) {
              setError('Enter your email.');
              return;
            }
            setLoading(true);
            void resetPassword(email.trim()).then((result) => {
              setLoading(false);
              if (result.error) {
                setError(result.error);
                return;
              }
              router.push(
                `/auth/check-email/?email=${encodeURIComponent(email.trim())}&reason=reset`,
              );
            });
          }}
        >
          Send reset link
        </Button>
      </div>
    </AuthShell>
  );
}

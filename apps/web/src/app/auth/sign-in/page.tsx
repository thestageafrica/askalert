'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import {
  isSignInRateLimited,
  nextSignInAttempts,
} from '@askalert/db';
import { Button, Input } from '@askalert/ui';
import { AuthShell } from '../../../components/auth/auth-shell';
import { PasswordField } from '../../../components/auth/password-field';
import { useAuth } from '../../../lib/auth/auth-provider';

const ATTEMPTS_KEY = 'askalert.auth.signin.attempts';

function readAttempts(): number[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    return JSON.parse(window.localStorage.getItem(ATTEMPTS_KEY) || '[]') as number[];
  } catch {
    return [];
  }
}

function SignInForm() {
  const { signInWithPassword, signInWithMagicLink, signInWithGoogle } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/app/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const recordAttempt = () => {
    const nextAttempts = nextSignInAttempts(readAttempts());
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(nextAttempts));
  };

  const onPasswordSignIn = async () => {
    setError(null);
    if (isSignInRateLimited(readAttempts())) {
      setError('Too many tries. Wait a few minutes, then try again.');
      return;
    }
    setLoading(true);
    recordAttempt();
    const result = await signInWithPassword(email.trim(), password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.replace(next);
  };

  const onMagicLink = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Enter your email for a magic link.');
      return;
    }
    setLoading(true);
    const result = await signInWithMagicLink(email.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/auth/check-email/?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue as a buyer. Vendor mode can be added from your account."
      footer={
        <p>
          New here?{' '}
          <Link href="/auth/sign-up/" className="font-bold text-orange-700 dark:text-orange-400">
            Create an account
          </Link>
        </p>
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
        <PasswordField value={password} onChange={setPassword} />
        {error ? (
          <p className="rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <Button className="w-full" loading={loading} onClick={() => void onPasswordSignIn()}>
          Sign in
        </Button>
        <Button
          className="w-full"
          variant="secondary"
          loading={loading}
          onClick={() => void onMagicLink()}
        >
          Continue with email link
        </Button>
        <Button
          className="w-full"
          variant="ghost"
          loading={loading}
          onClick={() => void signInWithGoogle().then((result) => {
            if (result.error) {
              setError(result.error);
            }
          })}
        >
          Continue with Google
        </Button>
        <p className="text-center text-sm">
          <Link href="/auth/forgot-password/" className="font-semibold text-orange-700 dark:text-orange-400">
            Forgot password?
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy-950" />}>
      <SignInForm />
    </Suspense>
  );
}

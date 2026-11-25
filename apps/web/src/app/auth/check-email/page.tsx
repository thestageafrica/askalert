'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@askalert/ui';
import { AuthShell } from '../../../components/auth/auth-shell';
import { MailGlyph } from '../../../components/auth/auth-icons';
import { useAuth } from '../../../lib/auth/auth-provider';
import {
  formatCooldown,
  markResendSent,
  resendCooldownRemaining,
} from '../../../lib/auth/resend-cooldown';

type ResendKind = 'signup' | 'magiclink' | 'recovery';

function resolveKind(reason: string | null): ResendKind {
  if (reason === 'reset' || reason === 'recovery') {
    return 'recovery';
  }
  if (reason === 'magiclink') {
    return 'magiclink';
  }
  return 'signup';
}

function CheckEmailBody() {
  const search = useSearchParams();
  const email = search.get('email')?.trim() || '';
  const kind = resolveKind(search.get('reason'));
  const { resendAuthEmail } = useAuth();

  const [remainingMs, setRemainingMs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setRemainingMs(resendCooldownRemaining(email));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [email]);

  const subtitle = useMemo(() => {
    if (kind === 'recovery') {
      return 'We sent a reset link. Open it on this device to choose a new password.';
    }
    if (kind === 'magiclink') {
      return 'We sent a magic link. Open it on this device to finish signing in.';
    }
    return 'We sent a confirmation link. Open it on this device to activate your account.';
  }, [kind]);

  const onResend = async () => {
    setError(null);
    setMessage(null);
    if (!email) {
      setError('Missing email. Go back and try again.');
      return;
    }
    if (resendCooldownRemaining(email) > 0) {
      return;
    }
    setLoading(true);
    const result = await resendAuthEmail({ email, kind });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    markResendSent(email);
    setRemainingMs(resendCooldownRemaining(email));
    setMessage('Another email is on the way. Check inbox and spam.');
  };

  const coolingDown = remainingMs > 0;

  return (
    <AuthShell
      title="Check your email"
      subtitle={subtitle}
      footer={
        <Link href="/auth/sign-in/" className="font-bold text-orange-700 dark:text-orange-400">
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="rounded-[1.5rem] border border-orange-500/25 bg-orange-500/10 px-4 py-5 text-sm text-foreground">
          <p className="font-semibold">Inbox tip</p>
          <p className="mt-2 text-muted-foreground">
            {email ? (
              <>
                Look for a message to <span className="font-semibold text-navy-900">{email}</span>.
              </>
            ) : (
              'Look for a message from AskAlert.'
            )}{' '}
            If it is not there, check spam. The link expires for your safety.
          </p>
        </div>

        {message ? (
          <p className="rounded-2xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-navy-900">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button
          className="w-full justify-center border-navy-900/15 bg-surface text-navy-900 shadow-sm"
          variant="secondary"
          loading={loading}
          loadingText="Sending…"
          disabled={!email || coolingDown}
          onClick={() => void onResend()}
        >
          <MailGlyph className="shrink-0" />
          {coolingDown ? `Resend in ${formatCooldown(remainingMs)}` : 'Resend email'}
        </Button>

        <p className="text-center text-xs text-navy-900/55">
          {coolingDown
            ? 'A short cooldown stops accidental repeats and email rate limits.'
            : 'Did not get it? Resend once, then wait a minute before trying again.'}
        </p>
      </div>
    </AuthShell>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy-950" />}>
      <CheckEmailBody />
    </Suspense>
  );
}

'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthShell } from '../../../components/auth/auth-shell';

function CheckEmailBody() {
  const search = useSearchParams();
  const email = search.get('email');
  const reason = search.get('reason');

  return (
    <AuthShell
      title="Check your email"
      subtitle={
        reason === 'reset'
          ? 'We sent a reset link. Open it on this device to choose a new password.'
          : 'We sent a magic link. Open it on this device to finish signing in.'
      }
      footer={
        <Link href="/auth/sign-in/" className="font-bold text-orange-700 dark:text-orange-400">
          Back to sign in
        </Link>
      }
    >
      <div className="rounded-[1.5rem] border border-orange-500/25 bg-orange-500/10 px-4 py-5 text-sm text-foreground">
        <p className="font-semibold">Inbox tip</p>
        <p className="mt-2 text-muted-foreground">
          {email
            ? `Look for a message to ${email}.`
            : 'Look for a message from AskAlert.'}{' '}
          If it is not there, check spam. The link expires for your safety.
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

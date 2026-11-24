'use client';

import Link from 'next/link';
import { Button } from '@askalert/ui';
import { AppModeBar } from '../../components/auth/app-mode-bar';
import { RequireAuth } from '../../components/auth/require-auth';
import { useMode } from '../../lib/auth/mode-provider';

export default function VendorHomePage() {
  const { vendorCta } = useMode();

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <AppModeBar />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700 dark:text-orange-400">
            Vendor mode
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Your vendor workspace</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Same AskAlert account. Separate vendor profile. Full onboarding arrives in the next
            prompts — for now you can start the path or stay in buyer mode.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={vendorCta.kind === 'become' ? vendorCta.href : '/vendor/onboarding/'}>
              {vendorCta.kind === 'become' ? 'Become a vendor' : 'Continue onboarding'}
            </Button>
            <Button href="/app/" variant="secondary">
              Back to buyer mode
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Self-dealing is blocked: you cannot book, review, or message your own vendor profile.{' '}
            <Link href="/app/" className="font-semibold text-orange-700 dark:text-orange-400">
              Return home
            </Link>
          </p>
        </main>
      </div>
    </RequireAuth>
  );
}

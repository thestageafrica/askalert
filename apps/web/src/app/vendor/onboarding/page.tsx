'use client';

import { Button } from '@askalert/ui';
import { AppModeBar } from '../../../components/auth/app-mode-bar';
import { RequireAuth } from '../../../components/auth/require-auth';

export default function VendorOnboardingPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <AppModeBar />
        <main className="mx-auto max-w-2xl px-4 py-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700 dark:text-orange-400">
            Vendor onboarding
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Coming next</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Prompt 26 adds the full resumable wizard: who you are, categories, areas, rate cards,
            availability, documents, and payout details. This page is the entry point so mode
            switching already works.
          </p>
          <div className="mt-8">
            <Button href="/app/" variant="secondary">
              Stay in buyer mode for now
            </Button>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}

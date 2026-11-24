'use client';

import Link from 'next/link';
import { Button, cn } from '@askalert/ui';
import { useAuth } from '../../lib/auth/auth-provider';
import { useMode } from '../../lib/auth/mode-provider';

export function AppModeBar() {
  const { profile, signOut, user } = useAuth();
  const { mode, switchTo, vendorCta } = useMode();
  const phonePending = Boolean(profile?.phoneE164 && !profile.phoneVerifiedAt);

  if (!user) {
    return null;
  }

  return (
    <div className="border-b border-border/70 bg-card/80 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">
            {profile?.displayName || user.email}
          </p>
          {phonePending ? (
            <p className="mt-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
              Verify your WhatsApp number · pending
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-border bg-surface p-1">
            <button
              type="button"
              className={cn(
                'min-h-10 rounded-full px-3 text-xs font-bold',
                mode === 'buyer' ? 'bg-navy-950 text-surface' : 'text-muted-foreground',
              )}
              onClick={() => switchTo('buyer')}
            >
              Buyer
            </button>
            <button
              type="button"
              className={cn(
                'min-h-10 rounded-full px-3 text-xs font-bold',
                mode === 'vendor' ? 'bg-navy-950 text-surface' : 'text-muted-foreground',
              )}
              onClick={() => switchTo('vendor')}
            >
              Vendor
            </button>
          </div>
          {vendorCta.kind === 'become' ? (
            <Button href={vendorCta.href} variant="secondary" className="min-h-10 text-xs">
              {vendorCta.label}
            </Button>
          ) : null}
          <Link
            href="/app/account/"
            className="min-h-10 rounded-full px-3 text-xs font-bold text-orange-700 dark:text-orange-400"
          >
            Account
          </Link>
          <button
            type="button"
            className="min-h-10 rounded-full px-3 text-xs font-bold text-muted-foreground hover:text-foreground"
            onClick={() => void signOut(false)}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

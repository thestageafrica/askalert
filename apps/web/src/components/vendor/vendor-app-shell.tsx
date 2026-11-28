'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { Logo, cn } from '@askalert/ui';
import { useMode } from '../../lib/auth/mode-provider';
import { useVendorStore } from '../../lib/vendor/vendor-store';

const NAV = [
  { href: '/vendor/', label: 'Home', match: (p: string) => p === '/vendor' || p === '/vendor/' },
  {
    href: '/vendor/leads/',
    label: 'Leads',
    match: (p: string) => p.startsWith('/vendor/leads'),
  },
  {
    href: '/vendor/bookings/',
    label: 'Bookings',
    match: (p: string) => p.startsWith('/vendor/bookings'),
  },
  {
    href: '/vendor/earnings/',
    label: 'Earnings',
    match: (p: string) => p.startsWith('/vendor/earnings'),
  },
] as const;

export function VendorAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/vendor/';
  const { switchTo } = useMode();
  const { openLeads, draft } = useVendorStore();
  const onboarding = pathname.startsWith('/vendor/onboarding');

  return (
    <div className="min-h-screen bg-surface-subtle">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/90 backdrop-blur-md pt-[max(0.35rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex h-12 max-w-5xl items-center gap-3 px-4 lg:h-14 lg:px-8">
          <Link href="/vendor/" className="shrink-0">
            <Logo className="h-7 w-auto" />
          </Link>
          <p className="hidden text-xs font-bold uppercase tracking-wide text-orange-600 sm:block">
            Vendor
          </p>
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full border border-border/70 bg-card-muted px-2.5 py-1 text-[10px] font-bold uppercase text-muted-foreground">
              {draft.status.replace('_', ' ')}
            </span>
            <button
              type="button"
              className="min-h-10 rounded-full px-3 text-xs font-bold text-orange-700"
              onClick={() => switchTo('buyer')}
            >
              Buyer mode
            </button>
          </div>
        </div>
        {!onboarding ? (
          <nav
            aria-label="Vendor"
            className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 pb-2 lg:px-8"
          >
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative min-h-10 shrink-0 rounded-full px-3.5 text-sm font-bold transition',
                    active
                      ? 'bg-navy-950 text-surface'
                      : 'text-muted-foreground hover:bg-navy-950/5 hover:text-foreground',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="inline-flex min-h-10 items-center gap-1.5">
                    {item.label}
                    {item.label === 'Leads' && openLeads > 0 ? (
                      <span className="rounded-full bg-orange-500 px-1.5 text-[10px] text-navy-900">
                        {openLeads}
                      </span>
                    ) : null}
                  </span>
                </Link>
              );
            })}
            <Link
              href="/vendor/services/"
              className={cn(
                'min-h-10 shrink-0 rounded-full px-3.5 text-sm font-bold',
                pathname.startsWith('/vendor/services')
                  ? 'bg-navy-950 text-surface'
                  : 'text-muted-foreground hover:bg-navy-950/5',
              )}
            >
              <span className="inline-flex min-h-10 items-center">Services</span>
            </Link>
            <Link
              href="/vendor/availability/"
              className={cn(
                'min-h-10 shrink-0 rounded-full px-3.5 text-sm font-bold',
                pathname.startsWith('/vendor/availability')
                  ? 'bg-navy-950 text-surface'
                  : 'text-muted-foreground hover:bg-navy-950/5',
              )}
            >
              <span className="inline-flex min-h-10 items-center">Hours</span>
            </Link>
            <Link
              href="/vendor/profile/"
              className={cn(
                'min-h-10 shrink-0 rounded-full px-3.5 text-sm font-bold',
                pathname.startsWith('/vendor/profile')
                  ? 'bg-navy-950 text-surface'
                  : 'text-muted-foreground hover:bg-navy-950/5',
              )}
            >
              <span className="inline-flex min-h-10 items-center">Profile</span>
            </Link>
          </nav>
        ) : null}
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-8 lg:py-8">{children}</div>
    </div>
  );
}

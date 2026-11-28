'use client';

import Link from 'next/link';
import { Button, cn } from '@askalert/ui';
import { createMoney, formatNaira } from '@askalert/payments';
import { usePlanStore } from '../../lib/app/plan-store';
import { useVendorStore } from '../../lib/vendor/vendor-store';

export function VendorDashboard() {
  const { draft, leads, bookings, openLeads, isOnboardingComplete, ready } = useVendorStore();
  const { planName, check } = usePlanStore();
  const leadAllowance = check('send_whatsapp');

  if (!ready) {
    return <div className="h-48 animate-pulse rounded-2xl bg-card-muted" aria-busy="true" />;
  }

  if (!isOnboardingComplete && draft.status === 'draft') {
    return (
      <div className="rounded-[1.5rem] border border-border/60 bg-card p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Get started</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Finish vendor onboarding</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tell us who you are, what you offer, and where you work. Takes a few minutes — we save every
          step.
        </p>
        <Button href="/vendor/onboarding/" className="mt-6">
          Continue onboarding
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Vendor home</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
          {draft.displayName || 'Your workspace'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Status: {draft.status.replace('_', ' ')} · Plan: {planName}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Open leads"
          value={String(openLeads)}
          href="/vendor/leads/"
        />
        <SummaryCard
          label="Lead alerts left"
          value={
            leadAllowance.remaining == null ? '—' : String(Math.max(0, leadAllowance.remaining))
          }
          href="/app/plan/"
        />
        <SummaryCard label="Bookings" value={String(bookings.length)} href="/vendor/bookings/" />
        <SummaryCard
          label="Services"
          value={String(
            Object.values(draft.serviceSlugsByCategory).reduce(
              (total, slugs) => total + slugs.length,
              0,
            ),
          )}
          href="/vendor/services/"
        />
      </div>

      <section className="rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold text-foreground">Latest leads</h2>
          <Link href="/vendor/leads/" className="text-sm font-bold text-orange-600">
            Inbox
          </Link>
        </div>
        <ul className="mt-4 space-y-3">
          {leads.slice(0, 3).map((lead) => (
            <li key={lead.id}>
              <Link
                href={`/vendor/leads/?id=${encodeURIComponent(lead.id)}`}
                className="block rounded-2xl border border-border/60 px-4 py-3 transition hover:border-orange-500/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-foreground">{lead.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {lead.area} · {formatNaira(createMoney(lead.budgetMinor))}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                      lead.status === 'new'
                        ? 'bg-orange-500 text-navy-900'
                        : 'bg-card-muted text-muted-foreground',
                    )}
                  >
                    {lead.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button href="/vendor/services/" className="min-h-11">
          My services
        </Button>
        <Button href="/vendor/availability/" variant="secondary" className="min-h-11">
          Edit availability
        </Button>
        <Button href="/vendor/profile/" variant="ghost">
          Public profile preview
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[1.35rem] border border-border/60 bg-card p-4 shadow-sm transition hover:-translate-y-0.5"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-foreground">{value}</p>
    </Link>
  );
}

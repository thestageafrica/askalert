'use client';

import Link from 'next/link';
import { useSitePagesAdmin } from '../../lib/site-pages-admin-store';

const cards = [
  {
    href: '/public-pages/header/',
    title: 'Shared page header',
    body: 'Background image, fade strength, height, and brand label used by every public page.',
  },
  {
    href: '/public-pages/privacy/',
    title: 'Privacy Policy',
    body: 'Edit every section, draft banner, dates, and SEO copy for /privacy.',
  },
  {
    href: '/public-pages/terms/',
    title: 'Terms of Use',
    body: 'Edit Terms, Vendor Terms annexes, and related notices for /terms.',
  },
  {
    href: '/public-pages/contact/',
    title: 'Contact',
    body: 'Edit contact page copy, WhatsApp prefill, and CTA for /contact.',
  },
] as const;

export default function PublicPagesHubPage() {
  const { ready, lastSyncedAt, syncError } = useSitePagesAdmin();

  if (!ready) {
    return (
      <div
        className="h-40 animate-pulse rounded-2xl border border-border bg-card-muted"
        aria-busy="true"
        aria-label="Loading public pages"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">Website</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Public pages</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          One place to edit the shared header and public legal/contact pages. Changes save to
          Supabase so askalert.com can load them.
        </p>
        {lastSyncedAt ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Last loaded {new Date(lastSyncedAt).toLocaleString()}
          </p>
        ) : null}
        {syncError ? <p className="mt-2 text-sm text-danger">{syncError}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm transition hover:border-orange-500/40 hover:shadow-md"
          >
            <h2 className="text-lg font-extrabold text-foreground">{card.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
            <p className="mt-4 text-sm font-semibold text-orange-700">Open editor →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

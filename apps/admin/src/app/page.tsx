'use client';

import Link from 'next/link';
import { Button, Card, cn } from '@askalert/ui';
import { DbSizeCard } from '../components/db-size-card';
import { StatusChip } from '../components/status-chip';
import { useAdminStore } from '../lib/admin-store';

const cards = [
  { label: 'Active vendors', value: '128', hint: 'Verified in Lagos', tone: 'orange' },
  { label: 'Requests today', value: '46', hint: 'Across live categories', tone: 'navy' },
  { label: 'Conversion', value: '31%', hint: 'Ask → booked', tone: 'success' },
] as const;

const activity = [
  { title: 'Shortlets quote burst', detail: '12 hosts reached · 4 replies', time: '2m ago' },
  { title: 'Events category edited', detail: 'Payout bounds updated', time: '18m ago' },
  { title: 'Vendor waitlist', detail: '3 new home-care applications', time: '1h ago' },
] as const;

export default function DashboardPage() {
  const { categories } = useAdminStore();
  const live = categories.filter(
    (category) => category.draft.status === 'pilot' || category.draft.status === 'live',
  );
  const draft = categories.filter((category) => category.draft.status === 'draft').length;

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-navy-700/30 bg-navy-950 px-5 py-6 text-surface shadow-[0_20px_50px_color-mix(in_srgb,var(--navy-950)_18%,transparent)] sm:px-7">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_70%_at_0%_0%,_var(--navy-700),_transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_100%_0%,_var(--glow-orange-strong),_transparent_60%)]"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-400">
              Today in Lagos
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Operations dashboard</h1>
            <p className="mt-2 max-w-xl text-sm text-surface/70">
              {live.length} live categories · {draft} drafts · mock numbers for Phase 1.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href="/categories">Manage categories</Button>
            <Button href="/requests" variant="secondary" className="border-surface/20 bg-surface/10 text-surface hover:bg-surface/15">
              View requests
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card
            key={card.label}
            className="overflow-hidden border border-border/70 p-0 shadow-[0_12px_28px_color-mix(in_srgb,var(--navy-950)_6%,transparent)]"
          >
            <div
              className={cn(
                'h-1.5 w-full',
                card.tone === 'orange' && 'bg-orange-500',
                card.tone === 'navy' && 'bg-navy-950',
                card.tone === 'success' && 'bg-success',
              )}
            />
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight">{card.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{card.hint}</p>
            </div>
          </Card>
        ))}
        <DbSizeCard />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border border-border/70 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold">Live categories</h2>
              <p className="text-sm text-muted-foreground">Pilot and live configs</p>
            </div>
            <Link href="/categories" className="text-sm font-semibold text-orange-600">
              All
            </Link>
          </div>
          <ul className="space-y-2">
            {live.slice(0, 5).map((category) => (
              <li key={category.id}>
                <Link
                  href={`/categories/edit/?slug=${encodeURIComponent(category.draft.slug)}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card-muted/60 px-3.5 py-3 transition hover:border-orange-500/30 hover:bg-orange-500/5"
                >
                  <div>
                    <p className="font-bold text-foreground">{category.draft.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.vendorsCount} vendors · {category.draft.slug}
                    </p>
                  </div>
                  <StatusChip status={category.draft.status} />
                </Link>
              </li>
            ))}
            {live.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                No live categories yet. Publish from the editor.
              </li>
            ) : null}
          </ul>
        </Card>

        <Card className="border border-border/70 p-5 shadow-sm">
          <h2 className="text-base font-extrabold">Recent activity</h2>
          <p className="text-sm text-muted-foreground">Mock feed for the shell</p>
          <ul className="mt-4 space-y-3">
            {activity.map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-border/60 bg-surface px-3.5 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-orange-600">
                    {item.time}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

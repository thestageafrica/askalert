'use client';

import Link from 'next/link';
import { useState } from 'react';
import { listSeedCategories } from '@askalert/category-engine';
import { Button, Chip, Input, cn } from '@askalert/ui';
import { AppHeader } from './app-header';
import { CategoryGlyph } from './category-glyph';
import { EmptyState } from './empty-state';
import { StatusPill } from './status-pill';
import { useMockStore } from '../../lib/app/mock-store';

function isLiveCategory(status: string) {
  return status === 'pilot' || status === 'live';
}

export function HomeView() {
  const { latestRequest, notifyInterest, addNotifyInterest, account } = useMockStore();
  const [query, setQuery] = useState('');

  const categories = listSeedCategories().filter((category) =>
    query.trim()
      ? category.name.toLowerCase().includes(query.trim().toLowerCase())
      : true,
  );

  return (
    <div>
      <AppHeader
        title="What do you need?"
        subtitle="AskAlert will chase verified vendors in Lagos."
        action={
          <Chip className="border-surface/15 bg-navy-900/50 text-surface" statusDot>
            Live
          </Chip>
        }
      />

      <div className="space-y-6 px-4 pt-2">
        <div className="relative -mt-1">
          <Input
            aria-label="Search categories"
            placeholder="Search shortlets, events, home care…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="rounded-2xl border-border/70 bg-card py-3.5 shadow-[0_10px_28px_color-mix(in_srgb,var(--navy-950)_6%,transparent)]"
          />
        </div>

        {latestRequest ? (
          <section aria-labelledby="latest-request-heading">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="latest-request-heading" className="text-sm font-bold text-foreground">
                Latest request
              </h2>
              <Link
                href={`/app/request/${latestRequest.id}`}
                className="text-sm font-semibold text-orange-600"
              >
                Open
              </Link>
            </div>
            <Link
              href={`/app/request/${latestRequest.id}`}
              className="block overflow-hidden rounded-[1.5rem] border border-orange-500/25 bg-gradient-to-br from-orange-500/15 via-card to-card p-4 shadow-sm transition hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                    {latestRequest.categoryName}
                  </p>
                  <p className="mt-1 text-base font-extrabold text-foreground">
                    {latestRequest.title}
                  </p>
                </div>
                <StatusPill status={latestRequest.status} />
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-navy-950/5 px-3 py-2.5">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-orange-500 opacity-50" />
                  <span className="relative inline-flex size-2 rounded-full bg-orange-500" />
                </span>
                <p className="text-xs font-semibold text-muted-foreground">
                  {latestRequest.quotes.length > 0
                    ? `${latestRequest.quotes.length} quotes waiting`
                    : 'Vendors being asked now'}
                </p>
              </div>
            </Link>
          </section>
        ) : null}

        <section aria-labelledby="categories-heading">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="categories-heading" className="text-sm font-bold text-foreground">
                Categories
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Live now and coming soon</p>
            </div>
          </div>

          {categories.length === 0 ? (
            <EmptyState
              title="No matches"
              description="Try another word, or clear search to see live categories."
              action={
                <Button variant="secondary" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => {
                const live = isLiveCategory(category.status);
                const watching = notifyInterest.includes(category.slug);
                return (
                  <div
                    key={category.slug}
                    className={cn(
                      'relative flex min-h-44 flex-col overflow-hidden rounded-[1.4rem] p-4 transition',
                      live
                        ? 'border border-border/60 bg-card shadow-[0_12px_30px_color-mix(in_srgb,var(--navy-950)_7%,transparent)] hover:-translate-y-0.5'
                        : 'border border-dashed border-border bg-card-muted/80',
                    )}
                  >
                    {live ? (
                      <div
                        className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-orange-500/10"
                        aria-hidden
                      />
                    ) : null}
                    <CategoryGlyph slug={category.slug} live={live} />
                    <p className="relative mt-3 text-sm font-extrabold text-foreground">
                      {category.name}
                    </p>
                    <p className="relative mt-1 text-xs text-muted-foreground">
                      {live ? 'Live in Lagos' : 'Coming soon'}
                    </p>
                    <div className="relative mt-auto pt-4">
                      {live ? (
                        <Button href={`/app/new/${category.slug}`} className="w-full">
                          Start ask
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={() => addNotifyInterest(category.slug)}
                          disabled={watching}
                        >
                          {watching ? 'We’ll notify you' : 'Notify me'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <p className="pb-2 text-center text-xs text-muted-foreground">
          Signed in as {account.phone}
        </p>
      </div>
    </div>
  );
}

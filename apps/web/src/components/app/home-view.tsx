'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listSeedCategories } from '@askalert/category-engine';
import { Button, Chip, Input, Skeleton, cn } from '@askalert/ui';
import { AppHeader } from './app-header';
import { useMockStore } from '../../lib/app/mock-store';

function isLiveCategory(status: string) {
  return status === 'pilot' || status === 'live';
}

export function HomeView() {
  const { ready, latestRequest, notifyInterest, addNotifyInterest, account } = useMockStore();
  const [query, setQuery] = useState('');
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => setBooting(false), 350);
    return () => window.clearTimeout(id);
  }, []);

  const categories = listSeedCategories().filter((category) =>
    query.trim()
      ? category.name.toLowerCase().includes(query.trim().toLowerCase())
      : true,
  );

  if (!ready || booting) {
    return (
      <div className="space-y-4 p-4" aria-busy="true" aria-label="Loading home">
        <Skeleton className="h-28 w-full rounded-[1.75rem]" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

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

      <div className="space-y-6 px-4 pt-5">
        <Input
          aria-label="Search categories"
          placeholder="Search shortlets, events, home care…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="rounded-2xl border-border/80 bg-card shadow-sm"
        />

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
              className="block rounded-[1.5rem] border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-card to-card p-4 shadow-sm transition hover:-translate-y-0.5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                {latestRequest.categoryName}
              </p>
              <p className="mt-1 text-base font-extrabold text-foreground">{latestRequest.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Status:{' '}
                <span className="font-semibold text-foreground">
                  {latestRequest.status.replaceAll('_', ' ')}
                </span>
              </p>
            </Link>
          </section>
        ) : null}

        <section aria-labelledby="categories-heading">
          <h2 id="categories-heading" className="mb-3 text-sm font-bold text-foreground">
            Categories
          </h2>
          {categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card-muted p-6 text-center">
              <p className="font-semibold text-foreground">No matches</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try another word, or browse live categories below.
              </p>
              <Button className="mt-4" variant="secondary" onClick={() => setQuery('')}>
                Clear search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => {
                const live = isLiveCategory(category.status);
                const watching = notifyInterest.includes(category.slug);
                return (
                  <div
                    key={category.slug}
                    className={cn(
                      'flex min-h-36 flex-col rounded-[1.35rem] p-4',
                      live
                        ? 'border border-border/70 bg-card shadow-sm'
                        : 'border border-dashed border-border bg-card-muted/70',
                    )}
                  >
                    <p className="text-sm font-extrabold text-foreground">{category.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {live ? 'Live in Lagos' : 'Coming soon'}
                    </p>
                    <div className="mt-auto pt-4">
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

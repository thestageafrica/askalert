'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Chip, Input, cn } from '@askalert/ui';
import { AppHeader } from './app-header';
import { CategoryGlyph } from './category-glyph';
import { EmptyState } from './empty-state';
import { StatusPill } from './status-pill';
import { useMockStore } from '../../lib/app/mock-store';
import { requestHref } from '../../lib/app/static-nav';
import { useCategories } from '../../lib/use-categories';

function isLiveCategory(status: string) {
  return status === 'pilot' || status === 'live';
}

export function HomeView() {
  const searchParams = useSearchParams();
  const { latestRequest, notifyInterest, addNotifyInterest, account } = useMockStore();
  const { categories: allCategories, loading } = useCategories();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fromUrl = searchParams.get('q');
    if (fromUrl) {
      setQuery(fromUrl);
    }
  }, [searchParams]);

  const categories = allCategories.filter((category) =>
    query.trim()
      ? category.name.toLowerCase().includes(query.trim().toLowerCase())
      : true,
  );

  const liveChips = allCategories
    .filter((category) => isLiveCategory(category.status))
    .slice(0, 6);

  return (
    <div>
      {/* Mobile header */}
      <div className="lg:hidden">
        <AppHeader
          title="What do you need?"
          subtitle="AskAlert will chase verified vendors in Lagos Nigeria."
          imageSrc="/brand/askalert-images-1.jpg"
          action={
            <Chip className="border-surface/15 bg-navy-900/50 text-surface" statusDot>
              Live
            </Chip>
          }
        />
      </div>

      <div className="space-y-6 px-4 pt-2 lg:space-y-10 lg:px-0 lg:pt-2">
        {/* Desktop hero */}
        <section className="relative hidden overflow-hidden rounded-[2rem] border border-border/50 bg-navy-950 px-10 py-12 text-surface shadow-[0_28px_70px_color-mix(in_srgb,var(--navy-950)_22%,transparent)] lg:block">
          <img
            src="/brand/askalert-images-1.jpg"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[78%_center]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-950 from-[0%] via-navy-950/90 via-[48%] to-navy-950/25 to-[92%]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-navy-950/75 via-transparent to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_55%_at_88%_30%,_var(--glow-orange-strong),_transparent_70%)]"
            aria-hidden
          />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
              Lagos Nigeria · Verified vendors
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] xl:text-5xl">
              What do you need?
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-surface/80">
              AskAlert asks vendors, compares offers, and brings you the best ones.
            </p>
            <div className="mt-7 max-w-xl">
              <Input
                name="category-search-desktop"
                aria-label="Search categories"
                placeholder="What do you need?"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="rounded-2xl border-surface/15 bg-surface py-4 text-navy-900 shadow-[0_16px_40px_rgba(0,0,0,0.25)] placeholder:text-navy-900/40"
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {liveChips.map((category) => (
                <button
                  key={category.slug}
                  type="button"
                  className="rounded-full border border-surface/20 bg-surface/10 px-3.5 py-2 text-xs font-bold text-surface transition duration-200 hover:-translate-y-0.5 hover:border-orange-400/50 hover:bg-orange-500 hover:text-navy-900"
                  onClick={() => setQuery(category.name)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="relative -mt-1 lg:hidden">
          <Input
            name="category-search"
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
              <h2 id="latest-request-heading" className="text-sm font-bold text-foreground lg:text-base">
                Your latest requests
              </h2>
              <a
                href={requestHref(latestRequest.id)}
                className="text-sm font-semibold text-orange-600"
              >
                Open
              </a>
            </div>
            <a
              href={requestHref(latestRequest.id)}
              className="block overflow-hidden rounded-[1.5rem] border border-orange-500/25 bg-gradient-to-br from-orange-500/15 via-card to-card p-4 shadow-sm transition hover:-translate-y-0.5 lg:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                    {latestRequest.categoryName}
                  </p>
                  <p className="mt-1 text-base font-extrabold text-foreground lg:text-xl">
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
            </a>
          </section>
        ) : null}

        <section aria-labelledby="categories-heading">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="categories-heading" className="text-sm font-bold text-foreground lg:text-base">
                Categories
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Live now and coming soon</p>
            </div>
          </div>

          {loading ? (
            <div
              className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4"
              aria-busy="true"
              aria-label="Loading categories"
            >
              {[0, 1, 2, 3, 4, 5].map((slot) => (
                <div
                  key={slot}
                  className="min-h-44 animate-pulse rounded-[1.4rem] border border-border/60 bg-card-muted/80"
                />
              ))}
            </div>
          ) : categories.length === 0 ? (
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
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 lg:gap-4">
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
                      {live ? 'Live in Lagos Nigeria' : 'Coming soon'}
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

        <section className="hidden gap-5 lg:grid lg:grid-cols-3">
          {[
            { title: 'Verified', body: 'Vendors are checked before they quote.' },
            { title: 'Protected', body: 'Staged payouts keep your money safe.' },
            { title: 'Private', body: 'Your number stays off public listings.' },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[1.5rem] border border-border/60 bg-card p-6 shadow-[0_12px_32px_color-mix(in_srgb,var(--navy-950)_6%,transparent)] transition duration-200 hover:-translate-y-0.5"
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="hidden overflow-hidden rounded-[1.75rem] border border-border/60 bg-card p-8 shadow-[0_12px_32px_color-mix(in_srgb,var(--navy-950)_6%,transparent)] lg:block">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">How it works</h2>
          <ol className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              'Tell AskAlert what you need.',
              'We ask verified vendors and compare offers.',
              'You choose, then protect your payment.',
            ].map((step, index) => (
              <li
                key={step}
                className="rounded-2xl border border-border/50 bg-surface-subtle p-5 transition duration-200 hover:border-orange-500/30"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <p className="pb-2 text-center text-xs text-muted-foreground lg:hidden">
          Signed in as {account.phone}
        </p>
      </div>
    </div>
  );
}

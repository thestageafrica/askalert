'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import type { PlanDefinition } from '@askalert/core';
import { getSeedSitePage, type PublicPageHeader } from '@askalert/db';
import { Accordion, Button, Container, Section, cn } from '@askalert/ui';
import {
  chatExplainer,
  marketingBuyerPlans,
  marketingVendorPlan,
  planFeatureLines,
  planPriceLabel,
  plansFaqItems,
} from '../../lib/plan-marketing';
import { getWhatsAppUrl } from '../../lib/site';
import { loadPublicSitePage } from '../../lib/site-pages';
import { PublicPageHero } from '../public/public-page-hero';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export function PlansPageView() {
  const buyers = marketingBuyerPlans();
  const vendor = marketingVendorPlan();
  const starterUrl = getWhatsAppUrl('Hi AskAlert, I want Starter.');
  const vendorUrl = getWhatsAppUrl('Hi AskAlert, I want to join as a vendor.');
  const [header, setHeader] = useState<PublicPageHeader>(() => getSeedSitePage('header'));

  useEffect(() => {
    let cancelled = false;
    void loadPublicSitePage('header').then((next) => {
      if (!cancelled) {
        setHeader(next);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <PublicPageHero
          header={{ ...header, minHeightPx: Math.max(header.minHeightPx, 320) }}
          eyebrow="Plans"
          title={
            <>
              Ask freely.
              <span className="mt-2 block text-orange-400">Upgrade when you need more.</span>
            </>
          }
          description="Free to try. Starter when you want more asks and WhatsApp chat. Vendors join free with a clear lead-alert allowance."
        >
          <div className="flex flex-wrap gap-3">
            <Button href="/app" size="lg">
              Open the app
            </Button>
            <Button
              href={starterUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="lg"
              className="border-surface/25 bg-surface/10 text-surface hover:bg-surface/15"
            >
              Ask about Starter
            </Button>
          </div>
        </PublicPageHero>

        <div className="bg-background">
          <Container width="xl">
            <Section
              eyebrow="Buyers"
              title="Free and Starter"
              description="Read prices from our plan list. Limits reset each period."
            >
              <div className="grid gap-5 lg:grid-cols-2">
                {buyers.map((plan) => (
                  <FullPlanCard
                    key={plan.id}
                    plan={plan}
                    featured={plan.slug === 'buyer_starter'}
                    cta={
                      plan.slug === 'buyer_starter' ? (
                        <Button href={starterUrl} target="_blank" rel="noopener noreferrer" className="min-h-11">
                          Get Starter
                        </Button>
                      ) : (
                        <Button href="/app" variant="secondary" className="min-h-11">
                          Start free
                        </Button>
                      )
                    }
                  />
                ))}
              </div>
            </Section>
          </Container>
        </div>

        <div className="bg-surface-subtle dark:bg-navy-950/50">
          <Container width="xl">
            <Section
              eyebrow="Chat"
              title="What chat means here"
              description="Two ways to talk. Pick the plan that matches how you like to reply."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700 dark:text-orange-400">
                    Included on Free
                  </p>
                  <h3 className="mt-2 text-xl font-extrabold">{chatExplainer.inApp.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {chatExplainer.inApp.body}
                  </p>
                </div>
                <div className="relative overflow-hidden rounded-[1.75rem] border border-orange-400/35 bg-navy-950 p-6 text-surface shadow-[0_16px_40px_var(--glow-orange)]">
                  <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--glow-orange),_transparent_55%)]"
                    aria-hidden
                  />
                  <div className="relative">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">
                      Included on Starter
                    </p>
                    <h3 className="mt-2 text-xl font-extrabold">{chatExplainer.whatsapp.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-surface/75">
                      {chatExplainer.whatsapp.body}
                    </p>
                  </div>
                </div>
              </div>
            </Section>
          </Container>
        </div>

        {vendor ? (
          <div className="bg-background">
            <Container width="xl">
              <Section
                id="vendor-plans"
                eyebrow="Vendors"
                title="Free for vendors"
                description="Get matched leads without paying for ads."
              >
                <div className="relative overflow-hidden rounded-[2rem] border border-orange-500/25 bg-navy-950 p-8 text-surface sm:p-12">
                  <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--glow-orange),_transparent_55%)]"
                    aria-hidden
                  />
                  <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div>
                      <p className="text-3xl font-extrabold tracking-tight sm:text-4xl">{vendor.name}</p>
                      <p className="mt-2 text-2xl font-extrabold text-orange-400">
                        {planPriceLabel(vendor)}
                      </p>
                      <p className="mt-4 max-w-xl text-surface/75">{vendor.features.summary}</p>
                      <ul className="mt-6 space-y-2.5 text-sm text-surface/85">
                        {planFeatureLines(vendor).map((line) => (
                          <li key={line} className="flex gap-2">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange-400" aria-hidden />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-5 max-w-xl rounded-2xl border border-surface/15 bg-surface/5 px-4 py-3 text-sm text-surface/75">
                        Near your lead-alert limit? We send a digest so you still see opportunities —
                        we do not silently drop you.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Button href={vendorUrl} target="_blank" rel="noopener noreferrer" size="lg">
                        Join as a vendor
                      </Button>
                      <Link
                        href="/#vendors"
                        className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-surface/70 hover:text-surface"
                      >
                        Why vendors join AskAlert
                      </Link>
                    </div>
                  </div>
                </div>
              </Section>
            </Container>
          </div>
        ) : null}

        <div className="bg-surface-subtle dark:bg-navy-950/50">
          <Container width="xl">
            <Section
              eyebrow="Questions"
              title="Plans FAQ"
              description="Short answers before you upgrade."
            >
              <Accordion items={[...plansFaqItems]} />
              <p className="mt-8 text-sm text-muted-foreground">
                Still unsure?{' '}
                <Link href="/contact" className="font-bold text-orange-700 underline-offset-4 hover:underline dark:text-orange-400">
                  Contact us
                </Link>{' '}
                or{' '}
                <Link href="/#faq" className="font-bold text-orange-700 underline-offset-4 hover:underline dark:text-orange-400">
                  read the main FAQ
                </Link>
                .
              </p>
            </Section>
          </Container>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function FullPlanCard({
  plan,
  featured,
  cta,
}: {
  plan: PlanDefinition;
  featured: boolean;
  cta: ReactNode;
}) {
  return (
    <article
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border p-7 shadow-sm',
        featured
          ? 'border-orange-400/40 bg-navy-950 text-surface shadow-[0_20px_50px_var(--glow-orange)]'
          : 'border-border/80 bg-card',
      )}
    >
      {featured ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_0%,_var(--glow-orange-strong),_transparent_55%)]"
          aria-hidden
        />
      ) : null}
      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-3xl font-extrabold tracking-tight">{plan.name}</h3>
          {featured ? (
            <span className="rounded-full border border-orange-400/40 bg-orange-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-orange-300">
              Recommended
            </span>
          ) : null}
        </div>
        <p className={cn('mt-4 text-3xl font-extrabold', featured ? 'text-orange-400' : 'text-foreground')}>
          {planPriceLabel(plan)}
        </p>
        <p className={cn('mt-2 text-sm', featured ? 'text-surface/75' : 'text-muted-foreground')}>
          {plan.features.summary}
        </p>
        <ul className={cn('mt-6 space-y-2.5 text-sm', featured ? 'text-surface/85' : 'text-muted-foreground')}>
          {planFeatureLines(plan).map((line) => (
            <li key={line} className="flex gap-2">
              <span
                className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', featured ? 'bg-orange-400' : 'bg-orange-500')}
                aria-hidden
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-8">{cta}</div>
      </div>
    </article>
  );
}

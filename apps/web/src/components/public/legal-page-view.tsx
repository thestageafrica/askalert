'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container, cn } from '@askalert/ui';
import type { LegalPageContent, PublicPageHeader } from '@askalert/db';
import { getSeedSitePage } from '@askalert/db';
import { MarkdownLite } from '../../lib/markdown-lite';
import { loadPublicSitePage } from '../../lib/site-pages';
import { SiteFooter } from '../landing/site-footer';
import { SiteHeader } from '../landing/site-header';
import { PublicPageHero } from './public-page-hero';

type LegalSlug = 'privacy' | 'terms';

export function LegalPageView({ slug }: { slug: LegalSlug }) {
  const [header, setHeader] = useState<PublicPageHeader>(() => getSeedSitePage('header'));
  const [page, setPage] = useState<LegalPageContent>(() => getSeedSitePage(slug));
  const [activeId, setActiveId] = useState<string>(getSeedSitePage(slug).sections[0]?.id ?? '');

  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadPublicSitePage('header'), loadPublicSitePage(slug)]).then(
      ([nextHeader, nextPage]) => {
        if (cancelled) {
          return;
        }
        setHeader(nextHeader);
        setPage(nextPage);
        setActiveId(nextPage.sections[0]?.id ?? '');
        document.title = `${nextPage.metaTitle} | AskAlert`;
      },
    );
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    const nodes = page.sections
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!nodes.length || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.1, 0.35, 0.6] },
    );

    for (const node of nodes) {
      observer.observe(node);
    }
    return () => observer.disconnect();
  }, [page.sections]);

  const metaLine = [page.versionLabel, `Effective ${page.effectiveDate}`, `Updated ${page.lastUpdated}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <PublicPageHero
        header={header}
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.description}
        metaLine={metaLine}
      />

      <main className="relative pb-16 sm:pb-20">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-navy-950/8 to-transparent"
          aria-hidden
        />
        <Container width="xl" className="relative pt-10 sm:pt-12">
          {page.draftBanner.enabled ? (
            <div
              role="status"
              className="mb-8 rounded-2xl border border-warning/40 bg-warning/15 px-4 py-3 text-sm text-foreground"
            >
              <p className="font-extrabold tracking-wide text-orange-700 dark:text-orange-400">
                {page.draftBanner.title}
              </p>
              <p className="mt-1 text-muted-foreground">{page.draftBanner.body}</p>
            </div>
          ) : null}

          <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-600">
                On this page
              </p>
              <nav aria-label="Page sections" className="max-h-[70vh] space-y-1 overflow-y-auto pr-1">
                {page.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={cn(
                      'block rounded-lg px-2.5 py-2 text-sm transition',
                      activeId === section.id
                        ? 'bg-orange-500/15 font-semibold text-navy-900 dark:text-orange-300'
                        : 'text-muted-foreground hover:bg-surface-subtle hover:text-foreground',
                    )}
                  >
                    {section.heading}
                  </a>
                ))}
              </nav>
            </aside>

            <article className="min-w-0 space-y-10">
              {page.sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="legal-section-rise scroll-mt-28 border-b border-border/70 pb-10 last:border-b-0"
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                >
                  <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-[1.65rem]">
                    {section.heading}
                  </h2>
                  <div className="mt-4">
                    <MarkdownLite content={section.body} />
                  </div>
                </section>
              ))}

              <p className="text-sm text-muted-foreground">
                Related:{' '}
                {slug === 'privacy' ? (
                  <Link href="/terms/" className="font-semibold text-orange-700 hover:underline dark:text-orange-400">
                    Terms of Use
                  </Link>
                ) : (
                  <Link href="/privacy/" className="font-semibold text-orange-700 hover:underline dark:text-orange-400">
                    Privacy Policy
                  </Link>
                )}
                {' · '}
                <Link href="/contact/" className="font-semibold text-orange-700 hover:underline dark:text-orange-400">
                  Contact
                </Link>
              </p>
            </article>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}

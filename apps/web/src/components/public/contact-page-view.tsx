'use client';

import { useEffect, useState } from 'react';
import { Button, Container } from '@askalert/ui';
import { getSeedSitePage, type ContactPageContent, type PublicPageHeader } from '@askalert/db';
import { getWhatsAppUrl, isWhatsAppPlaceholder } from '../../lib/site';
import { loadPublicSitePage } from '../../lib/site-pages';
import { SiteFooter } from '../landing/site-footer';
import { SiteHeader } from '../landing/site-header';
import { PublicPageHero } from './public-page-hero';

export function ContactPageView() {
  const [header, setHeader] = useState<PublicPageHeader>(() => getSeedSitePage('header'));
  const [page, setPage] = useState<ContactPageContent>(() => getSeedSitePage('contact'));

  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadPublicSitePage('header'), loadPublicSitePage('contact')]).then(
      ([nextHeader, nextPage]) => {
        if (cancelled) {
          return;
        }
        setHeader(nextHeader);
        setPage(nextPage);
        document.title = `${nextPage.metaTitle} | AskAlert`;
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const whatsappUrl = getWhatsAppUrl(page.whatsappPrefill);
  const placeholder = isWhatsAppPlaceholder();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <PublicPageHero
        header={header}
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.description}
      />
      <main className="pb-16 sm:pb-20">
        <Container width="md" className="pt-10 sm:pt-12">
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

          <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
            {page.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {placeholder ? (
              <p className="rounded-2xl border border-warning/40 bg-warning/15 px-4 py-3 text-sm font-semibold text-foreground">
                WhatsApp number is still the placeholder in this environment. Set{' '}
                <code className="rounded bg-background/80 px-1.5 py-0.5 text-xs">
                  NEXT_PUBLIC_WHATSAPP_NUMBER
                </code>{' '}
                before going live.
              </p>
            ) : (
              <Button href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                {page.ctaLabel}
              </Button>
            )}
            {page.companyLine ? <p className="text-sm">{page.companyLine}</p> : null}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}

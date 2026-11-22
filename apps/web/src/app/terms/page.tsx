import type { Metadata } from 'next';
import { Container, Section } from '@askalert/ui';
import { DraftBanner } from '../../components/legal/draft-banner';
import { SiteFooter } from '../../components/landing/site-footer';
import { SiteHeader } from '../../components/landing/site-header';
import { getSiteUrl } from '../../lib/site';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: 'Terms of use',
  description: 'DRAFT AskAlert terms of use. Placeholder until legal review.',
  alternates: { canonical: `${siteUrl}/terms` },
  openGraph: {
    url: `${siteUrl}/terms`,
    title: 'Terms of use | AskAlert',
    description: 'DRAFT AskAlert terms of use. Placeholder until legal review.',
  },
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="py-12 sm:py-16">
        <Container width="md">
          <DraftBanner page="terms" />
          <Section
            eyebrow="DRAFT"
            title="Terms of use"
            description="These draft terms explain how AskAlert works in plain English. Final wording comes after legal review."
          >
            <div className="space-y-6 text-base leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">DRAFT.</strong> By using AskAlert you agree to
                ask for real needs, treat vendors fairly, and follow Nigerian law.
              </p>
              <p>
                AskAlert helps buyers in Lagos find verified vendors, compare offers, and choose how
                much payment protection to use. We are not a bank. Escrow holds are a product feature
                and will follow the final terms once published.
              </p>
              <p>
                You must be 18 or older. Do not post illegal, harmful, or misleading requests. We may
                suspend accounts that break these draft rules.
              </p>
              <p>
                Prices on the site may be demo or quote estimates. A booking is confirmed only after
                you complete checkout and receive confirmation from AskAlert.
              </p>
              <p>
                These draft terms are governed by the laws of the Federal Republic of Nigeria.
                Contact us via the Contact page for questions before the final version is published.
              </p>
            </div>
          </Section>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}

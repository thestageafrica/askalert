import type { Metadata } from 'next';
import { Container, Section } from '@askalert/ui';
import { DraftBanner } from '../../components/legal/draft-banner';
import { SiteFooter } from '../../components/landing/site-footer';
import { SiteHeader } from '../../components/landing/site-header';
import { getSiteUrl } from '../../lib/site';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'DRAFT AskAlert privacy policy. Placeholder until legal review.',
  alternates: { canonical: `${siteUrl}/privacy` },
  openGraph: {
    url: `${siteUrl}/privacy`,
    title: 'Privacy | AskAlert',
    description: 'DRAFT AskAlert privacy policy. Placeholder until legal review.',
  },
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="py-12 sm:py-16">
        <Container width="md">
          <DraftBanner page="privacy" />
          <Section
            eyebrow="DRAFT"
            title="Privacy policy"
            description="This draft explains what we collect and why. Final privacy wording comes after legal review."
          >
            <div className="space-y-6 text-base leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">DRAFT.</strong> AskAlert Technologies Limited
                (“AskAlert”) collects only what we need to match requests, alert vendors, and protect
                payments.
              </p>
              <p>
                We may process your name, WhatsApp number, request details, area in Lagos, and booking
                history. Contact details stay private until you book, unless you choose to share them
                earlier.
              </p>
              <p>
                We use this information to run the marketplace, prevent abuse, improve the product,
                and meet legal duties. We do not sell your personal information.
              </p>
              <p>
                Payment partners process card or transfer data under their own policies. AskAlert
                stores booking and payout-status details, not full card numbers, in Phase 1 demos.
              </p>
              <p>
                You can ask to see, correct, or delete personal data we hold by messaging us from the
                Contact page. This draft will be replaced after legal review.
              </p>
            </div>
          </Section>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}

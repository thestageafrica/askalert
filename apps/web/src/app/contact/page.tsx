import type { Metadata } from 'next';
import { Button, Container, Section } from '@askalert/ui';
import { DraftBanner } from '../../components/legal/draft-banner';
import { SiteFooter } from '../../components/landing/site-footer';
import { SiteHeader } from '../../components/landing/site-header';
import { getSiteUrl, getWhatsAppUrl, isWhatsAppPlaceholder } from '../../lib/site';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: 'Contact',
  description: 'DRAFT AskAlert contact page. Reach us on WhatsApp.',
  alternates: { canonical: `${siteUrl}/contact` },
  openGraph: {
    url: `${siteUrl}/contact`,
    title: 'Contact | AskAlert',
    description: 'DRAFT AskAlert contact page. Reach us on WhatsApp.',
  },
};

export default function ContactPage() {
  const whatsappUrl = getWhatsAppUrl('Hi AskAlert, I have a question.');
  const placeholder = isWhatsAppPlaceholder();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="py-12 sm:py-16">
        <Container width="md">
          <DraftBanner page="contact" />
          <Section
            eyebrow="DRAFT"
            title="Contact AskAlert"
            description="The fastest way to reach us in Lagos is WhatsApp. Email and office details will follow after legal review."
          >
            <div className="space-y-6 text-base leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">DRAFT.</strong> For buyer help, vendor onboarding,
                or press, message the AskAlert WhatsApp line below.
              </p>
              <p>
                Launch market: Lagos Nigeria. We reply during business hours when we can.
                Urgent booking issues should include your request ID if you have one.
              </p>
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
                  Message AskAlert on WhatsApp
                </Button>
              )}
              <p className="text-sm">
                Company (draft): AskAlert Technologies Limited. This page is placeholder content
                until legal review.
              </p>
            </div>
          </Section>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}

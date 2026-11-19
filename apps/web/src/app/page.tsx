import type { Metadata } from 'next';
import { Container } from '@askalert/ui';
import { Categories } from '../components/landing/categories';
import { Faq } from '../components/landing/faq';
import { Hero } from '../components/landing/hero';
import { HowItWorks } from '../components/landing/how-it-works';
import { PhoneShowcase } from '../components/landing/phone-showcase';
import { ProtectSlider } from '../components/landing/protect-slider';
import { SiteFooter } from '../components/landing/site-footer';
import { SiteHeader } from '../components/landing/site-header';
import { Trust } from '../components/landing/trust';
import { Vendors } from '../components/landing/vendors';
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  getSiteUrl,
} from '../lib/site';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} | ${SITE_TAGLINE}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: 'en_NG',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: siteUrl,
  description: SITE_DESCRIPTION,
  areaServed: {
    '@type': 'Place',
    name: 'Lagos, Nigeria',
  },
  slogan: SITE_TAGLINE,
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <div id="top" className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <main>
          <Hero />

          <div className="bg-background">
            <Container width="xl">
              <Categories />
            </Container>
          </div>

          <div className="bg-surface-subtle dark:bg-navy-950/50">
            <Container width="xl">
              <HowItWorks />
            </Container>
          </div>

          <div className="bg-background">
            <Container width="xl">
              <PhoneShowcase />
            </Container>
          </div>

          <div className="bg-surface-subtle dark:bg-navy-950/50">
            <Container width="xl">
              <ProtectSlider />
            </Container>
          </div>

          <div className="bg-background">
            <Container width="xl">
              <Trust />
            </Container>
          </div>

          <div className="bg-surface-subtle dark:bg-navy-950/50">
            <Container width="xl">
              <Vendors />
            </Container>
          </div>

          <div className="bg-background">
            <Container width="xl">
              <Faq />
            </Container>
          </div>
        </main>
        <SiteFooter />
      </div>
    </>
  );
}

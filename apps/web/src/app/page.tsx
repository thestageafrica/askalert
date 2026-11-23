import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Container } from '@askalert/ui';
import { Categories } from '../components/landing/categories';
import { Hero } from '../components/landing/hero';
import { HowItWorks } from '../components/landing/how-it-works';
import { SiteFooter } from '../components/landing/site-footer';
import { SiteHeader } from '../components/landing/site-header';
import { Trust } from '../components/landing/trust';
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  getSiteUrl,
} from '../lib/site';

const PhoneShowcase = dynamic(
  () =>
    import('../components/landing/phone-showcase').then((mod) => mod.PhoneShowcase),
  { ssr: true },
);
const ProtectSlider = dynamic(
  () =>
    import('../components/landing/protect-slider').then((mod) => mod.ProtectSlider),
  { ssr: true },
);
const Vendors = dynamic(
  () => import('../components/landing/vendors').then((mod) => mod.Vendors),
  { ssr: true },
);
const Faq = dynamic(
  () => import('../components/landing/faq').then((mod) => mod.Faq),
  { ssr: true },
);

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
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'AskAlert — Ask. Alert. Delivered.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: ['/twitter-og.png'],
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

          <div className="bg-background [content-visibility:auto] [contain-intrinsic-size:800px]">
            <Container width="xl">
              <PhoneShowcase />
            </Container>
          </div>

          <div className="bg-surface-subtle [content-visibility:auto] [contain-intrinsic-size:640px] dark:bg-navy-950/50">
            <Container width="xl">
              <ProtectSlider />
            </Container>
          </div>

          <div className="bg-background [content-visibility:auto] [contain-intrinsic-size:520px]">
            <Container width="xl">
              <Trust />
            </Container>
          </div>

          <div className="bg-surface-subtle [content-visibility:auto] [contain-intrinsic-size:520px] dark:bg-navy-950/50">
            <Container width="xl">
              <Vendors />
            </Container>
          </div>

          <div className="bg-background [content-visibility:auto] [contain-intrinsic-size:640px]">
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

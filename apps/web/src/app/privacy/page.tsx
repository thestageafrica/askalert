import type { Metadata } from 'next';
import { SEED_PRIVACY_PAGE } from '@askalert/db';
import { LegalPageView } from '../../components/public/legal-page-view';
import { getSiteUrl } from '../../lib/site';

const siteUrl = getSiteUrl();
const seed = SEED_PRIVACY_PAGE;

export const metadata: Metadata = {
  title: seed.metaTitle,
  description: seed.metaDescription,
  alternates: { canonical: `${siteUrl}/privacy` },
  openGraph: {
    url: `${siteUrl}/privacy`,
    title: `${seed.metaTitle} | AskAlert`,
    description: seed.metaDescription,
  },
  robots: seed.draftBanner.enabled ? { index: false, follow: true } : undefined,
};

export default function PrivacyPage() {
  return <LegalPageView slug="privacy" />;
}

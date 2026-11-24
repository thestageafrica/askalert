import type { Metadata } from 'next';
import { PlansPageView } from '../../components/landing/plans-page-view';
import { SITE_NAME, getSiteUrl } from '../../lib/site';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: 'Plans',
  description:
    'AskAlert plans for buyers and vendors in Lagos. Free to ask. Starter adds WhatsApp chat. Vendors join free.',
  alternates: { canonical: `${siteUrl}/plans` },
  openGraph: {
    url: `${siteUrl}/plans`,
    title: `Plans | ${SITE_NAME}`,
    description:
      'Free and Starter for buyers. Free for vendors with lead alerts. Plain English limits.',
  },
};

export default function PlansPage() {
  return <PlansPageView />;
}

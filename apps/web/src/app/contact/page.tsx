import type { Metadata } from 'next';
import { SEED_CONTACT_PAGE } from '@askalert/db';
import { ContactPageView } from '../../components/public/contact-page-view';
import { getSiteUrl } from '../../lib/site';

const siteUrl = getSiteUrl();
const seed = SEED_CONTACT_PAGE;

export const metadata: Metadata = {
  title: seed.metaTitle,
  description: seed.metaDescription,
  alternates: { canonical: `${siteUrl}/contact` },
  openGraph: {
    url: `${siteUrl}/contact`,
    title: `${seed.metaTitle} | AskAlert`,
    description: seed.metaDescription,
  },
};

export default function ContactPage() {
  return <ContactPageView />;
}

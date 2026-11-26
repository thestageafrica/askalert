import type { ContactPageContent } from './site-pages-schema';

export const SEED_CONTACT_PAGE: ContactPageContent = {
  metaTitle: 'Contact',
  metaDescription: 'Reach AskAlert on WhatsApp for buyer help, vendor onboarding, or press.',
  eyebrow: 'Contact',
  title: 'Talk to AskAlert',
  description:
    'The fastest way to reach us in Lagos is WhatsApp. We reply during business hours when we can.',
  draftBanner: {
    enabled: true,
    title: 'DRAFT — not legal advice',
    body: 'Office address and email channels will be confirmed after legal review. Prefer WhatsApp for now.',
  },
  paragraphs: [
    'For buyer help, vendor onboarding, or press, message the AskAlert WhatsApp line below.',
    'Launch market: Lagos, Nigeria. Urgent booking issues should include your request ID if you have one.',
  ],
  ctaLabel: 'Message AskAlert on WhatsApp',
  companyLine: 'AskAlert Technologies Limited · Lagos, Nigeria',
  whatsappPrefill: 'Hi AskAlert, I have a question.',
};

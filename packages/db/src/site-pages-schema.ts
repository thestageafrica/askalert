import { z } from 'zod';

export const sitePageSlugSchema = z.enum(['header', 'privacy', 'terms', 'contact']);
export type SitePageSlug = z.infer<typeof sitePageSlugSchema>;

export const publicPageHeaderSchema = z.object({
  backgroundImageUrl: z.string().min(1),
  overlayOpacity: z.number().min(0).max(100),
  minHeightPx: z.number().min(160).max(560),
  brandLabel: z.string().min(1),
});
export type PublicPageHeader = z.infer<typeof publicPageHeaderSchema>;

export const draftBannerSchema = z.object({
  enabled: z.boolean(),
  title: z.string(),
  body: z.string(),
});

export const legalSectionSchema = z.object({
  id: z.string().min(1),
  heading: z.string().min(1),
  body: z.string(),
});
export type LegalSection = z.infer<typeof legalSectionSchema>;

export const legalPageSchema = z.object({
  metaTitle: z.string().min(1),
  metaDescription: z.string().min(1),
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  versionLabel: z.string(),
  effectiveDate: z.string(),
  lastUpdated: z.string(),
  draftBanner: draftBannerSchema,
  sections: z.array(legalSectionSchema).min(1),
});
export type LegalPageContent = z.infer<typeof legalPageSchema>;

export const contactPageSchema = z.object({
  metaTitle: z.string().min(1),
  metaDescription: z.string().min(1),
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  draftBanner: draftBannerSchema,
  paragraphs: z.array(z.string()).min(1),
  ctaLabel: z.string().min(1),
  companyLine: z.string(),
  whatsappPrefill: z.string().min(1),
});
export type ContactPageContent = z.infer<typeof contactPageSchema>;

export function parsePublicPageHeader(value: unknown): PublicPageHeader {
  return publicPageHeaderSchema.parse(value);
}

export function parseLegalPage(value: unknown): LegalPageContent {
  return legalPageSchema.parse(value);
}

export function parseContactPage(value: unknown): ContactPageContent {
  return contactPageSchema.parse(value);
}

import type { AskAlertSupabase } from './client';
import {
  parseContactPage,
  parseLegalPage,
  parsePublicPageHeader,
  sitePageSlugSchema,
  type ContactPageContent,
  type LegalPageContent,
  type PublicPageHeader,
  type SitePageSlug,
} from './site-pages-schema';
import { SEED_CONTACT_PAGE } from './site-pages-seed-contact';
import { SEED_PUBLIC_PAGE_HEADER } from './site-pages-seed-header';
import { SEED_PRIVACY_PAGE } from './site-pages-seed-privacy';
import { SEED_TERMS_PAGE } from './site-pages-seed-terms';

export type SitePageContentMap = {
  header: PublicPageHeader;
  privacy: LegalPageContent;
  terms: LegalPageContent;
  contact: ContactPageContent;
};

export const SITE_PAGE_SEEDS: SitePageContentMap = {
  header: SEED_PUBLIC_PAGE_HEADER,
  privacy: SEED_PRIVACY_PAGE,
  terms: SEED_TERMS_PAGE,
  contact: SEED_CONTACT_PAGE,
};

export function getSeedSitePage<T extends SitePageSlug>(slug: T): SitePageContentMap[T] {
  return structuredClone(SITE_PAGE_SEEDS[slug]);
}

function parseSitePageContent(slug: SitePageSlug, value: unknown) {
  switch (slug) {
    case 'header':
      return parsePublicPageHeader(value);
    case 'privacy':
    case 'terms':
      return parseLegalPage(value);
    case 'contact':
      return parseContactPage(value);
  }
}

export async function loadSitePage<T extends SitePageSlug>(
  slug: T,
  client: AskAlertSupabase | null,
): Promise<SitePageContentMap[T]> {
  const seed = getSeedSitePage(slug);
  if (!client) {
    return seed;
  }

  const { data, error } = await client
    .from('site_pages')
    .select('content')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data?.content) {
    return seed;
  }

  try {
    return parseSitePageContent(slug, data.content) as SitePageContentMap[T];
  } catch {
    return seed;
  }
}

export async function loadAllSitePages(
  client: AskAlertSupabase | null,
): Promise<SitePageContentMap> {
  const [header, privacy, terms, contact] = await Promise.all([
    loadSitePage('header', client),
    loadSitePage('privacy', client),
    loadSitePage('terms', client),
    loadSitePage('contact', client),
  ]);
  return { header, privacy, terms, contact };
}

export async function saveSitePage<T extends SitePageSlug>(
  slug: T,
  content: SitePageContentMap[T],
  client: AskAlertSupabase,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsedSlug = sitePageSlugSchema.parse(slug);
  const parsed = parseSitePageContent(parsedSlug, content);

  const { error } = await client.from('site_pages').upsert({
    slug: parsedSlug,
    content: parsed as never,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export {
  contactPageSchema,
  draftBannerSchema,
  legalPageSchema,
  legalSectionSchema,
  parseContactPage,
  parseLegalPage,
  parsePublicPageHeader,
  publicPageHeaderSchema,
  sitePageSlugSchema,
  type ContactPageContent,
  type LegalPageContent,
  type LegalSection,
  type PublicPageHeader,
  type SitePageSlug,
} from './site-pages-schema';
export { DEFAULT_PUBLIC_PAGE_HEADER_IMAGE, SEED_PUBLIC_PAGE_HEADER } from './site-pages-seed-header';
export { SEED_CONTACT_PAGE } from './site-pages-seed-contact';
export { SEED_PRIVACY_PAGE } from './site-pages-seed-privacy';
export { SEED_TERMS_PAGE } from './site-pages-seed-terms';

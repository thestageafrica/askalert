import {
  getSeedSitePage,
  loadSitePage,
  type ContactPageContent,
  type LegalPageContent,
  type PublicPageHeader,
  type SitePageSlug,
} from '@askalert/db';
import { webBrowserClient, webSupabaseEnabled } from './supabase-browser';

export async function loadPublicSitePage<T extends SitePageSlug>(
  slug: T,
): Promise<
  T extends 'header'
    ? PublicPageHeader
    : T extends 'contact'
      ? ContactPageContent
      : LegalPageContent
> {
  if (!webSupabaseEnabled()) {
    return getSeedSitePage(slug) as never;
  }
  const client = webBrowserClient();
  return (await loadSitePage(slug, client)) as never;
}

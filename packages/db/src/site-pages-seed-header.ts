import type { PublicPageHeader } from './site-pages-schema';

/** Default hero image ships with the web and admin apps under /brand. */
export const DEFAULT_PUBLIC_PAGE_HEADER_IMAGE = '/brand/askalert-images-3.jpg';

export const SEED_PUBLIC_PAGE_HEADER: PublicPageHeader = {
  backgroundImageUrl: DEFAULT_PUBLIC_PAGE_HEADER_IMAGE,
  overlayOpacity: 72,
  minHeightPx: 280,
  brandLabel: 'AskAlert',
};

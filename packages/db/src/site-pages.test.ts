import { describe, expect, it } from 'vitest';
import {
  getSeedSitePage,
  parseContactPage,
  parseLegalPage,
  parsePublicPageHeader,
  SEED_CONTACT_PAGE,
  SEED_PRIVACY_PAGE,
  SEED_PUBLIC_PAGE_HEADER,
  SEED_TERMS_PAGE,
} from './site-pages';

describe('site pages seeds', () => {
  it('parses the shared header seed', () => {
    const header = parsePublicPageHeader(SEED_PUBLIC_PAGE_HEADER);
    expect(header.backgroundImageUrl).toContain('/brand/');
    expect(header.overlayOpacity).toBeGreaterThan(0);
  });

  it('parses privacy and terms seeds with sections', () => {
    const privacy = parseLegalPage(SEED_PRIVACY_PAGE);
    const terms = parseLegalPage(SEED_TERMS_PAGE);
    expect(privacy.sections.length).toBeGreaterThan(10);
    expect(terms.sections.some((section) => section.id === 'annex-vendor')).toBe(true);
    expect(privacy.title).toBe('Privacy Policy');
    expect(terms.title).toBe('Terms of Use');
  });

  it('parses the contact seed', () => {
    const contact = parseContactPage(SEED_CONTACT_PAGE);
    expect(contact.ctaLabel.length).toBeGreaterThan(0);
    expect(contact.paragraphs.length).toBeGreaterThan(0);
  });

  it('clones seeds so callers cannot mutate the catalogue', () => {
    const first = getSeedSitePage('privacy');
    first.title = 'mutated';
    expect(getSeedSitePage('privacy').title).toBe('Privacy Policy');
  });
});

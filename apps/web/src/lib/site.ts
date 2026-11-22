export const SITE_NAME = 'AskAlert';
export const SITE_TAGLINE = 'Ask. Alert. Delivered.';
export const SITE_DESCRIPTION =
  'Tell AskAlert what you need in Lagos. We ask verified vendors, compare offers, and bring you the best ones.';

/** Digits-only placeholder that must never ship in production. */
export const WHATSAPP_PLACEHOLDER = '2348000000000';

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const fallback = 'http://localhost:3000';
  const value = raw && raw.length > 0 ? raw : fallback;
  return value.replace(/\/$/, '');
}

export function getWhatsAppNumber(): string {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim();
  if (!raw) {
    return WHATSAPP_PLACEHOLDER;
  }
  return raw;
}

/** Digits only for https://wa.me/ links. */
export function getWhatsAppDigits(): string {
  return getWhatsAppNumber().replace(/\D/g, '');
}

export function isWhatsAppPlaceholder(digits = getWhatsAppDigits()): boolean {
  return digits.length === 0 || digits === WHATSAPP_PLACEHOLDER;
}

/**
 * Fail the production build when WhatsApp still uses the placeholder.
 * Safe to call from next.config during `next build`.
 */
export function assertProductionWhatsAppConfigured(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  if (isWhatsAppPlaceholder()) {
    throw new Error(
      `NEXT_PUBLIC_WHATSAPP_NUMBER is missing or still the placeholder (${WHATSAPP_PLACEHOLDER}). Set a real digits-only number before a production build.`,
    );
  }
}

/**
 * Fail the production build when the public site URL points at vercel.app.
 */
export function assertProductionSiteUrlConfigured(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  const siteUrl = getSiteUrl().toLowerCase();
  if (siteUrl.includes('vercel.app')) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be the public domain (e.g. https://www.askalert.com), not a vercel.app address. Got: ${getSiteUrl()}`,
    );
  }
  if (!/^https:\/\//i.test(siteUrl)) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be an https URL in production. Got: ${getSiteUrl()}`,
    );
  }
}

export function getWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${getWhatsAppDigits()}`;
  if (!message) {
    return base;
  }
  return `${base}?text=${encodeURIComponent(message)}`;
}

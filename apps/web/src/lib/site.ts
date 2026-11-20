export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

export function getWhatsAppNumber(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '2348000000000';
}

/** Digits only for https://wa.me/ links. */
export function getWhatsAppDigits(): string {
  return getWhatsAppNumber().replace(/\D/g, '');
}

export function getWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${getWhatsAppDigits()}`;
  if (!message) {
    return base;
  }
  return `${base}?text=${encodeURIComponent(message)}`;
}

export const SITE_NAME = 'AskAlert';
export const SITE_TAGLINE = 'Ask. Alert. Delivered.';
export const SITE_DESCRIPTION =
  'Tell AskAlert what you need in Lagos. We ask verified vendors, compare offers, and bring you the best ones.';

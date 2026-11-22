import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  WHATSAPP_PLACEHOLDER,
  assertProductionSiteUrlConfigured,
  assertProductionWhatsAppConfigured,
  getSiteUrl,
  getWhatsAppDigits,
  isWhatsAppPlaceholder,
} from './site';

describe('site helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('strips trailing slash from the site URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.askalert.com/');
    expect(getSiteUrl()).toBe('https://www.askalert.com');
  });

  it('treats the placeholder WhatsApp number as invalid', () => {
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', WHATSAPP_PLACEHOLDER);
    expect(getWhatsAppDigits()).toBe(WHATSAPP_PLACEHOLDER);
    expect(isWhatsAppPlaceholder()).toBe(true);
  });

  it('fails production builds on the WhatsApp placeholder', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', WHATSAPP_PLACEHOLDER);
    expect(() => assertProductionWhatsAppConfigured()).toThrow(/placeholder/i);
  });

  it('fails production builds when the site URL is vercel.app', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://askalert-web.vercel.app');
    expect(() => assertProductionSiteUrlConfigured()).toThrow(/vercel\.app/i);
  });

  it('allows a real production WhatsApp number and public domain', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.askalert.com');
    vi.stubEnv('NEXT_PUBLIC_WHATSAPP_NUMBER', '2348012345678');
    expect(() => assertProductionSiteUrlConfigured()).not.toThrow();
    expect(() => assertProductionWhatsAppConfigured()).not.toThrow();
    expect(isWhatsAppPlaceholder()).toBe(false);
  });
});

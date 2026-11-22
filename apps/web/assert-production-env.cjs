/**
 * Fail production builds that would ship vercel.app metadata or the WhatsApp placeholder.
 * Loaded from next.config after env files are applied.
 */
function assertProductionEnv() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');
  if (!siteUrl || /vercel\.app/i.test(siteUrl) || !/^https:\/\//i.test(siteUrl)) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be an https public domain (e.g. https://www.askalert.com), not missing or vercel.app. Got: ${siteUrl || '(empty)'}`,
    );
  }

  const digits = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');
  if (!digits || digits === '2348000000000') {
    throw new Error(
      'NEXT_PUBLIC_WHATSAPP_NUMBER is missing or still the placeholder (2348000000000). Set a real digits-only number before a production build.',
    );
  }
}

module.exports = { assertProductionEnv };

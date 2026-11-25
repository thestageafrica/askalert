/**
 * Sends one branded auth-style test email via Resend.
 * Target must NOT be a Supabase org team inbox when validating hook delivery outside built-in SMTP.
 *
 * Usage (from repo root, with secrets in env — never commit them):
 *   RESEND_API_KEY=re_xxx EMAIL_FROM="AskAlert <auth@askalert.com>" TEST_EMAIL=you@example.com pnpm --filter @askalert/emails send-test
 */
import { ResendEmailProvider } from './providers/resend';
import { renderAuthEmails } from './render';

const apiKey = process.env.RESEND_API_KEY ?? '';
const from = process.env.EMAIL_FROM ?? 'AskAlert <onboarding@resend.dev>';
const to = process.env.TEST_EMAIL ?? '';
const logoUrl =
  process.env.NEXT_PUBLIC_EMAIL_LOGO_URL ??
  process.env.EMAIL_LOGO_URL ??
  'https://www.askalert.com/brand/askalert-logo-email.png';
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://krrvatcjgytdbsiyvqyh.supabase.co';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.askalert.com';

if (!apiKey) {
  console.error(JSON.stringify({ ok: false, errorCode: 'missing_resend_api_key' }));
  process.exit(1);
}
if (!to || !to.includes('@')) {
  console.error(JSON.stringify({ ok: false, errorCode: 'missing_test_email' }));
  process.exit(1);
}

const [mail] = renderAuthEmails(
  {
    user: { id: '00000000-0000-4000-8000-000000000001', email: to },
    email_data: {
      token: '000000',
      token_hash: `test_${Date.now()}`,
      redirect_to: `${siteUrl.replace(/\/$/, '')}/auth/callback/`,
      email_action_type: 'magiclink',
      site_url: siteUrl,
      token_new: '',
      token_hash_new: '',
      old_email: '',
    },
  },
  { supabaseUrl, siteUrl, logoUrl },
);

if (!mail) {
  console.error(JSON.stringify({ ok: false, errorCode: 'render_failed' }));
  process.exit(1);
}

const provider = new ResendEmailProvider(apiKey, from);
const result = await provider.send({
  to: mail.to,
  subject: `[AskAlert test] ${mail.subject}`,
  html: mail.html,
  text: mail.text,
  idempotencyKey: mail.idempotencyKey,
});

if (!result.ok) {
  console.error(JSON.stringify({ ok: false, errorCode: result.errorCode, provider: result.provider }));
  process.exit(1);
}

console.log(
  JSON.stringify({
    ok: true,
    provider: result.provider,
    providerId: result.providerId,
    action: mail.action,
  }),
);

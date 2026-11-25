/**
 * Supabase Auth "Send Email" Hook.
 *
 * Verifies standardwebhooks signatures, renders branded templates from
 * packages/emails, and sends via Resend (HTTP) with optional Brevo HTTP fallback.
 * Do not use SMTP from this function.
 *
 * Secrets (supabase secrets set):
 *   SEND_EMAIL_HOOK_SECRET, RESEND_API_KEY, EMAIL_FROM
 * Optional: BREVO_API_KEY, EMAIL_LOGO_URL, EMAIL_SITE_URL, EMAIL_FALLBACK=brevo|none
 *
 * Deploy: supabase functions deploy send-auth-email --no-verify-jwt
 */
import {
  BrevoEmailProvider,
  FallbackEmailProvider,
  mapActionToTemplate,
  renderAuthEmails,
  ResendEmailProvider,
  verifySendEmailHook,
} from '../_shared/auth-email/mod.ts';

const STARTED = Date.now();

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function logCount(event: string, fields: Record<string, string | number | boolean>) {
  // Never log emails, tokens, or raw payloads.
  console.log(JSON.stringify({ event, ...fields, ms: Date.now() - STARTED }));
}

function headerMap(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function parseFromAddress(from: string): { email: string; name: string } {
  const match = from.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1]!.trim().replaceAll('"', ''), email: match[2]!.trim() };
  }
  return { name: 'AskAlert', email: from };
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return json({ error: { message: 'method_not_allowed' } }, 405);
  }

  const rawBody = await request.text();
  const secret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? '';
  const verified = verifySendEmailHook({
    secret,
    rawBody,
    headers: headerMap(request.headers),
  });

  if (!verified.ok) {
    logCount('auth_email_hook_reject', { errorCode: verified.errorCode });
    return json({ error: { http_code: 401, message: verified.errorCode } }, 401);
  }

  const action = mapActionToTemplate(verified.payload.email_data.email_action_type);
  if (!action) {
    logCount('auth_email_hook_reject', { errorCode: 'unknown_action' });
    return json({ error: { http_code: 400, message: 'unknown_action' } }, 400);
  }

  const supabaseUrl = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/$/, '');
  const siteUrl = (Deno.env.get('EMAIL_SITE_URL') ?? Deno.env.get('SITE_URL') ?? 'https://www.askalert.com').replace(
    /\/$/,
    '',
  );
  const logoUrl =
    Deno.env.get('EMAIL_LOGO_URL') ??
    Deno.env.get('NEXT_PUBLIC_EMAIL_LOGO_URL') ??
    `${siteUrl}/brand/askalert-logo-email.png`;
  const from = Deno.env.get('EMAIL_FROM') ?? 'AskAlert <auth@askalert.com>';
  const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';
  const brevoKey = Deno.env.get('BREVO_API_KEY') ?? '';
  const fallbackMode = (Deno.env.get('EMAIL_FALLBACK') ?? 'brevo').toLowerCase();

  const mails = renderAuthEmails(verified.payload, {
    supabaseUrl,
    siteUrl,
    logoUrl,
  });

  const providers = [new ResendEmailProvider(resendKey, from)];
  if (fallbackMode === 'brevo' && brevoKey) {
    const parsed = parseFromAddress(from);
    providers.push(new BrevoEmailProvider(brevoKey, parsed.email, parsed.name));
  }

  const mailer = new FallbackEmailProvider(providers, (info) => {
    logCount('auth_email_provider_attempt', {
      provider: info.provider,
      ok: info.ok,
      errorCode: info.errorCode ?? '',
      action,
    });
  });

  let sent = 0;
  for (const mail of mails) {
    const result = await mailer.send({
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      idempotencyKey: mail.idempotencyKey,
    });
    if (!result.ok) {
      logCount('auth_email_send_failed', {
        action,
        errorCode: result.errorCode,
        provider: result.provider,
        sent,
      });
      return json(
        {
          error: {
            http_code: 500,
            message: result.errorCode,
          },
        },
        500,
      );
    }
    sent += 1;
    logCount('auth_email_sent', {
      action,
      provider: result.provider,
      sent,
    });
  }

  // Empty 200 marks success for the Auth hook.
  return json({});
});

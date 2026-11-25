import { buildConfirmationUrl } from './confirmation-url';
import { renderAuthEmailHtml, renderAuthEmailText } from './layout';
import type { AuthEmailHookPayload, RenderedEmail } from './types';

export type RenderOptions = {
  supabaseUrl: string;
  siteUrl: string;
  logoUrl: string;
  /** When secure email change sends to the current address. */
  variant?: 'default' | 'email_change_current' | 'email_change_new';
};

function siteFromPayload(payload: AuthEmailHookPayload, fallback: string): string {
  const fallbackClean = fallback.replace(/\/$/, '') || 'https://www.askalert.com';
  // Prefer real public hosts. Ignore localhost redirect_to from local testing.
  for (const raw of [payload.email_data.site_url, payload.email_data.redirect_to, fallbackClean]) {
    if (!raw) {
      continue;
    }
    try {
      const url = new URL(raw);
      const host = url.host.toLowerCase();
      if (host === 'localhost' || host.startsWith('127.') || host.endsWith('.local')) {
        continue;
      }
      return `${url.protocol}//${url.host}`;
    } catch {
      continue;
    }
  }
  return fallbackClean;
}

export function renderAuthEmails(
  payload: AuthEmailHookPayload,
  options: RenderOptions,
): RenderedEmail[] {
  const siteUrl = siteFromPayload(payload, options.siteUrl);
  const logoUrl = options.logoUrl;
  const action = payload.email_data.email_action_type;
  const shared = { logoUrl, siteUrl };

  if (action === 'reauthentication') {
    return [
      {
        action,
        to: payload.user.email,
        subject: 'Your AskAlert verification code',
        idempotencyKey: `reauthentication:${payload.email_data.token_hash || payload.email_data.token}`,
        ...buildBodies({
          ...shared,
          preheader: 'Your AskAlert verification code',
          headline: 'Your verification code',
          intro: 'Use this code to verify it is you. It expires shortly.',
          code: payload.email_data.token,
          footerNote: 'If you did not request this, you can ignore this email.',
        }),
      },
    ];
  }

  if (action === 'email_change') {
    return renderEmailChange(payload, options, siteUrl, logoUrl);
  }

  const confirmationUrl = buildConfirmationUrl(options.supabaseUrl, payload.email_data, {
    siteUrl,
  });
  const copy = copyForAction(action, payload.user.email);

  return [
    {
      action,
      to: payload.user.email,
      subject: copy.subject,
      idempotencyKey: `${action}:${payload.email_data.token_hash}`,
      ...buildBodies({
        ...shared,
        preheader: copy.preheader,
        headline: copy.headline,
        intro: copy.intro,
        ctaLabel: copy.ctaLabel,
        ctaUrl: confirmationUrl,
        footerNote: copy.footerNote,
      }),
    },
  ];
}

function renderEmailChange(
  payload: AuthEmailHookPayload,
  options: RenderOptions,
  siteUrl: string,
  logoUrl: string,
): RenderedEmail[] {
  const data = payload.email_data;
  const newEmail = payload.user.new_email;
  const hasSecurePair = Boolean(data.token_hash && data.token_hash_new && newEmail);

  if (!hasSecurePair) {
    const hash = data.token_hash || data.token_hash_new;
    const to = newEmail || payload.user.email;
    const confirmationUrl = buildConfirmationUrl(options.supabaseUrl, data, {
      tokenHash: hash,
      siteUrl,
    });
    return [
      {
        action: 'email_change',
        to,
        subject: 'Confirm your new AskAlert email',
        idempotencyKey: `email_change:${hash}`,
        ...buildBodies({
          logoUrl,
          siteUrl,
          preheader: 'Confirm your new AskAlert email',
          headline: 'Confirm your new email',
          intro: `Confirm ${to} as your AskAlert email.`,
          ctaLabel: 'Confirm new email',
          ctaUrl: confirmationUrl,
          footerNote: 'If you did not request this change, ignore this email.',
        }),
      },
    ];
  }

  // Secure Email Change: token_hash_new + token → current email; token_hash + token_new → new email.
  const currentUrl = buildConfirmationUrl(options.supabaseUrl, data, {
    tokenHash: data.token_hash_new,
    siteUrl,
  });
  const newUrl = buildConfirmationUrl(options.supabaseUrl, data, {
    tokenHash: data.token_hash,
    siteUrl,
  });

  return [
    {
      action: 'email_change',
      to: payload.user.email,
      subject: 'Confirm an AskAlert email change',
      idempotencyKey: `email_change_current:${data.token_hash_new}`,
      ...buildBodies({
        logoUrl,
        siteUrl,
        preheader: 'Confirm an email change on your AskAlert account',
        headline: 'Confirm email change',
        intro: `Someone asked to change the email on this AskAlert account to ${newEmail}. Confirm if that was you.`,
        ctaLabel: 'Confirm change',
        ctaUrl: currentUrl,
        footerNote: 'If you did not request this, ignore this email — your account stays on this address.',
      }),
    },
    {
      action: 'email_change',
      to: newEmail!,
      subject: 'Confirm your new AskAlert email',
      idempotencyKey: `email_change_new:${data.token_hash}`,
      ...buildBodies({
        logoUrl,
        siteUrl,
        preheader: 'Confirm your new AskAlert email',
        headline: 'Confirm your new email',
        intro: `Confirm ${newEmail} as your new AskAlert email.`,
        ctaLabel: 'Confirm new email',
        ctaUrl: newUrl,
        footerNote: 'If you did not request this change, ignore this email.',
      }),
    },
  ];
}

function buildBodies(input: Parameters<typeof renderAuthEmailHtml>[0]): {
  html: string;
  text: string;
} {
  return {
    html: renderAuthEmailHtml(input),
    text: renderAuthEmailText(input),
  };
}

function copyForAction(action: AuthEmailHookPayload['email_data']['email_action_type'], email: string) {
  switch (action) {
    case 'signup':
      return {
        subject: 'Confirm your AskAlert account',
        preheader: 'Confirm your AskAlert email to finish signup',
        headline: 'Confirm your email',
        intro: `Welcome to AskAlert. Tap below to activate your account for ${email}.`,
        ctaLabel: 'Confirm email',
        footerNote: 'This link expires for your safety. If you did not create an account, ignore this email.',
      };
    case 'magiclink':
      return {
        subject: 'Your AskAlert sign-in link',
        preheader: 'Your one-time AskAlert sign-in link',
        headline: 'Sign in to AskAlert',
        intro: `Use this secure link to finish signing in as ${email}. Open it on this device.`,
        ctaLabel: 'Continue signing in',
        footerNote: 'This link expires soon and works once. If you did not ask to sign in, ignore this email.',
      };
    case 'recovery':
      return {
        subject: 'Reset your AskAlert password',
        preheader: 'Reset your AskAlert password',
        headline: 'Reset your password',
        intro: `We received a password reset request for ${email}. Tap below to choose a new password.`,
        ctaLabel: 'Choose a new password',
        footerNote: 'If you did not ask to reset your password, ignore this email — your account stays safe.',
      };
    case 'invite':
      return {
        subject: 'You are invited to AskAlert',
        preheader: 'Accept your AskAlert invitation',
        headline: 'You are invited',
        intro: 'You have been invited to create an AskAlert account. Tap below to accept.',
        ctaLabel: 'Accept invitation',
        footerNote: 'This invitation link expires for your safety.',
      };
    default:
      return {
        subject: 'AskAlert notification',
        preheader: 'AskAlert notification',
        headline: 'AskAlert',
        intro: 'Open the link below to continue.',
        ctaLabel: 'Continue',
        footerNote: 'If you did not expect this email, you can ignore it.',
      };
  }
}

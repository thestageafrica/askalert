import type { AuthEmailHookPayload } from './types.ts';

export const PUBLIC_SITE_URL = 'https://www.askalert.com';

/**
 * Only www.askalert.com (or askalert.com) may be used in email redirect_to.
 * Auth payloads often send localhost or the *.supabase.co API host — never use those.
 */
export function publicSiteUrl(candidate?: string): string {
  const raw = (candidate || '').trim();
  if (raw) {
    try {
      const url = new URL(raw);
      const host = url.host.toLowerCase();
      if (host === 'www.askalert.com' || host === 'askalert.com') {
        return 'https://www.askalert.com';
      }
    } catch {
      // fall through
    }
  }
  return PUBLIC_SITE_URL;
}

/**
 * Always send users to a real auth page on askalert.com.
 */
export function resolveAuthRedirectTo(
  emailData: AuthEmailHookPayload['email_data'],
  siteUrl?: string,
): string {
  const base = publicSiteUrl(siteUrl);
  const action = emailData.email_action_type;

  if (action === 'recovery') {
    return `${base}/auth/reset-password/`;
  }

  if (action === 'signup' || action === 'magiclink' || action === 'invite') {
    return `${base}/auth/callback/`;
  }

  const fromAuth = (emailData.redirect_to || '').trim();
  try {
    if (fromAuth) {
      const url = new URL(fromAuth);
      const host = url.host.toLowerCase();
      if (
        (host === 'www.askalert.com' || host === 'askalert.com') &&
        url.pathname.includes('/auth/')
      ) {
        return `${url.origin}${url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`}`;
      }
    }
  } catch {
    // fall through
  }

  return `${base}/auth/callback/`;
}

/**
 * Build the Supabase Auth verify URL for link-based emails.
 * Uses token_hash (not the short OTP) as required by /auth/v1/verify.
 */
export function buildConfirmationUrl(
  supabaseUrl: string,
  emailData: AuthEmailHookPayload['email_data'],
  options?: { tokenHash?: string; siteUrl?: string },
): string {
  const base = supabaseUrl.replace(/\/$/, '');
  const tokenHash = options?.tokenHash ?? emailData.token_hash;
  const params = new URLSearchParams({
    token: tokenHash,
    type: emailData.email_action_type,
    redirect_to: resolveAuthRedirectTo(emailData, options?.siteUrl),
  });
  return `${base}/auth/v1/verify?${params.toString()}`;
}

export function mapActionToTemplate(
  action: string,
): AuthEmailHookPayload['email_data']['email_action_type'] | null {
  switch (action) {
    case 'signup':
    case 'magiclink':
    case 'recovery':
    case 'invite':
    case 'email_change':
    case 'reauthentication':
      return action;
    default:
      return null;
  }
}

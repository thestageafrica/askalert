import type { AuthEmailHookPayload } from './types';

/**
 * Always send users to a real auth page. Auth often falls back to bare Site URL
 * (`https://www.askalert.com`), which opens the homepage instead of reset/callback.
 */
export function resolveAuthRedirectTo(
  emailData: AuthEmailHookPayload['email_data'],
  siteUrl: string,
): string {
  const base = siteUrl.replace(/\/$/, '') || 'https://www.askalert.com';
  const action = emailData.email_action_type;

  if (action === 'recovery') {
    return `${base}/auth/reset-password/`;
  }

  if (action === 'signup' || action === 'magiclink' || action === 'invite') {
    return `${base}/auth/callback/`;
  }

  const fromAuth = (emailData.redirect_to || '').trim();
  if (fromAuth.includes('/auth/')) {
    return fromAuth;
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
  const siteUrl = options?.siteUrl || emailData.site_url || 'https://www.askalert.com';
  const params = new URLSearchParams({
    token: tokenHash,
    type: emailData.email_action_type,
    redirect_to: resolveAuthRedirectTo(emailData, siteUrl),
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

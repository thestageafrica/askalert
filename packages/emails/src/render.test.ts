import { describe, expect, it } from 'vitest';
import { renderAuthEmails } from './render';
import type { AuthEmailHookPayload } from './types';

const basePayload = (action: AuthEmailHookPayload['email_data']['email_action_type']): AuthEmailHookPayload => ({
  user: { id: '11111111-1111-4111-8111-111111111111', email: 'buyer@example.com' },
  email_data: {
    token: '305805',
    token_hash: 'hash_main',
    redirect_to: 'https://www.askalert.com/auth/callback/',
    email_action_type: action,
    site_url: 'https://www.askalert.com',
    token_new: '',
    token_hash_new: '',
    old_email: '',
  },
});

const options = {
  supabaseUrl: 'https://krrvatcjgytdbsiyvqyh.supabase.co',
  siteUrl: 'https://www.askalert.com',
  logoUrl: 'https://www.askalert.com/brand/askalert-logo-email.png',
};

describe('renderAuthEmails', () => {
  it('renders signup with html, text, and idempotency key', () => {
    const [mail] = renderAuthEmails(basePayload('signup'), options);
    expect(mail?.subject).toMatch(/Confirm/i);
    expect(mail?.html).toContain('AskAlert');
    expect(mail?.html).toContain('Confirm email');
    expect(mail?.text).toContain('Confirm your email');
    expect(mail?.idempotencyKey).toBe('signup:hash_main');
    expect(mail?.html).not.toContain('{{');
  });

  it('renders reauthentication with OTP code and no CTA url requirement', () => {
    const [mail] = renderAuthEmails(basePayload('reauthentication'), options);
    expect(mail?.html).toContain('305805');
    expect(mail?.text).toContain('Code: 305805');
  });

  it('renders two emails for secure email_change', () => {
    const payload = basePayload('email_change');
    payload.user.new_email = 'new@example.com';
    payload.email_data.token_hash_new = 'hash_current';
    payload.email_data.token_new = '654321';

    const mails = renderAuthEmails(payload, options);
    expect(mails).toHaveLength(2);
    expect(mails[0]?.to).toBe('buyer@example.com');
    expect(mails[1]?.to).toBe('new@example.com');
    expect(mails[0]?.idempotencyKey).toContain('email_change_current');
    expect(mails[1]?.idempotencyKey).toContain('email_change_new');
  });
});

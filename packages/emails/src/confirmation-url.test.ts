import { describe, expect, it } from 'vitest';
import {
  buildConfirmationUrl,
  mapActionToTemplate,
  resolveAuthRedirectTo,
} from './confirmation-url';

const baseData = {
  token: '123456',
  token_hash: 'abc_hash',
  redirect_to: 'https://www.askalert.com',
  email_action_type: 'signup' as const,
  site_url: 'https://www.askalert.com',
  token_new: '',
  token_hash_new: '',
  old_email: '',
};

describe('mapActionToTemplate', () => {
  it('maps known auth actions', () => {
    expect(mapActionToTemplate('signup')).toBe('signup');
    expect(mapActionToTemplate('magiclink')).toBe('magiclink');
    expect(mapActionToTemplate('recovery')).toBe('recovery');
    expect(mapActionToTemplate('invite')).toBe('invite');
    expect(mapActionToTemplate('email_change')).toBe('email_change');
    expect(mapActionToTemplate('reauthentication')).toBe('reauthentication');
  });

  it('rejects unknown actions', () => {
    expect(mapActionToTemplate('password')).toBeNull();
    expect(mapActionToTemplate('')).toBeNull();
  });
});

describe('resolveAuthRedirectTo', () => {
  it('forces recovery links to the reset-password page', () => {
    expect(
      resolveAuthRedirectTo(
        { ...baseData, email_action_type: 'recovery', redirect_to: 'https://www.askalert.com' },
        'https://www.askalert.com',
      ),
    ).toBe('https://www.askalert.com/auth/reset-password/');
  });

  it('forces signup/magiclink to the callback page', () => {
    expect(resolveAuthRedirectTo(baseData, 'https://www.askalert.com')).toBe(
      'https://www.askalert.com/auth/callback/',
    );
  });
});

describe('buildConfirmationUrl', () => {
  it('builds a verify URL with token_hash and type', () => {
    const url = buildConfirmationUrl('https://krrvatcjgytdbsiyvqyh.supabase.co', baseData, {
      siteUrl: 'https://www.askalert.com',
    });

    expect(url).toContain('https://krrvatcjgytdbsiyvqyh.supabase.co/auth/v1/verify?');
    expect(url).toContain('token=abc_hash');
    expect(url).toContain('type=signup');
    expect(url).toContain('redirect_to=https%3A%2F%2Fwww.askalert.com%2Fauth%2Fcallback%2F');
  });

  it('does not keep bare site URL for recovery', () => {
    const url = buildConfirmationUrl(
      'https://krrvatcjgytdbsiyvqyh.supabase.co',
      {
        ...baseData,
        email_action_type: 'recovery',
        redirect_to: 'http://localhost:3000',
      },
      { siteUrl: 'https://www.askalert.com' },
    );

    expect(url).toContain('type=recovery');
    expect(url).toContain(
      'redirect_to=https%3A%2F%2Fwww.askalert.com%2Fauth%2Freset-password%2F',
    );
    expect(url).not.toContain('localhost');
  });
});

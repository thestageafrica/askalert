import { describe, expect, it } from 'vitest';
import {
  buildConfirmationUrl,
  mapActionToTemplate,
  publicSiteUrl,
  resolveAuthRedirectTo,
} from './confirmation-url';

const baseData = {
  token: '123456',
  token_hash: 'abc_hash',
  redirect_to: 'https://krrvatcjgytdbsiyvqyh.supabase.co',
  email_action_type: 'signup' as const,
  site_url: 'https://krrvatcjgytdbsiyvqyh.supabase.co',
  token_new: '',
  token_hash_new: '',
  old_email: '',
};

describe('mapActionToTemplate', () => {
  it('maps known auth actions', () => {
    expect(mapActionToTemplate('signup')).toBe('signup');
    expect(mapActionToTemplate('recovery')).toBe('recovery');
  });

  it('rejects unknown actions', () => {
    expect(mapActionToTemplate('password')).toBeNull();
  });
});

describe('publicSiteUrl', () => {
  it('accepts askalert hosts and rejects supabase/localhost', () => {
    expect(publicSiteUrl('https://www.askalert.com')).toBe('https://www.askalert.com');
    expect(publicSiteUrl('https://askalert.com/path')).toBe('https://www.askalert.com');
    expect(publicSiteUrl('https://krrvatcjgytdbsiyvqyh.supabase.co')).toBe(
      'https://www.askalert.com',
    );
    expect(publicSiteUrl('http://localhost:3000')).toBe('https://www.askalert.com');
  });
});

describe('resolveAuthRedirectTo', () => {
  it('forces recovery to askalert reset-password even when Auth sends supabase host', () => {
    expect(
      resolveAuthRedirectTo(
        { ...baseData, email_action_type: 'recovery' },
        'https://krrvatcjgytdbsiyvqyh.supabase.co',
      ),
    ).toBe('https://www.askalert.com/auth/reset-password/');
  });

  it('forces signup to askalert callback', () => {
    expect(resolveAuthRedirectTo(baseData, 'https://www.askalert.com')).toBe(
      'https://www.askalert.com/auth/callback/',
    );
  });
});

describe('buildConfirmationUrl', () => {
  it('never puts supabase.co in redirect_to', () => {
    const url = buildConfirmationUrl(
      'https://krrvatcjgytdbsiyvqyh.supabase.co',
      { ...baseData, email_action_type: 'recovery' },
      { siteUrl: 'https://www.askalert.com' },
    );

    expect(url).toContain('type=recovery');
    expect(url).toContain(
      'redirect_to=https%3A%2F%2Fwww.askalert.com%2Fauth%2Freset-password%2F',
    );
    expect(url).not.toMatch(/redirect_to=https%3A%2F%2Fkrrvatcjgytdbsiyvqyh/);
  });
});

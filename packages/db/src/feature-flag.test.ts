import { describe, expect, it } from 'vitest';
import { isSupabaseEnabled, requireSupabaseEnv } from './feature-flag';

describe('isSupabaseEnabled', () => {
  it('defaults to false without flag', () => {
    expect(isSupabaseEnabled({})).toBe(false);
  });

  it('requires url and anon key when flag is true', () => {
    expect(isSupabaseEnabled({ USE_SUPABASE: 'true' })).toBe(false);
    expect(
      isSupabaseEnabled({
        USE_SUPABASE: 'true',
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      }),
    ).toBe(true);
  });
});

describe('requireSupabaseEnv', () => {
  it('throws when keys are missing', () => {
    expect(() => requireSupabaseEnv({})).toThrow(/missing/i);
  });

  it('returns url and keys', () => {
    expect(
      requireSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
        SUPABASE_SERVICE_ROLE_KEY: 'service',
      }),
    ).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon',
      serviceRoleKey: 'service',
    });
  });
});

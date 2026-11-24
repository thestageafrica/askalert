import { describe, expect, it } from 'vitest';
import { tryCreateBrowserClient } from './client';

describe('tryCreateBrowserClient', () => {
  it('returns null when flag/env incomplete', () => {
    expect(tryCreateBrowserClient({})).toBeNull();
    expect(tryCreateBrowserClient({ NEXT_PUBLIC_USE_SUPABASE: 'true' })).toBeNull();
  });
});

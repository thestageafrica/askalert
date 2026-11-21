import { describe, expect, it, vi } from 'vitest';
import { resolveCategoryId } from './categories';
import type { AskAlertSupabase } from './client';

describe('resolveCategoryId', () => {
  it('looks up by uuid when the value is a uuid', async () => {
    const maybeSingle = vi.fn(async () => ({
      data: { id: '22222222-2222-4222-8222-222222222206' },
      error: null,
    }));
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    const client = { from } as unknown as AskAlertSupabase;

    const id = await resolveCategoryId(client, '22222222-2222-4222-8222-222222222206');
    expect(id).toBe('22222222-2222-4222-8222-222222222206');
    expect(eq).toHaveBeenCalledWith('id', '22222222-2222-4222-8222-222222222206');
  });

  it('looks up by slug when the value is not a uuid', async () => {
    const maybeSingle = vi.fn(async () => ({
      data: { id: '22222222-2222-4222-8222-222222222206' },
      error: null,
    }));
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    const client = { from } as unknown as AskAlertSupabase;

    const id = await resolveCategoryId(client, 'auto-services');
    expect(id).toBe('22222222-2222-4222-8222-222222222206');
    expect(eq).toHaveBeenCalledWith('slug', 'auto-services');
  });
});

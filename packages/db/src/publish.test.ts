import { describe, expect, it, vi } from 'vitest';
import { findSeedCategoryBySlug } from '@askalert/category-engine';
import { publishCategoryVersion } from './categories';
import type { AskAlertSupabase } from './client';

type QueryResult = { data: unknown; error: { message: string } | null };

function createMockClient(handlers: {
  versionsSelect?: () => QueryResult;
  versionsInsert?: () => QueryResult;
  attributesInsert?: () => QueryResult;
  requirementsInsert?: () => QueryResult;
  categoriesUpdate?: () => QueryResult;
}): AskAlertSupabase {
  const from = vi.fn((table: string) => {
    if (table === 'category_versions') {
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => handlers.versionsSelect?.() ?? { data: [], error: null },
            }),
          }),
        }),
        insert: () => ({
          select: () => ({
            single: async () =>
              handlers.versionsInsert?.() ?? {
                data: { id: 'ver-1', version_number: 1 },
                error: null,
              },
          }),
        }),
      };
    }
    if (table === 'category_attributes') {
      return {
        insert: async () => handlers.attributesInsert?.() ?? { data: null, error: null },
      };
    }
    if (table === 'vendor_requirements') {
      return {
        insert: async () => handlers.requirementsInsert?.() ?? { data: null, error: null },
      };
    }
    if (table === 'categories') {
      return {
        update: () => ({
          eq: async () => handlers.categoriesUpdate?.() ?? { data: null, error: null },
        }),
      };
    }
    throw new Error(`Unexpected table ${table}`);
  });

  return { from } as unknown as AskAlertSupabase;
}

describe('publishCategoryVersion', () => {
  it('rejects invalid configs before writing', async () => {
    const events = findSeedCategoryBySlug('events');
    if (!events) {
      throw new Error('events seed missing');
    }

    const client = createMockClient({});
    const result = await publishCategoryVersion(client, {
      categoryId: 'cat-1',
      config: { ...events, vendor_requirements: [] },
      note: 'bad',
      nextStatus: 'live',
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('publishes a valid config to live', async () => {
    const events = findSeedCategoryBySlug('events');
    if (!events) {
      throw new Error('events seed missing');
    }

    const client = createMockClient({
      versionsSelect: () => ({ data: [{ version_number: 2 }], error: null }),
      versionsInsert: () => ({
        data: { id: 'ver-3', version_number: 3 },
        error: null,
      }),
    });

    const result = await publishCategoryVersion(client, {
      categoryId: 'cat-1',
      config: events,
      note: 'Go live',
      nextStatus: 'live',
      actor: 'ops@askalert.com',
    });

    expect(result).toEqual({
      ok: true,
      versionId: 'ver-3',
      versionNumber: 3,
    });
  });
});

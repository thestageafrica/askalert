import { describe, expect, it } from 'vitest';
import { AREA_CATALOGUE } from './areas-catalogue';
import { mergeAreaCatalogues, normalizeRemoteAreas } from './areas-normalize';

describe('areas normalize', () => {
  it('keeps seed locations when merging empty local', () => {
    const merged = mergeAreaCatalogues([]);
    expect(merged.some((node) => node.slug === 'lagos-all')).toBe(true);
    expect(merged.some((node) => node.slug === 'lekki')).toBe(true);
  });

  it('preserves admin-added locations over seed', () => {
    const custom = {
      id: 'custom',
      slug: 'festac',
      name: 'Festac',
      parentId: AREA_CATALOGUE.find((node) => node.slug === 'lagos')!.id,
      sortOrder: 20,
    };
    const merged = mergeAreaCatalogues([custom]);
    expect(merged.find((node) => node.slug === 'festac')?.name).toBe('Festac');
    expect(merged.some((node) => node.slug === 'ikorodu')).toBe(true);
  });

  it('flattens Eti-Osa middle layer under Lagos', () => {
    const lagosId = '11111111-1111-4111-8111-111111111101';
    const etiId = '11111111-1111-4111-8111-111111111102';
    const normalized = normalizeRemoteAreas([
      { id: lagosId, slug: 'lagos', name: 'Lagos', parent_id: null, sort_order: 1 },
      { id: etiId, slug: 'eti-osa', name: 'Eti-Osa', parent_id: lagosId, sort_order: 1 },
      {
        id: '11111111-1111-4111-8111-111111111103',
        slug: 'lekki-phase-1',
        name: 'Lekki Phase 1',
        parent_id: etiId,
        sort_order: 1,
      },
    ]);
    const leaf = normalized.find((node) => node.slug === 'lekki-phase-1');
    expect(leaf?.parentId).toBe(lagosId);
    expect(normalized.some((node) => node.slug === 'eti-osa')).toBe(false);
  });
});

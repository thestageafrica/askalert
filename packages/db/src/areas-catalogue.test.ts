import { describe, expect, it } from 'vitest';
import {
  AREA_CATALOGUE,
  areaSlugsFromRows,
  canAddCoverageRow,
  isStatewideLocation,
  listSeedLocationsForState,
  listSeedStates,
  rowsFromAreaSlugs,
} from './areas-catalogue';

describe('areas catalogue', () => {
  it('seeds only Lagos as a state for now', () => {
    expect(listSeedStates().map((state) => state.slug)).toEqual(['lagos']);
  });

  it('lists All of Lagos first under Lagos', () => {
    const locations = listSeedLocationsForState('lagos');
    expect(locations[0]?.slug).toBe('lagos-all');
    expect(locations[0]?.statewide).toBe(true);
    expect(locations.some((loc) => loc.slug === 'ikorodu')).toBe(true);
  });

  it('detects statewide locations', () => {
    expect(isStatewideLocation('lagos-all')).toBe(true);
    expect(isStatewideLocation('lekki')).toBe(false);
  });

  it('round-trips area slugs and coverage rows', () => {
    const rows = rowsFromAreaSlugs(['lekki-phase-1', 'ikorodu']);
    expect(rows).toEqual([
      { stateSlug: 'lagos', locationSlug: 'lekki-phase-1' },
      { stateSlug: 'lagos', locationSlug: 'ikorodu' },
    ]);
    expect(areaSlugsFromRows(rows)).toEqual(['lekki-phase-1', 'ikorodu']);
  });

  it('blocks another Lagos row when All of Lagos is selected', () => {
    expect(
      canAddCoverageRow({
        existingLocationSlugs: ['lagos-all'],
        stateSlug: 'lagos',
      }),
    ).toBe(false);
    expect(
      canAddCoverageRow({
        existingLocationSlugs: ['lekki'],
        stateSlug: 'lagos',
      }),
    ).toBe(true);
  });

  it('keeps catalogue ids stable for seed SQL', () => {
    expect(AREA_CATALOGUE.find((node) => node.slug === 'lagos')?.id).toMatch(/^11111111/);
  });
});

import { describe, expect, it } from 'vitest';
import {
  applyStatewideChoice,
  coversLocation,
  createEmptyCoverageRow,
  geoNodesFromCsv,
  geoNodesToCsv,
  isDuplicateLocation,
  listGeoSeedNodes,
  listLocationsForState,
  listStates,
  loadNigeriaGeoSeed,
  matchGeoAlias,
  mergeGeoNodes,
  validateCoverageRows,
} from './index';

describe('@askalert/geo', () => {
  const nodes = listGeoSeedNodes();

  it('seeds Nigeria, Lagos, FCT with statewide nodes', () => {
    const seed = loadNigeriaGeoSeed();
    expect(seed.nodes.some((node) => node.slug === 'nigeria')).toBe(true);
    expect(listStates(nodes).map((node) => node.slug)).toEqual(['lagos', 'fct']);
    expect(nodes.some((node) => node.slug === 'lagos-all' && node.isStatewide)).toBe(true);
    expect(nodes.some((node) => node.slug === 'fct-all' && node.isStatewide)).toBe(true);
    expect(nodes.some((node) => node.slug === 'lekki-phase-1')).toBe(true);
    expect(nodes.some((node) => node.slug === 'maitama')).toBe(true);
  });

  it('covers same node, ancestor, and statewide', () => {
    expect(coversLocation('lekki-phase-1', 'lekki-phase-1', nodes)).toBe(true);
    expect(coversLocation('lekki', 'lekki-phase-1', nodes)).toBe(true);
    expect(coversLocation('lagos-all', 'lekki-phase-1', nodes)).toBe(true);
    expect(coversLocation('lekki-phase-1', 'ikoyi', nodes)).toBe(false);
    expect(coversLocation('ikoyi', 'lekki-phase-1', nodes)).toBe(false);
  });

  it('detects duplicate locations', () => {
    const rows = [
      { key: 'a', stateSlug: 'lagos', locationSlug: 'ikoyi' },
      { key: 'b', stateSlug: 'lagos', locationSlug: 'ikoyi' },
    ];
    expect(isDuplicateLocation('ikoyi', rows, 'a')).toBe(true);
    const result = validateCoverageRows(
      rows,
      { maxCoverageLocations: 3, allowStatewide: false, maxStates: 1 },
      nodes,
    );
    expect(result.ok).toBe(false);
    expect(result.duplicateKeys).toContain('a');
    expect(result.errors[0]).toContain('already added');
  });

  it('blocks statewide on free plan and clears siblings on statewide choice', () => {
    const freeCaps = {
      maxCoverageLocations: 3,
      allowStatewide: false,
      maxStates: 1,
    };
    const freeRows = [
      { key: '1', stateSlug: 'lagos', locationSlug: 'lagos-all' },
    ];
    const freeResult = validateCoverageRows(freeRows, freeCaps, nodes);
    expect(freeResult.statewideNotAllowed).toBe(true);

    const cleared = applyStatewideChoice(
      [
        { key: '1', stateSlug: 'lagos', locationSlug: 'ikoyi' },
        { key: '2', stateSlug: 'lagos', locationSlug: 'ajah' },
        { key: '3', stateSlug: 'fct', locationSlug: 'wuse' },
      ],
      '1',
      'lagos-all',
      'lagos',
    );
    expect(cleared).toEqual([
      { key: '1', stateSlug: 'lagos', locationSlug: 'lagos-all' },
      { key: '3', stateSlug: 'fct', locationSlug: 'wuse' },
    ]);
  });

  it('enforces plan caps for locations and states', () => {
    const rows = [
      { key: '1', stateSlug: 'lagos', locationSlug: 'ikoyi' },
      { key: '2', stateSlug: 'lagos', locationSlug: 'ajah' },
      { key: '3', stateSlug: 'lagos', locationSlug: 'yaba' },
      { key: '4', stateSlug: 'fct', locationSlug: 'wuse' },
    ];
    const result = validateCoverageRows(
      rows,
      { maxCoverageLocations: 3, allowStatewide: true, maxStates: 1 },
      nodes,
    );
    expect(result.overLocationCap).toBe(true);
    expect(result.overStateCap).toBe(true);
  });

  it('matches aliases like Lekki Ph1 and VI', () => {
    const lekki = matchGeoAlias('Lekki Ph1', nodes);
    expect(lekki[0]?.node.slug).toBe('lekki-phase-1');
    const vi = matchGeoAlias('VI', nodes);
    expect(vi[0]?.node.slug).toBe('victoria-island');
  });

  it('lists the same locations for a state in every picker row', () => {
    const lagos = listLocationsForState('lagos', nodes);
    expect(lagos[0]?.slug).toBe('lagos-all');
    expect(lagos.some((node) => node.slug === 'lekki-phase-1')).toBe(true);
    expect(listLocationsForState('lagos', nodes, { includeStatewide: false })[0]?.isStatewide).toBe(
      false,
    );
  });

  it('starts coverage with one empty row helper', () => {
    const row = createEmptyCoverageRow('lagos');
    expect(row.locationSlug).toBe('');
    expect(row.stateSlug).toBe('lagos');
  });

  it('round-trips CSV import/export without blank duplicates', () => {
    const csv = geoNodesToCsv(nodes);
    const imported = geoNodesFromCsv(csv);
    const slugs = imported.map((node) => node.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(imported.some((node) => node.slug === 'lagos-all')).toBe(true);
  });

  it('merges a neighbourhood into another and returns a redirect', () => {
    const source = nodes.find((node) => node.slug === 'oniru');
    const target = nodes.find((node) => node.slug === 'victoria-island');
    expect(source && target).toBeTruthy();
    const result = mergeGeoNodes(nodes, source!.id, target!.id);
    expect(result.nodes.some((node) => node.id === source!.id)).toBe(false);
    expect(result.redirect.fromSlug).toBe('oniru');
    expect(result.redirect.toSlug).toBe('victoria-island');
    expect(result.nodes.find((node) => node.id === target!.id)?.aliases.length).toBeGreaterThan(0);
  });
});

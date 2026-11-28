import { describe, expect, it } from 'vitest';
import { listLocationsForState } from '@askalert/geo';
import {
  exportGeoCsv,
  importGeoCsv,
  mergeGeoAdminNodes,
  publishGeoAdmin,
  seedGeoAdminState,
} from './geo-admin';
import { canEditGeography, canPublishGeography } from './roles';

describe('geography admin roles', () => {
  it('allows operations to edit and publish geography', () => {
    expect(canEditGeography('operations')).toBe(true);
    expect(canPublishGeography('operations')).toBe(true);
    expect(canPublishGeography('read_only')).toBe(false);
  });
});

describe('geography admin merge and csv', () => {
  it('merges locations and keeps a redirect', () => {
    const state = seedGeoAdminState();
    const locations = listLocationsForState('lagos', state.working, {
      includeStatewide: false,
    });
    const source = locations.find((node) => node.slug === 'oniru');
    const target = locations.find((node) => node.slug === 'victoria-island');
    expect(source && target).toBeTruthy();
    const merged = mergeGeoAdminNodes(state, source!.id, target!.id, 'operations');
    expect(merged.ok).toBe(true);
    if (!merged.ok) {
      return;
    }
    expect(merged.state.working.some((node) => node.slug === 'oniru')).toBe(false);
    expect(merged.state.redirects[0]?.fromSlug).toBe('oniru');
    expect(merged.state.redirects[0]?.toSlug).toBe('victoria-island');
  });

  it('round-trips CSV and publishes a version', () => {
    let state = seedGeoAdminState();
    const csv = exportGeoCsv(state);
    const imported = importGeoCsv(state, csv, 'operations');
    expect(imported.ok).toBe(true);
    if (!imported.ok) {
      return;
    }
    state = imported.state;
    const published = publishGeoAdmin(state, 'Sync Lagos seed', 'operations');
    expect(published.ok).toBe(true);
    if (!published.ok) {
      return;
    }
    expect(published.state.versions[0]?.version).toBe(1);
  });
});

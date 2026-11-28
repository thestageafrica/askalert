import { geoNodesToCsv } from '../csv';
import { geoSeedSchema, type GeoNode, type GeoSeed } from '../schemas';
import { ensureStatewideNodes } from '../tree';
import nigeriaSeed from './nigeria.json' with { type: 'json' };

export function loadNigeriaGeoSeed(): GeoSeed {
  const parsed = geoSeedSchema.parse(nigeriaSeed);
  return {
    ...parsed,
    nodes: ensureStatewideNodes(parsed.nodes),
  };
}

export function listGeoSeedNodes(): readonly GeoNode[] {
  return loadNigeriaGeoSeed().nodes;
}

/** Admin-friendly CSV export of the Nigeria seed. */
export function nigeriaGeoSeedCsv(): string {
  return geoNodesToCsv(listGeoSeedNodes());
}

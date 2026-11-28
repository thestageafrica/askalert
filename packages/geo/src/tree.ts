import type { GeoNode } from './schemas';
import { buildGeoLookup, statewideNodeForState } from './covers-location';

export function listCountries(nodes: readonly GeoNode[]): GeoNode[] {
  return nodes
    .filter((node) => node.level === 'country' && node.status === 'active')
    .slice()
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
}

export function listStates(nodes: readonly GeoNode[]): GeoNode[] {
  return nodes
    .filter((node) => node.level === 'state' && node.status === 'active')
    .slice()
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
}

function isDescendantOf(
  node: GeoNode,
  ancestorId: string,
  byId: Map<string, GeoNode>,
): boolean {
  let current: GeoNode | undefined = node;
  while (current?.parentId) {
    if (current.parentId === ancestorId) {
      return true;
    }
    current = byId.get(current.parentId);
  }
  return false;
}

/** Flat location list for a state (statewide first, then areas and neighbourhoods). */
export function listLocationsForState(
  stateSlug: string,
  nodes: readonly GeoNode[],
  options?: { includeStatewide?: boolean },
): GeoNode[] {
  const includeStatewide = options?.includeStatewide ?? true;
  const state = nodes.find(
    (node) => node.slug === stateSlug && node.level === 'state' && node.status === 'active',
  );
  if (!state) {
    return [];
  }

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const children = nodes
    .filter((node) => {
      if (node.status !== 'active') {
        return false;
      }
      if (node.level !== 'area' && node.level !== 'neighbourhood') {
        return false;
      }
      if (!includeStatewide && node.isStatewide) {
        return false;
      }
      return isDescendantOf(node, state.id, byId);
    })
    .slice()
    .sort((a, b) => {
      if (a.isStatewide !== b.isStatewide) {
        return a.isStatewide ? -1 : 1;
      }
      return a.sort - b.sort || a.name.localeCompare(b.name);
    });

  return children;
}

export function ensureStatewideNodes(nodes: readonly GeoNode[]): GeoNode[] {
  const lookup = buildGeoLookup(nodes);
  const next = [...nodes];
  for (const state of listStates(nodes)) {
    const existing = statewideNodeForState(state, lookup);
    if (existing) {
      continue;
    }
    next.push({
      id: `${state.id}-statewide`,
      parentId: state.id,
      level: 'area',
      slug: `${state.slug}-all`,
      name: `All of ${state.name}`,
      aliases: [`all ${state.name}`.toLowerCase()],
      lat: null,
      lng: null,
      isStatewide: true,
      status: 'active',
      sort: 0,
    });
  }
  return next;
}

export function statewideSlugForState(stateSlug: string): string {
  return `${stateSlug}-all`;
}

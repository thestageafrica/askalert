import type { GeoNode } from './schemas';

export type GeoLookup = {
  byId: Map<string, GeoNode>;
  bySlug: Map<string, GeoNode>;
};

export function buildGeoLookup(nodes: readonly GeoNode[]): GeoLookup {
  const byId = new Map<string, GeoNode>();
  const bySlug = new Map<string, GeoNode>();
  for (const node of nodes) {
    byId.set(node.id, node);
    bySlug.set(node.slug, node);
  }
  return { byId, bySlug };
}

export function findNode(
  nodes: readonly GeoNode[] | GeoLookup,
  idOrSlug: string,
): GeoNode | undefined {
  if ('byId' in nodes) {
    return nodes.byId.get(idOrSlug) ?? nodes.bySlug.get(idOrSlug);
  }
  return nodes.find((node) => node.id === idOrSlug || node.slug === idOrSlug);
}

function ancestorsOf(node: GeoNode, lookup: GeoLookup): GeoNode[] {
  const chain: GeoNode[] = [];
  let current: GeoNode | undefined = node;
  while (current?.parentId) {
    const parent = lookup.byId.get(current.parentId);
    if (!parent) {
      break;
    }
    chain.push(parent);
    current = parent;
  }
  return chain;
}

export function stateForNode(node: GeoNode, lookup: GeoLookup): GeoNode | undefined {
  if (node.level === 'state') {
    return node;
  }
  return ancestorsOf(node, lookup).find((item) => item.level === 'state');
}

export function statewideNodeForState(
  state: GeoNode,
  lookup: GeoLookup,
): GeoNode | undefined {
  for (const node of lookup.byId.values()) {
    if (node.parentId === state.id && node.isStatewide) {
      return node;
    }
  }
  return undefined;
}

/**
 * Vendor coverage covers a request location when:
 * - same node
 * - vendor node is an ancestor of the request node
 * - vendor node is the statewide node of the request's state
 */
export function coversLocation(
  vendorNode: GeoNode | string,
  requestNode: GeoNode | string,
  nodes: readonly GeoNode[],
): boolean {
  const lookup = buildGeoLookup(nodes);
  const vendor =
    typeof vendorNode === 'string' ? findNode(lookup, vendorNode) : vendorNode;
  const request =
    typeof requestNode === 'string' ? findNode(lookup, requestNode) : requestNode;

  if (!vendor || !request) {
    return false;
  }
  if (vendor.status !== 'active' || request.status !== 'active') {
    return false;
  }
  if (vendor.id === request.id || vendor.slug === request.slug) {
    return true;
  }

  const requestAncestors = ancestorsOf(request, lookup);
  if (requestAncestors.some((node) => node.id === vendor.id)) {
    return true;
  }

  if (vendor.isStatewide) {
    const requestState = stateForNode(request, lookup);
    if (requestState && vendor.parentId === requestState.id) {
      return true;
    }
  }

  return false;
}

export function vendorCoversRequest(
  vendorNodeIdsOrSlugs: readonly string[],
  requestNodeIdOrSlug: string,
  nodes: readonly GeoNode[],
): boolean {
  return vendorNodeIdsOrSlugs.some((item) =>
    coversLocation(item, requestNodeIdOrSlug, nodes),
  );
}

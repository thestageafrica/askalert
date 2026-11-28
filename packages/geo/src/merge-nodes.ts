import type { GeoNode } from './schemas';

export type GeoRedirect = {
  fromSlug: string;
  toSlug: string;
  fromId: string;
  toId: string;
};

export type MergeGeoNodesResult = {
  nodes: GeoNode[];
  redirect: GeoRedirect;
};

/**
 * Merge `sourceId` into `targetId`.
 * Children of the source move under the target. Source aliases are absorbed.
 * Source is removed and a redirect is returned for lookups.
 */
export function mergeGeoNodes(
  nodes: readonly GeoNode[],
  sourceId: string,
  targetId: string,
): MergeGeoNodesResult {
  if (sourceId === targetId) {
    throw new Error('Cannot merge a location into itself.');
  }
  const source = nodes.find((node) => node.id === sourceId);
  const target = nodes.find((node) => node.id === targetId);
  if (!source || !target) {
    throw new Error('Both locations must exist to merge.');
  }
  if (source.isStatewide || target.isStatewide) {
    throw new Error('Statewide nodes cannot be merged.');
  }
  if (source.level === 'country' || target.level === 'country') {
    throw new Error('Country nodes cannot be merged.');
  }
  if (source.level === 'state' || target.level === 'state') {
    throw new Error('Merge states only through an explicit admin tool later.');
  }

  const aliasSet = new Set(
    [...target.aliases, ...source.aliases, source.name, source.slug].map((item) =>
      item.trim().toLowerCase(),
    ),
  );
  aliasSet.delete(target.name.trim().toLowerCase());
  aliasSet.delete(target.slug.trim().toLowerCase());

  const nextTarget: GeoNode = {
    ...target,
    aliases: [...aliasSet].filter(Boolean),
  };

  const next: GeoNode[] = [];
  for (const node of nodes) {
    if (node.id === sourceId) {
      continue;
    }
    if (node.id === targetId) {
      next.push(nextTarget);
      continue;
    }
    if (node.parentId === sourceId) {
      next.push({ ...node, parentId: targetId });
      continue;
    }
    next.push(node);
  }

  return {
    nodes: next,
    redirect: {
      fromSlug: source.slug,
      toSlug: target.slug,
      fromId: source.id,
      toId: target.id,
    },
  };
}

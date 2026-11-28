import type { GeoNode } from './schemas';

export type GeoAliasMatch = {
  node: GeoNode;
  alias: string;
  confidence: number;
};

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchGeoAlias(
  text: string,
  nodes: readonly GeoNode[],
  options?: { levels?: readonly GeoNode['level'][]; limit?: number },
): GeoAliasMatch[] {
  const query = normalize(text);
  if (!query) {
    return [];
  }
  const levels = options?.levels;
  const limit = options?.limit ?? 8;
  const hits: GeoAliasMatch[] = [];

  for (const node of nodes) {
    if (node.status !== 'active') {
      continue;
    }
    if (levels && !levels.includes(node.level)) {
      continue;
    }
    const candidates = [node.name, node.slug.replace(/-/g, ' '), ...node.aliases];
    for (const candidate of candidates) {
      const aliasNorm = normalize(candidate);
      if (!aliasNorm) {
        continue;
      }
      let confidence = 0;
      if (aliasNorm === query) {
        confidence = 1;
      } else if (aliasNorm.startsWith(query) || query.startsWith(aliasNorm)) {
        confidence = 0.92;
      } else if (aliasNorm.includes(query) || query.includes(aliasNorm)) {
        confidence = 0.8;
      } else {
        continue;
      }
      hits.push({ node, alias: candidate, confidence });
      break;
    }
  }

  return hits
    .sort(
      (a, b) =>
        b.confidence - a.confidence ||
        a.node.name.localeCompare(b.node.name),
    )
    .slice(0, limit);
}

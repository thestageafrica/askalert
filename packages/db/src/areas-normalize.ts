import type { AreaNode } from './areas-catalogue';
import { AREA_CATALOGUE } from './areas-catalogue';

/** Merge seed catalogue with local/remote so Lagos locations always appear. */
export function mergeAreaCatalogues(
  primary: readonly AreaNode[],
  secondary: readonly AreaNode[] = AREA_CATALOGUE,
): AreaNode[] {
  const bySlug = new Map<string, AreaNode>();
  for (const node of secondary) {
    bySlug.set(node.slug, node);
  }
  for (const node of primary) {
    bySlug.set(node.slug, node);
  }
  return [...bySlug.values()];
}

type RawArea = {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
};

/**
 * Flatten legacy Lagos → Eti-Osa → leaf trees into State → Location.
 * Intermediate districts become ignored parents; their children hang under the state.
 */
export function normalizeRemoteAreas(rows: RawArea[]): AreaNode[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const roots = rows.filter((row) => row.parent_id == null);

  const nodes: AreaNode[] = [];
  for (const root of roots) {
    // Skip retired middle nodes that somehow lost children and have no state role.
    if (root.slug === 'eti-osa') {
      continue;
    }
    nodes.push({
      id: root.id,
      slug: root.slug,
      name: root.name,
      parentId: null,
      sortOrder: root.sort_order,
    });

    const directChildren = rows
      .filter((row) => row.parent_id === root.id)
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order);

    for (const child of directChildren) {
      const grandchildren = rows
        .filter((row) => row.parent_id === child.id)
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order);

      if (grandchildren.length > 0) {
        // child is a district (e.g. Eti-Osa) — promote leaves under state.
        for (const leaf of grandchildren) {
          nodes.push({
            id: leaf.id,
            slug: leaf.slug,
            name: leaf.name,
            parentId: root.id,
            sortOrder: leaf.sort_order,
            statewide: leaf.slug.endsWith('-all'),
          });
        }
        continue;
      }

      if (child.slug === 'eti-osa') {
        continue;
      }

      nodes.push({
        id: child.id,
        slug: child.slug,
        name: child.name,
        parentId: root.id,
        sortOrder: child.sort_order,
        statewide: child.slug.endsWith('-all'),
      });
    }
  }

  // Orphans that still point at a missing/retired parent: attach under known state if possible.
  for (const row of rows) {
    if (nodes.some((node) => node.slug === row.slug)) {
      continue;
    }
    if (!row.parent_id || row.slug === 'eti-osa') {
      continue;
    }
    // Skip district parents that still have children in the raw set.
    if (rows.some((child) => child.parent_id === row.id)) {
      continue;
    }
    const parent = byId.get(row.parent_id);
    if (!parent) {
      continue;
    }
    const state =
      nodes.find((node) => node.parentId == null && node.slug === 'lagos') ??
      nodes.find((node) => node.parentId == null);
    if (!state) {
      continue;
    }
    nodes.push({
      id: row.id,
      slug: row.slug,
      name: row.name,
      parentId: state.id,
      sortOrder: row.sort_order,
      statewide: row.slug.endsWith('-all'),
    });
  }

  return mergeAreaCatalogues(nodes, AREA_CATALOGUE);
}

/** Static Lagos-first geography for vendor pickers when Supabase is offline. */

export type AreaNode = {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  /** Statewide “cover all locations” option for a state. */
  statewide?: boolean;
};

const LAGOS_ID = '11111111-1111-4111-8111-111111111101';

/** Seed catalogue: State → Location (flat under state). */
export const AREA_CATALOGUE: readonly AreaNode[] = [
  {
    id: LAGOS_ID,
    slug: 'lagos',
    name: 'Lagos',
    parentId: null,
    sortOrder: 1,
  },
  {
    id: '11111111-1111-4111-8111-111111111109',
    slug: 'lagos-all',
    name: 'All of Lagos',
    parentId: LAGOS_ID,
    sortOrder: 0,
    statewide: true,
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    slug: 'lekki-phase-1',
    name: 'Lekki Phase 1',
    parentId: LAGOS_ID,
    sortOrder: 1,
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    slug: 'lekki',
    name: 'Lekki',
    parentId: LAGOS_ID,
    sortOrder: 2,
  },
  {
    id: '11111111-1111-4111-8111-111111111105',
    slug: 'victoria-island',
    name: 'Victoria Island',
    parentId: LAGOS_ID,
    sortOrder: 3,
  },
  {
    id: '11111111-1111-4111-8111-111111111106',
    slug: 'ikoyi',
    name: 'Ikoyi',
    parentId: LAGOS_ID,
    sortOrder: 4,
  },
  {
    id: '11111111-1111-4111-8111-111111111107',
    slug: 'ajah',
    name: 'Ajah',
    parentId: LAGOS_ID,
    sortOrder: 5,
  },
  {
    id: '11111111-1111-4111-8111-111111111108',
    slug: 'oniru',
    name: 'Oniru',
    parentId: LAGOS_ID,
    sortOrder: 6,
  },
  {
    id: '11111111-1111-4111-8111-111111111110',
    slug: 'ikorodu',
    name: 'Ikorodu',
    parentId: LAGOS_ID,
    sortOrder: 7,
  },
  {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'ikeja',
    name: 'Ikeja',
    parentId: LAGOS_ID,
    sortOrder: 8,
  },
  {
    id: '11111111-1111-4111-8111-111111111112',
    slug: 'surulere',
    name: 'Surulere',
    parentId: LAGOS_ID,
    sortOrder: 9,
  },
  {
    id: '11111111-1111-4111-8111-111111111113',
    slug: 'yaba',
    name: 'Yaba',
    parentId: LAGOS_ID,
    sortOrder: 10,
  },
];

export function listSeedStates(nodes: readonly AreaNode[] = AREA_CATALOGUE): AreaNode[] {
  return nodes
    .filter((node) => node.parentId == null)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function listSeedLocationsForState(
  stateSlug: string,
  nodes: readonly AreaNode[] = AREA_CATALOGUE,
): AreaNode[] {
  const state = nodes.find((node) => node.slug === stateSlug && node.parentId == null);
  if (!state) {
    return [];
  }
  return nodes
    .filter((node) => node.parentId === state.id)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function findAreaBySlug(
  slug: string,
  nodes: readonly AreaNode[] = AREA_CATALOGUE,
): AreaNode | undefined {
  return nodes.find((node) => node.slug === slug);
}

export function areaDisplayName(
  slug: string,
  nodes: readonly AreaNode[] = AREA_CATALOGUE,
): string {
  return findAreaBySlug(slug, nodes)?.name ?? slug;
}

export function isStatewideLocation(
  slug: string,
  nodes: readonly AreaNode[] = AREA_CATALOGUE,
): boolean {
  return Boolean(findAreaBySlug(slug, nodes)?.statewide) || slug.endsWith('-all');
}

export function statewideSlugForState(stateSlug: string): string {
  return `${stateSlug}-all`;
}

/** Specific locations used for category_areas seed links (excludes statewide). */
export function listSeedLocationIdsForCategoryLinks(
  nodes: readonly AreaNode[] = AREA_CATALOGUE,
): string[] {
  return nodes
    .filter((node) => node.parentId != null && !node.statewide)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((node) => node.id);
}

export function rowsFromAreaSlugs(
  areaSlugs: string[],
  nodes: readonly AreaNode[] = AREA_CATALOGUE,
): Array<{ stateSlug: string; locationSlug: string }> {
  const rows: Array<{ stateSlug: string; locationSlug: string }> = [];
  for (const slug of areaSlugs) {
    const location = findAreaBySlug(slug, nodes);
    if (!location || !location.parentId) {
      continue;
    }
    const state = nodes.find((node) => node.id === location.parentId);
    if (!state) {
      continue;
    }
    rows.push({ stateSlug: state.slug, locationSlug: location.slug });
  }
  return rows;
}

export function areaSlugsFromRows(
  rows: Array<{ stateSlug: string; locationSlug: string }>,
): string[] {
  const slugs: string[] = [];
  for (const row of rows) {
    if (!row.locationSlug) {
      continue;
    }
    if (!slugs.includes(row.locationSlug)) {
      slugs.push(row.locationSlug);
    }
  }
  return slugs;
}

/**
 * True when the selection already covers the whole state (statewide option)
 * or would duplicate an existing location.
 */
export function canAddCoverageRow(options: {
  existingLocationSlugs: string[];
  stateSlug: string;
  nodes?: readonly AreaNode[];
}): boolean {
  const nodes = options.nodes ?? AREA_CATALOGUE;
  const statewide = statewideSlugForState(options.stateSlug);
  if (options.existingLocationSlugs.includes(statewide)) {
    return false;
  }
  const locations = listSeedLocationsForState(options.stateSlug, nodes);
  return locations.some((loc) => !options.existingLocationSlugs.includes(loc.slug));
}

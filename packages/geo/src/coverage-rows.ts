import type { CoveragePlanCaps, GeoNode } from './schemas';
import { buildGeoLookup, findNode, stateForNode } from './covers-location';

export type CoverageRow = {
  key: string;
  stateSlug: string;
  locationSlug: string;
};

export type CoverageValidationResult = {
  ok: boolean;
  errors: string[];
  duplicateKeys: string[];
  statewideBlocked: boolean;
  overLocationCap: boolean;
  overStateCap: boolean;
  statewideNotAllowed: boolean;
};

export function createEmptyCoverageRow(stateSlug = ''): CoverageRow {
  return {
    key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    stateSlug,
    locationSlug: '',
  };
}

export function isDuplicateLocation(
  locationSlug: string,
  rows: readonly CoverageRow[],
  exceptKey?: string,
): boolean {
  if (!locationSlug) {
    return false;
  }
  return rows.some(
    (row) =>
      row.key !== exceptKey &&
      row.locationSlug === locationSlug &&
      Boolean(row.locationSlug),
  );
}

export function filledLocationCount(rows: readonly CoverageRow[]): number {
  return rows.filter((row) => row.locationSlug).length;
}

export function selectedStateSlugs(rows: readonly CoverageRow[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    if (row.stateSlug && row.locationSlug) {
      set.add(row.stateSlug);
    }
  }
  return [...set];
}

export function hasStatewideForState(
  rows: readonly CoverageRow[],
  stateSlug: string,
  nodes: readonly GeoNode[],
): boolean {
  const lookup = buildGeoLookup(nodes);
  return rows.some((row) => {
    if (row.stateSlug !== stateSlug || !row.locationSlug) {
      return false;
    }
    const node = findNode(lookup, row.locationSlug);
    return Boolean(node?.isStatewide);
  });
}

export function canAddCoverageRow(
  rows: readonly CoverageRow[],
  caps: CoveragePlanCaps,
  nodes: readonly GeoNode[],
): boolean {
  if (filledLocationCount(rows) >= caps.maxCoverageLocations) {
    return false;
  }
  if (rows.length >= caps.maxCoverageLocations) {
    return false;
  }
  const lookup = buildGeoLookup(nodes);
  const statewideByState = new Map<string, boolean>();
  for (const row of rows) {
    if (!row.locationSlug) {
      continue;
    }
    const node = findNode(lookup, row.locationSlug);
    if (node?.isStatewide && row.stateSlug) {
      statewideByState.set(row.stateSlug, true);
    }
  }
  // If every selected state is already statewide-only and no empty row room conceptually,
  // still allow empty rows only when under cap — UI blocks more rows for statewide states.
  return true;
}

export function validateCoverageRows(
  rows: readonly CoverageRow[],
  caps: CoveragePlanCaps,
  nodes: readonly GeoNode[],
): CoverageValidationResult {
  const errors: string[] = [];
  const duplicateKeys: string[] = [];
  const lookup = buildGeoLookup(nodes);
  const counts = new Map<string, number>();

  for (const row of rows) {
    if (!row.locationSlug) {
      continue;
    }
    counts.set(row.locationSlug, (counts.get(row.locationSlug) ?? 0) + 1);
  }

  for (const row of rows) {
    if (row.locationSlug && (counts.get(row.locationSlug) ?? 0) > 1) {
      duplicateKeys.push(row.key);
    }
  }
  if (duplicateKeys.length > 0) {
    errors.push('This location is already added. Choose another location.');
  }

  let statewideNotAllowed = false;
  let statewideBlocked = false;
  const states = new Set<string>();

  for (const row of rows) {
    if (!row.locationSlug) {
      continue;
    }
    const node = findNode(lookup, row.locationSlug);
    if (!node) {
      errors.push(`Unknown location "${row.locationSlug}".`);
      continue;
    }
    if (row.stateSlug) {
      states.add(row.stateSlug);
    }
    if (node.isStatewide) {
      if (!caps.allowStatewide) {
        statewideNotAllowed = true;
        errors.push('Statewide cover is not on your plan.');
      }
      const others = rows.filter(
        (item) =>
          item.key !== row.key &&
          item.stateSlug === row.stateSlug &&
          Boolean(item.locationSlug),
      );
      if (others.length > 0) {
        statewideBlocked = true;
        errors.push(
          `All of a state covers every location. Clear other rows for ${row.stateSlug} first.`,
        );
      }
    }
  }

  const overLocationCap = filledLocationCount(rows) > caps.maxCoverageLocations;
  if (overLocationCap) {
    errors.push(`Your plan allows up to ${caps.maxCoverageLocations} locations.`);
  }

  const overStateCap = states.size > caps.maxStates;
  if (overStateCap) {
    errors.push(`Your plan allows up to ${caps.maxStates} state${caps.maxStates === 1 ? '' : 's'}.`);
  }

  return {
    ok: errors.length === 0,
    errors: [...new Set(errors)],
    duplicateKeys,
    statewideBlocked,
    overLocationCap,
    overStateCap,
    statewideNotAllowed,
  };
}

export function applyStatewideChoice(
  rows: readonly CoverageRow[],
  rowKey: string,
  statewideSlug: string,
  stateSlug: string,
): CoverageRow[] {
  return rows
    .filter((row) => row.key === rowKey || row.stateSlug !== stateSlug)
    .map((row) =>
      row.key === rowKey
        ? { ...row, stateSlug, locationSlug: statewideSlug }
        : row,
    );
}

export function locationSlugsFromRows(rows: readonly CoverageRow[]): string[] {
  return rows.map((row) => row.locationSlug).filter(Boolean);
}

export function rowsFromLocationSlugs(
  slugs: readonly string[],
  nodes: readonly GeoNode[],
): CoverageRow[] {
  const lookup = buildGeoLookup(nodes);
  const rows: CoverageRow[] = [];
  for (const [index, slug] of slugs.entries()) {
    const node = findNode(lookup, slug);
    if (!node) {
      continue;
    }
    const state = stateForNode(node, lookup);
    rows.push({
      key: `row-${slug}-${index}`,
      stateSlug: state?.slug ?? '',
      locationSlug: node.slug,
    });
  }
  return rows;
}

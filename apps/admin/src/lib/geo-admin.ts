import {
  ensureStatewideNodes,
  geoNodesFromCsv,
  geoNodesToCsv,
  listGeoSeedNodes,
  mergeGeoNodes,
  type GeoNode,
  type GeoRedirect,
} from '@askalert/geo';

export type GeoLocalVersion = {
  id: string;
  version: number;
  changeNote: string;
  nodes: GeoNode[];
  publishedAt: string;
  publishedBy: string;
};

export type GeoAuditEntry = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
};

export type GeoDemandRow = {
  locationSlug: string;
  locationName: string;
  demandCount: number;
  vendorCount: number;
};

export type GeoAdminState = {
  working: GeoNode[];
  redirects: GeoRedirect[];
  versions: GeoLocalVersion[];
  categoryActivation: Record<string, string[]>;
  demandSupply: GeoDemandRow[];
  audit: GeoAuditEntry[];
};

export const GEO_ADMIN_STORAGE_KEY = 'askalert.admin.geo.draft.v1';

export function seedGeoAdminState(): GeoAdminState {
  const nodes = ensureStatewideNodes([...listGeoSeedNodes()]);
  return {
    working: nodes,
    redirects: [],
    versions: [],
    categoryActivation: {
      events: nodes
        .filter((node) => node.level !== 'country' && node.level !== 'state' && node.status === 'active')
        .slice(0, 12)
        .map((node) => node.slug),
    },
    demandSupply: [
      { locationSlug: 'lekki-phase-1', locationName: 'Lekki Phase 1', demandCount: 18, vendorCount: 7 },
      { locationSlug: 'victoria-island', locationName: 'Victoria Island', demandCount: 14, vendorCount: 5 },
      { locationSlug: 'ajah', locationName: 'Ajah', demandCount: 9, vendorCount: 2 },
      { locationSlug: 'ikeja', locationName: 'Ikeja', demandCount: 11, vendorCount: 4 },
    ],
    audit: [],
  };
}

export function loadGeoAdminState(): GeoAdminState {
  const seeded = seedGeoAdminState();
  if (typeof window === 'undefined') {
    return seeded;
  }
  try {
    const raw = window.localStorage.getItem(GEO_ADMIN_STORAGE_KEY);
    if (!raw) {
      return seeded;
    }
    const parsed = JSON.parse(raw) as GeoAdminState;
    if (!parsed.working?.length) {
      return seeded;
    }
    return {
      working: ensureStatewideNodes(parsed.working),
      redirects: parsed.redirects ?? [],
      versions: parsed.versions ?? [],
      categoryActivation: parsed.categoryActivation ?? seeded.categoryActivation,
      demandSupply: parsed.demandSupply?.length ? parsed.demandSupply : seeded.demandSupply,
      audit: parsed.audit ?? [],
    };
  } catch {
    return seeded;
  }
}

export function persistGeoAdminState(state: GeoAdminState): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(GEO_ADMIN_STORAGE_KEY, JSON.stringify(state));
}

function audit(
  state: GeoAdminState,
  actor: string,
  action: string,
  detail: string,
): GeoAdminState {
  return {
    ...state,
    audit: [
      {
        id: `gaudit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        at: new Date().toISOString(),
        actor,
        action,
        detail,
      },
      ...state.audit,
    ].slice(0, 100),
  };
}

export function upsertGeoNode(
  state: GeoAdminState,
  node: GeoNode,
  actor: string,
): GeoAdminState {
  const exists = state.working.some((item) => item.id === node.id);
  const working = exists
    ? state.working.map((item) => (item.id === node.id ? node : item))
    : [...state.working, node];
  return audit(
    { ...state, working: ensureStatewideNodes(working) },
    actor,
    'geo.upsert',
    `Saved ${node.slug}`,
  );
}

export function archiveGeoNode(
  state: GeoAdminState,
  nodeId: string,
  actor: string,
): { ok: true; state: GeoAdminState } | { ok: false; error: string } {
  const node = state.working.find((item) => item.id === nodeId);
  if (!node) {
    return { ok: false, error: 'Location not found.' };
  }
  if (node.isStatewide) {
    return { ok: false, error: 'Statewide nodes stay active.' };
  }
  return {
    ok: true,
    state: upsertGeoNode(state, { ...node, status: 'archived' }, actor),
  };
}

export function mergeGeoAdminNodes(
  state: GeoAdminState,
  sourceId: string,
  targetId: string,
  actor: string,
): { ok: true; state: GeoAdminState } | { ok: false; error: string } {
  try {
    const result = mergeGeoNodes(state.working, sourceId, targetId);
    return {
      ok: true,
      state: audit(
        {
          ...state,
          working: ensureStatewideNodes(result.nodes),
          redirects: [result.redirect, ...state.redirects],
        },
        actor,
        'geo.merge',
        `Merged ${result.redirect.fromSlug} → ${result.redirect.toSlug}`,
      ),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Merge failed.',
    };
  }
}

export function publishGeoAdmin(
  state: GeoAdminState,
  changeNote: string,
  actor: string,
): { ok: true; state: GeoAdminState } | { ok: false; error: string } {
  const note = changeNote.trim();
  if (!note) {
    return { ok: false, error: 'Add a change note before publishing.' };
  }
  const nextVersion =
    state.versions.length === 0
      ? 1
      : Math.max(...state.versions.map((version) => version.version)) + 1;
  const entry: GeoLocalVersion = {
    id: `geover_${nextVersion}`,
    version: nextVersion,
    changeNote: note,
    nodes: state.working,
    publishedAt: new Date().toISOString(),
    publishedBy: actor,
  };
  return {
    ok: true,
    state: audit(
      { ...state, versions: [entry, ...state.versions] },
      actor,
      'geo.publish',
      `Published geography v${nextVersion}: ${note}`,
    ),
  };
}

export function importGeoCsv(
  state: GeoAdminState,
  csv: string,
  actor: string,
): { ok: true; state: GeoAdminState } | { ok: false; error: string } {
  try {
    const imported = geoNodesFromCsv(csv);
    if (imported.length === 0) {
      return { ok: false, error: 'CSV produced no locations.' };
    }
    return {
      ok: true,
      state: audit(
        { ...state, working: ensureStatewideNodes(imported) },
        actor,
        'geo.import',
        `Imported ${imported.length} geo nodes from CSV`,
      ),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'CSV import failed.',
    };
  }
}

export function exportGeoCsv(state: GeoAdminState): string {
  return geoNodesToCsv(state.working);
}

export function setCategoryActivation(
  state: GeoAdminState,
  categorySlug: string,
  locationSlugs: string[],
  actor: string,
): GeoAdminState {
  return audit(
    {
      ...state,
      categoryActivation: {
        ...state.categoryActivation,
        [categorySlug]: locationSlugs,
      },
    },
    actor,
    'geo.activation',
    `Updated active locations for ${categorySlug}`,
  );
}

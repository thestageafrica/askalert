import {
  buildSnapshotFromSeed,
  listCatalogSeeds,
  validateCatalogSeed,
  type CatalogCategorySeed,
  type CatalogVersionSnapshot,
} from '@askalert/catalog';

export type CatalogLocalVersion = {
  id: string;
  categorySlug: string;
  version: number;
  changeNote: string;
  snapshot: CatalogVersionSnapshot;
  publishedAt: string;
  publishedBy: string;
};

export type CatalogGapRow = {
  id: string;
  term: string;
  languageHint: string;
  categorySlug: string | null;
  createdAt: string;
};

export type CatalogAuditEntry = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
};

export type CatalogAdminState = {
  working: CatalogCategorySeed[];
  versions: CatalogLocalVersion[];
  gaps: CatalogGapRow[];
  audit: CatalogAuditEntry[];
};

export const CATALOG_ADMIN_STORAGE_KEY = 'askalert.admin.catalog.draft.v1';

export function seedCatalogAdminState(): CatalogAdminState {
  return {
    working: listCatalogSeeds().map((seed) => structuredClone(seed)),
    versions: [],
    gaps: [
      {
        id: 'gap_owambe',
        term: 'owambe planner',
        languageHint: 'yo',
        categorySlug: 'events',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'gap_gele',
        term: 'gele tying',
        languageHint: 'yo',
        categorySlug: 'beauty-at-home',
        createdAt: new Date().toISOString(),
      },
    ],
    audit: [],
  };
}

export function loadCatalogAdminState(): CatalogAdminState {
  const seeded = seedCatalogAdminState();
  if (typeof window === 'undefined') {
    return seeded;
  }
  try {
    const raw = window.localStorage.getItem(CATALOG_ADMIN_STORAGE_KEY);
    if (!raw) {
      return seeded;
    }
    const parsed = JSON.parse(raw) as CatalogAdminState;
    if (!parsed.working?.length) {
      return seeded;
    }
    return {
      working: parsed.working,
      versions: parsed.versions ?? [],
      gaps: parsed.gaps?.length ? parsed.gaps : seeded.gaps,
      audit: parsed.audit ?? [],
    };
  } catch {
    return seeded;
  }
}

export function persistCatalogAdminState(state: CatalogAdminState): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(CATALOG_ADMIN_STORAGE_KEY, JSON.stringify(state));
}

function audit(
  state: CatalogAdminState,
  actor: string,
  action: string,
  detail: string,
): CatalogAdminState {
  return {
    ...state,
    audit: [
      {
        id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        at: new Date().toISOString(),
        actor,
        action,
        detail,
      },
      ...state.audit,
    ].slice(0, 100),
  };
}

export function upsertCatalogCategory(
  state: CatalogAdminState,
  seed: CatalogCategorySeed,
  actor: string,
): { ok: true; state: CatalogAdminState } | { ok: false; error: string } {
  const validated = validateCatalogSeed(seed);
  if (!validated.ok || !validated.seed) {
    return { ok: false, error: validated.errors[0] ?? 'Invalid catalog seed.' };
  }
  const working = state.working.some((item) => item.category_slug === seed.category_slug)
    ? state.working.map((item) =>
        item.category_slug === seed.category_slug ? validated.seed! : item,
      )
    : [...state.working, validated.seed];
  return {
    ok: true,
    state: audit(
      { ...state, working },
      actor,
      'catalog.upsert',
      `Saved draft for ${seed.category_slug}`,
    ),
  };
}

export function publishCatalogCategory(
  state: CatalogAdminState,
  categorySlug: string,
  changeNote: string,
  actor: string,
): { ok: true; state: CatalogAdminState } | { ok: false; error: string } {
  const note = changeNote.trim();
  if (!note) {
    return { ok: false, error: 'Add a change note before publishing.' };
  }
  const seed = state.working.find((item) => item.category_slug === categorySlug);
  if (!seed) {
    return { ok: false, error: 'Category not found in draft.' };
  }
  const validated = validateCatalogSeed(seed);
  if (!validated.ok || !validated.seed) {
    return { ok: false, error: validated.errors[0] ?? 'Fix validation errors first.' };
  }
  const previous = state.versions
    .filter((version) => version.categorySlug === categorySlug)
    .map((version) => version.version);
  const nextVersion = previous.length ? Math.max(...previous) + 1 : 1;
  const snapshot = buildSnapshotFromSeed(validated.seed, nextVersion);
  const entry: CatalogLocalVersion = {
    id: `catver_${categorySlug}_${nextVersion}`,
    categorySlug,
    version: nextVersion,
    changeNote: note,
    snapshot,
    publishedAt: new Date().toISOString(),
    publishedBy: actor,
  };
  return {
    ok: true,
    state: audit(
      {
        ...state,
        working: state.working.map((item) =>
          item.category_slug === categorySlug ? validated.seed! : item,
        ),
        versions: [entry, ...state.versions],
      },
      actor,
      'catalog.publish',
      `Published ${categorySlug} v${nextVersion}: ${note}`,
    ),
  };
}

export function rollbackCatalogCategory(
  state: CatalogAdminState,
  versionId: string,
  actor: string,
): { ok: true; state: CatalogAdminState } | { ok: false; error: string } {
  const version = state.versions.find((item) => item.id === versionId);
  if (!version) {
    return { ok: false, error: 'Version not found.' };
  }
  const restored: CatalogCategorySeed = {
    category_slug: version.snapshot.category_slug,
    category_name: version.snapshot.category_name,
    type_label: version.snapshot.type_label,
    types: version.snapshot.types,
    services: version.snapshot.services,
    attributes: version.snapshot.attributes
      .filter((attr) => attr.scope === 'category')
      .map(({ scope: _s, scope_slug: _slug, ...attr }) => attr),
    aliases: version.snapshot.aliases
      .filter((alias) => alias.entity === 'category')
      .map(({ entity: _e, entity_slug: _slug, ...alias }) => alias),
  };
  const validated = validateCatalogSeed(restored);
  if (!validated.ok || !validated.seed) {
    return { ok: false, error: validated.errors[0] ?? 'Rollback snapshot is invalid.' };
  }
  return {
    ok: true,
    state: audit(
      {
        ...state,
        working: state.working.map((item) =>
          item.category_slug === version.categorySlug ? validated.seed! : item,
        ),
      },
      actor,
      'catalog.rollback',
      `Rolled ${version.categorySlug} back to v${version.version}`,
    ),
  };
}

export function archiveCatalogService(
  state: CatalogAdminState,
  categorySlug: string,
  serviceSlug: string,
  actor: string,
): { ok: true; state: CatalogAdminState } | { ok: false; error: string } {
  const category = state.working.find((item) => item.category_slug === categorySlug);
  if (!category) {
    return { ok: false, error: 'Category not found.' };
  }
  const next: CatalogCategorySeed = {
    ...category,
    services: category.services.map((service) =>
      service.slug === serviceSlug ? { ...service, status: 'archived' as const } : service,
    ),
  };
  return upsertCatalogCategory(state, next, actor);
}

export function addAliasFromGap(
  state: CatalogAdminState,
  gapId: string,
  serviceSlug: string,
  actor: string,
): { ok: true; state: CatalogAdminState } | { ok: false; error: string } {
  const gap = state.gaps.find((item) => item.id === gapId);
  if (!gap?.categorySlug) {
    return { ok: false, error: 'Gap has no category.' };
  }
  const category = state.working.find((item) => item.category_slug === gap.categorySlug);
  if (!category) {
    return { ok: false, error: 'Category missing.' };
  }
  const service = category.services.find((item) => item.slug === serviceSlug);
  if (!service) {
    return { ok: false, error: 'Pick a service to attach the alias.' };
  }
  const nextService = {
    ...service,
    aliases: [
      ...service.aliases,
      {
        alias: gap.term,
        language: (gap.languageHint === 'yo' ||
        gap.languageHint === 'pcm' ||
        gap.languageHint === 'ig' ||
        gap.languageHint === 'ha'
          ? gap.languageHint
          : 'en') as 'en' | 'pcm' | 'yo' | 'ig' | 'ha',
      },
    ],
  };
  const nextCategory: CatalogCategorySeed = {
    ...category,
    services: category.services.map((item) =>
      item.slug === serviceSlug ? nextService : item,
    ),
  };
  const upserted = upsertCatalogCategory(state, nextCategory, actor);
  if (!upserted.ok) {
    return upserted;
  }
  return {
    ok: true,
    state: {
      ...upserted.state,
      gaps: upserted.state.gaps.filter((item) => item.id !== gapId),
    },
  };
}

export function exportCatalogJson(state: CatalogAdminState): string {
  return JSON.stringify({ version: 1, categories: state.working }, null, 2);
}

export function importCatalogJson(
  state: CatalogAdminState,
  raw: string,
  actor: string,
): { ok: true; state: CatalogAdminState } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw) as { categories?: unknown };
    if (!Array.isArray(parsed.categories)) {
      return { ok: false, error: 'JSON must include a categories array.' };
    }
    const working: CatalogCategorySeed[] = [];
    for (const item of parsed.categories) {
      const validated = validateCatalogSeed(item);
      if (!validated.ok || !validated.seed) {
        return { ok: false, error: validated.errors[0] ?? 'Invalid category in import.' };
      }
      working.push(validated.seed);
    }
    return {
      ok: true,
      state: audit(
        { ...state, working },
        actor,
        'catalog.import',
        `Imported ${working.length} categories`,
      ),
    };
  } catch {
    return { ok: false, error: 'Could not parse JSON.' };
  }
}

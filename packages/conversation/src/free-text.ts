import {
  findCatalogSeedBySlug,
  flattenSnapshotAliases,
  buildSnapshotFromSeed,
  listCatalogSeeds,
  matchAlias,
  type CatalogCategorySeed,
} from '@askalert/catalog';
import { listGeoSeedNodes, matchGeoAlias } from '@askalert/geo';
import type { CaptureDraft, CatalogGapTerm } from './types';

export type FreeTextParseResult = {
  draftPatch: Partial<CaptureDraft>;
  gaps: CatalogGapTerm[];
  confidence: 'high' | 'medium' | 'low';
  notes: string[];
};

const MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

function parseLooseDate(text: string, now = new Date()): string | null {
  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }
  const dayMonth = text.match(/\b(\d{1,2})\s+([A-Za-z]+)\b/);
  if (dayMonth) {
    const month = MONTHS[dayMonth[2]!.toLowerCase()];
    if (month) {
      const year = now.getFullYear();
      const day = Number(dayMonth[1]);
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  return null;
}

function parseGuests(text: string): number | null {
  const match =
    text.match(/\b(\d{2,4})\s*(guests?|pax|people|persons?)\b/i) ??
    text.match(/\bfor\s+(\d{2,4})\b/i);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function parseBudgetNaira(text: string): number | null {
  const match =
    text.match(/\b(?:budget|max|under)\s*(?:of|is|:)?\s*₦?\s*([\d,]+(?:\.\d+)?)\s*(k|m)?\b/i) ??
    text.match(/\b([\d,]+)\s*(k)\s*(?:naira|₦)?\b/i);
  if (!match) {
    return null;
  }
  const raw = Number(match[1]!.replace(/,/g, ''));
  if (!Number.isFinite(raw)) {
    return null;
  }
  const unit = (match[2] ?? '').toLowerCase();
  const naira = unit === 'm' ? raw * 1_000_000 : unit === 'k' ? raw * 1_000 : raw;
  return Math.round(naira * 100);
}

/**
 * Rules-first free-text extraction. Model may only choose from provided catalog/geo IDs.
 * Unknown terms go to catalog gaps.
 */
export function parseFreeTextRequest(
  text: string,
  options?: { seeds?: readonly CatalogCategorySeed[]; now?: Date },
): FreeTextParseResult {
  const seeds = options?.seeds ?? listCatalogSeeds();
  const nodes = listGeoSeedNodes();
  const notes: string[] = [];
  const gaps: CatalogGapTerm[] = [];
  const draftPatch: Partial<CaptureDraft> = {};

  let categorySlug: string | null = null;
  let typeSlug: string | null = null;
  const serviceSlugs = new Set<string>();

  for (const seed of seeds) {
    const snapshot = buildSnapshotFromSeed(seed);
    const aliases = flattenSnapshotAliases(snapshot.aliases, seed.category_slug);
    const hit = matchAlias(text, aliases);
    if (!hit) {
      continue;
    }
    const entitySlug = hit.entityId.includes(':')
      ? hit.entityId.slice(hit.entityId.indexOf(':') + 1)
      : hit.entityId;
    if (hit.entity === 'category') {
      categorySlug = seed.category_slug;
      notes.push(`Matched category via “${hit.alias}”.`);
    } else if (hit.entity === 'type') {
      categorySlug = seed.category_slug;
      typeSlug = entitySlug;
      notes.push(`Matched type via “${hit.alias}”.`);
    } else if (hit.entity === 'service') {
      categorySlug = seed.category_slug;
      serviceSlugs.add(entitySlug);
      notes.push(`Matched service via “${hit.alias}”.`);
    }
  }

  // Direct name contains for common English words when alias miss.
  const lower = text.toLowerCase();
  for (const seed of seeds) {
    if (!categorySlug && lower.includes(seed.category_name.toLowerCase())) {
      categorySlug = seed.category_slug;
    }
    for (const type of seed.types) {
      if (!typeSlug && lower.includes(type.name.toLowerCase())) {
        categorySlug = seed.category_slug;
        typeSlug = type.slug;
      }
    }
    for (const service of seed.services) {
      if (lower.includes(service.name.toLowerCase())) {
        categorySlug = seed.category_slug;
        serviceSlugs.add(service.slug);
      }
    }
  }

  if (/wedding|owambe|burial|funeral|birthday|naming|party/.test(lower)) {
    categorySlug = categorySlug ?? 'events';
    if (!typeSlug) {
      if (/wedding|owambe/.test(lower)) {
        typeSlug = 'wedding';
      } else if (/burial|funeral/.test(lower)) {
        typeSlug = 'burial-funeral';
      } else if (/birthday/.test(lower)) {
        typeSlug = 'birthday';
      } else if (/naming/.test(lower)) {
        typeSlug = 'naming-ceremony';
      }
    }
  }

  if (/home\s*care|cleaner|cleaning/.test(lower)) {
    categorySlug = 'home-care';
  } else if (/shortlet|apartment|airbnb/.test(lower)) {
    categorySlug = categorySlug === 'events' ? categorySlug : 'shortlets';
  }

  const geoHits = matchGeoAlias(text, [...nodes], { limit: 8 }).filter(
    (hit) => hit.node.level !== 'country' && hit.node.status === 'active',
  );
  const rankedGeo = [...geoHits].sort((a, b) => {
    const rank = (level: string) =>
      level === 'neighbourhood' ? 3 : level === 'area' ? 2 : level === 'state' ? 1 : 0;
    const lengthScore = (name: string) => name.length;
    return (
      rank(b.node.level) - rank(a.node.level) ||
      lengthScore(b.node.name) - lengthScore(a.node.name)
    );
  });
  // Prefer an exact longer place phrase when present (e.g. Lekki Phase 1 over Lekki).
  const phase1 = nodes.find(
    (node) =>
      node.slug === 'lekki-phase-1' &&
      /lekki\s*phase\s*1|lekky\s*phase\s*1/i.test(text),
  );
  const vi = nodes.find(
    (node) =>
      node.slug === 'victoria-island' &&
      /\b(vi|victoria\s*island)\b/i.test(text),
  );
  const bestGeo = phase1 ?? vi ?? rankedGeo[0]?.node;
  if (bestGeo) {
    draftPatch.locationSlug = bestGeo.slug;
    if (bestGeo.level === 'state') {
      draftPatch.stateSlug = bestGeo.slug;
    } else {
      const parent = nodes.find((node) => node.id === bestGeo.parentId);
      if (parent?.level === 'state') {
        draftPatch.stateSlug = parent.slug;
      } else if (parent?.parentId) {
        const grand = nodes.find((node) => node.id === parent.parentId);
        if (grand?.level === 'state') {
          draftPatch.stateSlug = grand.slug;
        }
      }
    }
    notes.push(`Matched location “${bestGeo.name}”.`);
  }

  const guests = parseGuests(text);
  const date = parseLooseDate(text, options?.now);
  const budget = parseBudgetNaira(text);

  if (categorySlug) {
    draftPatch.categorySlug = categorySlug;
  }
  if (typeSlug) {
    draftPatch.typeSlug = typeSlug;
  }
  if (serviceSlugs.size > 0) {
    draftPatch.items = [...serviceSlugs].map((serviceSlug) => ({
      serviceSlug,
      quantity: guests,
    }));
  } else if (guests != null && categorySlug === 'events') {
    // Default catering when guests mentioned for events.
    draftPatch.items = [{ serviceSlug: 'catering', quantity: guests }];
    notes.push('Assumed catering from guest count.');
  }
  if (date) {
    draftPatch.startDate = date;
  }
  if (budget != null) {
    draftPatch.budgetMaxMinor = budget;
  }

  // Log unknown token-ish phrases that look like service asks but didn't match.
  const unknownish = text.match(/\b(?:need|want|find)\s+([a-zA-Z][a-zA-Z\s-]{2,40})\b/i);
  if (unknownish && serviceSlugs.size === 0 && !matchAlias(unknownish[1]!, [])) {
    const term = unknownish[1]!.trim();
    const anyHit = seeds.some((seed) => {
      const snapshot = buildSnapshotFromSeed(seed);
      return Boolean(
        matchAlias(term, flattenSnapshotAliases(snapshot.aliases, seed.category_slug)),
      );
    });
    if (!anyHit && term.length > 2) {
      gaps.push({
        id: `gap_${Date.now()}`,
        term,
        createdAt: new Date().toISOString(),
      });
      notes.push(`Logged catalog gap for “${term}”.`);
    }
  }

  const filled = [
    draftPatch.categorySlug,
    draftPatch.typeSlug,
    draftPatch.items?.length,
    draftPatch.locationSlug,
    draftPatch.startDate,
  ].filter(Boolean).length;

  return {
    draftPatch,
    gaps,
    confidence: filled >= 4 ? 'high' : filled >= 2 ? 'medium' : 'low',
    notes,
  };
}

export function constrainedOptionsForPrompt(categorySlug?: string | null): {
  categories: string[];
  types: string[];
  services: string[];
  locations: string[];
} {
  const seeds = listCatalogSeeds();
  const seed = categorySlug ? findCatalogSeedBySlug(categorySlug) : null;
  const active = seed ? [seed] : seeds;
  return {
    categories: seeds.map((item) => item.category_slug),
    types: active.flatMap((item) => item.types.map((type) => type.slug)),
    services: active.flatMap((item) => item.services.map((service) => service.slug)),
    locations: listGeoSeedNodes()
      .filter((node) => node.level !== 'country')
      .map((node) => node.slug),
  };
}

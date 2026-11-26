import type { CatalogCategorySeed } from '../schemas';
import { validateCatalogSeed } from '../validate-catalog-seed';
import autoServices from './auto-services.json' with { type: 'json' };
import beautyAtHome from './beauty-at-home.json' with { type: 'json' };
import carHire from './car-hire.json' with { type: 'json' };
import events from './events.json' with { type: 'json' };
import homeCare from './home-care.json' with { type: 'json' };
import professionalServices from './professional-services.json' with { type: 'json' };
import security from './security.json' with { type: 'json' };
import shortlets from './shortlets.json' with { type: 'json' };
import tutors from './tutors.json' with { type: 'json' };

const seedInputs: ReadonlyArray<{ slug: string; data: unknown }> = [
  { slug: 'events', data: events },
  { slug: 'shortlets', data: shortlets },
  { slug: 'security', data: security },
  { slug: 'car-hire', data: carHire },
  { slug: 'beauty-at-home', data: beautyAtHome },
  { slug: 'home-care', data: homeCare },
  { slug: 'auto-services', data: autoServices },
  { slug: 'professional-services', data: professionalServices },
  { slug: 'tutors', data: tutors },
];

function loadSeed(slug: string, input: unknown): CatalogCategorySeed {
  const result = validateCatalogSeed(input);
  if (!result.ok || !result.seed) {
    throw new Error(`Invalid catalog seed "${slug}":\n- ${result.errors.join('\n- ')}`);
  }
  return result.seed;
}

export const catalogSeeds: readonly CatalogCategorySeed[] = seedInputs.map(({ slug, data }) =>
  loadSeed(slug, data),
);

export type CatalogSeedSlug = (typeof seedInputs)[number]['slug'];

export function listCatalogSeeds(): readonly CatalogCategorySeed[] {
  return catalogSeeds;
}

export function listCatalogCategorySlugs(): readonly CatalogSeedSlug[] {
  return seedInputs.map(({ slug }) => slug);
}

export function findCatalogSeedBySlug(slug: string): CatalogCategorySeed | undefined {
  return catalogSeeds.find((seed) => seed.category_slug === slug);
}
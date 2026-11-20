import type { CategoryConfig } from '../schemas';
import { validateConfig } from '../validate-config';
import autoServices from './auto-services.json' with { type: 'json' };
import beautyAtHome from './beauty-at-home.json' with { type: 'json' };
import businessServices from './business-services.json' with { type: 'json' };
import carHireWithDriver from './car-hire-with-driver.json' with { type: 'json' };
import events from './events.json' with { type: 'json' };
import homeCare from './home-care.json' with { type: 'json' };
import realEstate from './real-estate.json' with { type: 'json' };
import shortlets from './shortlets.json' with { type: 'json' };
import tutors from './tutors.json' with { type: 'json' };

const seedInputs: ReadonlyArray<{ slug: string; data: unknown }> = [
  { slug: 'events', data: events },
  { slug: 'shortlets', data: shortlets },
  { slug: 'home-care', data: homeCare },
  { slug: 'car-hire-with-driver', data: carHireWithDriver },
  { slug: 'beauty-at-home', data: beautyAtHome },
  { slug: 'auto-services', data: autoServices },
  { slug: 'business-services', data: businessServices },
  { slug: 'tutors', data: tutors },
  { slug: 'real-estate', data: realEstate },
];

function loadSeed(slug: string, input: unknown): CategoryConfig {
  const result = validateConfig(input);
  if (!result.ok) {
    throw new Error(`Invalid seed "${slug}":\n- ${result.errors.join('\n- ')}`);
  }
  return result.config;
}

export const seedCategories: readonly CategoryConfig[] = seedInputs.map(({ slug, data }) =>
  loadSeed(slug, data),
);

export function listSeedCategories(): readonly CategoryConfig[] {
  return seedCategories;
}

export function findSeedCategoryBySlug(slug: string): CategoryConfig | undefined {
  return seedCategories.find((category) => category.slug === slug);
}

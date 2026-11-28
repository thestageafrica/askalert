import { findSeedCategoryBySlug, listSeedCategories } from './seeds/index';

export {
  agentSchema,
  appliesToSchema,
  attributeSchema,
  attributeTypeSchema,
  attributeValidationSchema,
  categoryConfigSchema,
  categoryStatusSchema,
  escrowModeSchema,
  escrowSchema,
  feeBearerSchema,
  fulfilmentModeSchema,
  locationRoleSchema,
  locationRuleSchema,
  mediaAllowedSchema,
  negotiationModeSchema,
  pricingModeSchema,
  rankingWeightsSchema,
  type AppliesTo,
  type AttributeType,
  type CategoryAttribute,
  type CategoryConfig,
  type CategoryStatus,
  type RankingWeights,
} from './schemas';

export { buildIntakeSteps, type IntakeStep } from './build-intake-steps';
export {
  publishErrors,
  validateConfig,
  type ConfigValidationResult,
} from './validate-config';
export {
  findSeedCategoryBySlug,
  listSeedCategories,
  seedCategories,
} from './seeds/index';

/** @deprecated Prefer CategoryConfig from seed configs. Kept for admin shell compatibility. */
export type Category = {
  id: string;
  name: string;
  slug: string;
};

export function listCategories(): readonly Category[] {
  return listSeedCategories().map((category) => ({
    id: category.slug,
    name: category.name,
    slug: category.slug,
  }));
}

export function findCategoryBySlug(slug: string): Category | undefined {
  const category = findSeedCategoryBySlug(slug);
  if (!category) {
    return undefined;
  }
  return { id: category.slug, name: category.name, slug: category.slug };
}

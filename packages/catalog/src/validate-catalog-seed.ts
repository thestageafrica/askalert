import { catalogCategorySeedSchema, type CatalogCategorySeed } from './schemas';

export type CatalogSeedValidationResult = {
  ok: boolean;
  errors: string[];
  seed?: CatalogCategorySeed;
};

export function validateCatalogSeed(input: unknown): CatalogSeedValidationResult {
  const parsed = catalogCategorySeedSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues.map(
      (issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`,
    );
    return { ok: false, errors };
  }
  return { ok: true, errors: [], seed: parsed.data };
}
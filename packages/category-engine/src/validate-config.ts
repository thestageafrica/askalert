import { categoryConfigSchema, type CategoryConfig } from './schemas';

export type ConfigValidationResult =
  | { ok: true; config: CategoryConfig; errors: [] }
  | { ok: false; config?: undefined; errors: string[] };

const PUBLISHED_STATUSES = new Set(['pilot', 'live']);

function humanizeZodPath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return 'config';
  }
  return path.map(String).join('.');
}

/** Validate a category config and return clear, human-readable errors. */
export function validateConfig(input: unknown): ConfigValidationResult {
  const parsed = categoryConfigSchema.safeParse(input);
  const errors: string[] = [];

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const where = humanizeZodPath(issue.path);
      errors.push(`${where}: ${issue.message}`);
    }
    return { ok: false, errors };
  }

  const config = parsed.data;

  if (PUBLISHED_STATUSES.has(config.status)) {
    errors.push(...publishErrors(config));
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, config, errors: [] };
}

/** Rules that must pass before a category can be pilot or live. */
export function publishErrors(config: CategoryConfig): string[] {
  const errors: string[] = [];

  if (!config.pricing_mode) {
    errors.push('A pricing mode is required before this category can be published.');
  }

  if (!config.escrow) {
    errors.push('An escrow policy is required before this category can be published.');
  } else if (config.escrow.mode === 'none' && config.status === 'live') {
    errors.push('Live categories need an active escrow policy (fixed or buyer_selectable).');
  }

  if (config.commission_pct === undefined || config.commission_pct === null) {
    errors.push('A commission percentage is required before this category can be published.');
  }

  const requiredAttributes = config.attributes.filter((attribute) => attribute.required);
  if (requiredAttributes.length === 0) {
    errors.push('Add at least one required attribute before publishing this category.');
  }

  if (config.vendor_requirements.length === 0) {
    errors.push('Add at least one vendor requirement before publishing this category.');
  }

  return errors;
}

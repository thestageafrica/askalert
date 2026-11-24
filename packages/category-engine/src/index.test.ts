import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildIntakeSteps } from './build-intake-steps';
import {
  findCategoryBySlug,
  findSeedCategoryBySlug,
  listCategories,
  listSeedCategories,
  validateConfig,
} from './index';
import type { CategoryConfig } from './schemas';

const seedsDir = join(dirname(fileURLToPath(import.meta.url)), 'seeds');

const expectedSlugs = [
  'events',
  'shortlets',
  'home-care',
  'car-hire-with-driver',
  'beauty-at-home',
  'auto-services',
  'business-services',
  'tutors',
  'real-estate',
] as const;

function baseConfig(overrides: Partial<CategoryConfig> = {}): CategoryConfig {
  return {
    slug: 'test-category',
    name: 'Test category',
    icon: 'test',
    status: 'draft',
    pricing_mode: 'quote',
    negotiation: 'none',
    autopilot_max_rounds: 0,
    commission_pct: 10,
    escrow: {
      mode: 'fixed',
      default_hold_pct: 60,
      min_hold_pct: 0,
      max_hold_pct: 100,
      vendor_min_release_pct: 0,
      auto_release_hours: 24,
      fee_bearer: 'vendor',
      refund_commission_on_vendor_fault: true,
    },
    inspection_required: false,
    fulfilment: 'none',
    vendor_requirements: ['ID check'],
    media_allowed: ['photo'],
    max_vendors_per_mission: 3,
    response_deadline_minutes: 60,
    attributes: [
      {
        key: 'area',
        label: 'Area',
        type: 'area',
        required: true,
        applies_to: 'need',
        validation: { min_length: 2 },
      },
    ],
    agent: {
      tone: 'Clear',
      extra_rules: [],
      negotiation_hints: [],
    },
    ranking_weights: {
      price: 0.2,
      rating: 0.2,
      response_speed: 0.2,
      proximity: 0.2,
      fit: 0.2,
    },
    ...overrides,
  };
}

describe('validateConfig', () => {
  it('accepts a valid draft config', () => {
    const result = validateConfig(baseConfig());
    expect(result.ok).toBe(true);
  });

  it('rejects ranking weights that do not sum to 1', () => {
    const result = validateConfig(
      baseConfig({
        ranking_weights: {
          price: 0.5,
          rating: 0.5,
          response_speed: 0.5,
          proximity: 0,
          fit: 0,
        },
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes('ranking_weights'))).toBe(true);
  });

  it('blocks publishing without required attributes or vendor requirements', () => {
    const result = validateConfig(
      baseConfig({
        status: 'pilot',
        attributes: [
          {
            key: 'notes',
            label: 'Notes',
            type: 'text',
            required: false,
            applies_to: 'need',
          },
        ],
        vendor_requirements: [],
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes('required attribute'))).toBe(true);
    expect(result.errors.some((error) => error.includes('vendor requirement'))).toBe(true);
  });

  it('returns human-readable escrow range errors', () => {
    const result = validateConfig(
      baseConfig({
        escrow: {
          mode: 'fixed',
          default_hold_pct: 80,
          min_hold_pct: 90,
          max_hold_pct: 70,
          vendor_min_release_pct: 0,
          auto_release_hours: 24,
          fee_bearer: 'vendor',
          refund_commission_on_vendor_fault: true,
        },
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('buildIntakeSteps', () => {
  const shortlets = findSeedCategoryBySlug('shortlets');

  it('returns need questions in config order with validators', () => {
    expect(shortlets).toBeDefined();
    const steps = buildIntakeSteps(shortlets!, 'need');
    expect(steps.map((step) => step.key)).toEqual([
      'check_in',
      'check_out',
      'guests',
      'bedrooms',
      'budget_per_night',
      'area',
    ]);
    expect(steps.every((step) => typeof step.validate === 'function')).toBe(true);
  });

  it('validates money in naira terms and select options', () => {
    const steps = buildIntakeSteps(shortlets!, 'need');
    const budget = steps.find((step) => step.key === 'budget_per_night');
    const guests = steps.find((step) => step.key === 'guests');

    expect(budget?.validate(100_000)).toMatch(/₦|at least/i);
    expect(budget?.validate(2_000_000)).toBeNull();
    expect(guests?.validate(0)).toMatch(/at least/i);
    expect(guests?.validate(2)).toBeNull();
  });

  it('includes both-scoped attributes for offer flows', () => {
    const steps = buildIntakeSteps(shortlets!, 'offer');
    expect(steps.map((step) => step.key)).toEqual(['bedrooms', 'area', 'nightly_rate']);
  });
});

describe('seed configs', () => {
  it('ships exactly nine seed JSON files', () => {
    const files = readdirSync(seedsDir).filter((name) => name.endsWith('.json'));
    expect(files).toHaveLength(9);
  });

  it('loads and validates every seed', () => {
    const loaded = listSeedCategories();
    expect(loaded.map((category) => category.slug).sort()).toEqual([...expectedSlugs].sort());

    for (const slug of expectedSlugs) {
      const raw = JSON.parse(readFileSync(join(seedsDir, `${slug}.json`), 'utf8')) as unknown;
      const result = validateConfig(raw);
      expect(result.ok, `${slug}: ${result.ok ? '' : result.errors.join('; ')}`).toBe(true);
    }
  });

  it('uses escrow defaults from the prompt', () => {
    const events = findSeedCategoryBySlug('events');
    const shortlets = findSeedCategoryBySlug('shortlets');
    expect(events?.status).toBe('pilot');
    expect(shortlets?.status).toBe('pilot');
    expect(findSeedCategoryBySlug('home-care')?.status).toBe('pilot');
    expect(events?.escrow.vendor_min_release_pct).toBe(30);
    expect(shortlets?.escrow.vendor_min_release_pct).toBe(0);
    expect(events?.escrow.default_hold_pct).toBe(60);
    expect(events?.escrow.min_hold_pct).toBe(0);
    expect(events?.escrow.max_hold_pct).toBe(100);
  });

  it('keeps admin list helpers working', () => {
    expect(listCategories().length).toBe(9);
    expect(findCategoryBySlug('events')?.name).toBe('Events');
  });
});

import { z } from 'zod';

export const categoryStatusSchema = z.enum(['draft', 'pilot', 'live', 'paused']);
export const pricingModeSchema = z.enum(['fixed', 'range', 'quote', 'rate_card']);
export const negotiationModeSchema = z.enum(['none', 'assisted', 'auto']);
export const fulfilmentModeSchema = z.enum(['none', 'provider', 'merchant_riders']);
export const mediaAllowedSchema = z.enum(['photo', 'voice_note']);
export const feeBearerSchema = z.enum(['vendor', 'platform', 'buyer']);
export const escrowModeSchema = z.enum(['fixed', 'buyer_selectable', 'none']);
export const attributeTypeSchema = z.enum([
  'text',
  'number',
  'money',
  'date',
  'select',
  'multi',
  'area',
  'boolean',
]);
export const appliesToSchema = z.enum(['need', 'offer', 'both']);
export const locationRuleSchema = z.enum(['specific', 'state', 'none']);
export const locationRoleSchema = z.enum(['at_buyer', 'at_venue', 'at_vendor']);

export const attributeValidationSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
    min_length: z.number().int().nonnegative().optional(),
    max_length: z.number().int().positive().optional(),
    pattern: z.string().optional(),
    min_date: z.string().optional(),
    max_date: z.string().optional(),
  })
  .strict();

export const attributeSchema = z
  .object({
    key: z
      .string()
      .min(1)
      .regex(/^[a-z][a-z0-9_]*$/, 'Attribute key must be snake_case'),
    label: z.string().min(1),
    type: attributeTypeSchema,
    required: z.boolean(),
    applies_to: appliesToSchema,
    options: z.array(z.string().min(1)).optional(),
    unit: z.string().min(1).optional(),
    validation: attributeValidationSchema.optional(),
  })
  .strict()
  .superRefine((attr, ctx) => {
    if ((attr.type === 'select' || attr.type === 'multi') && (!attr.options || attr.options.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Attribute "${attr.key}" needs options for type ${attr.type}.`,
        path: ['options'],
      });
    }
  });

export const escrowSchema = z
  .object({
    mode: escrowModeSchema,
    default_hold_pct: z.number().min(0).max(100),
    min_hold_pct: z.number().min(0).max(100),
    max_hold_pct: z.number().min(0).max(100),
    vendor_min_release_pct: z.number().min(0).max(100),
    auto_release_hours: z.number().positive(),
    fee_bearer: feeBearerSchema,
    refund_commission_on_vendor_fault: z.boolean(),
  })
  .strict()
  .superRefine((escrow, ctx) => {
    if (escrow.min_hold_pct > escrow.max_hold_pct) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'min_hold_pct cannot be greater than max_hold_pct.',
        path: ['min_hold_pct'],
      });
    }
    if (
      escrow.default_hold_pct < escrow.min_hold_pct ||
      escrow.default_hold_pct > escrow.max_hold_pct
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'default_hold_pct must sit between min_hold_pct and max_hold_pct.',
        path: ['default_hold_pct'],
      });
    }
  });

export const agentSchema = z
  .object({
    tone: z.string().min(1),
    extra_rules: z.array(z.string().min(1)).default([]),
    negotiation_hints: z.array(z.string().min(1)).default([]),
  })
  .strict();

export const rankingWeightsSchema = z
  .object({
    price: z.number().min(0).max(1),
    rating: z.number().min(0).max(1),
    response_speed: z.number().min(0).max(1),
    proximity: z.number().min(0).max(1),
    fit: z.number().min(0).max(1),
  })
  .strict()
  .superRefine((weights, ctx) => {
    const sum =
      weights.price + weights.rating + weights.response_speed + weights.proximity + weights.fit;
    if (Math.abs(sum - 1) > 1e-6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `ranking_weights must sum to 1 (got ${sum.toFixed(4)}).`,
      });
    }
  });

export const categoryConfigSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
    name: z.string().min(1),
    icon: z.string().min(1),
    status: categoryStatusSchema,
    pricing_mode: pricingModeSchema,
    negotiation: negotiationModeSchema,
    autopilot_max_rounds: z.number().int().nonnegative(),
    commission_pct: z.number().min(0).max(100),
    escrow: escrowSchema,
    inspection_required: z.boolean(),
    fulfilment: fulfilmentModeSchema,
    vendor_requirements: z.array(z.string().min(1)),
    media_allowed: z.array(mediaAllowedSchema).min(1),
    max_vendors_per_mission: z.number().int().positive(),
    response_deadline_minutes: z.number().int().positive(),
    attributes: z.array(attributeSchema),
    agent: agentSchema,
    ranking_weights: rankingWeightsSchema,
    /** Buyer location picker rule (Prompt 42). */
    location_rule: locationRuleSchema.default('specific'),
    /** Where the service happens for matching copy. */
    location_role: locationRoleSchema.default('at_venue'),
  })
  .strict()
  .superRefine((config, ctx) => {
    const keys = new Set<string>();
    for (const attribute of config.attributes) {
      if (keys.has(attribute.key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate attribute key "${attribute.key}".`,
          path: ['attributes'],
        });
      }
      keys.add(attribute.key);
    }

    if (config.negotiation === 'none' && config.autopilot_max_rounds > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'autopilot_max_rounds should be 0 when negotiation is none.',
        path: ['autopilot_max_rounds'],
      });
    }
  });

export type CategoryConfig = z.infer<typeof categoryConfigSchema>;
export type CategoryAttribute = z.infer<typeof attributeSchema>;
export type CategoryStatus = z.infer<typeof categoryStatusSchema>;
export type AppliesTo = z.infer<typeof appliesToSchema>;
export type AttributeType = z.infer<typeof attributeTypeSchema>;
export type RankingWeights = z.infer<typeof rankingWeightsSchema>;

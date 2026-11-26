import { z } from 'zod';

export const pricingModelSchema = z.enum([
  'banded',
  'per_unit',
  'flat',
  'package',
  'quote_only',
]);

export const dimensionSchema = z.enum([
  'guests',
  'hours',
  'nights',
  'units',
  'guards',
  'items',
  'none',
]);

export const rateBasisSchema = z.enum(['per_unit', 'total']);

export const catalogStatusSchema = z.enum(['draft', 'active', 'paused', 'archived']);

export const aliasLanguageSchema = z.enum(['en', 'pcm', 'yo', 'ig', 'ha']);

export const aliasEntitySchema = z.enum(['category', 'type', 'service']);

export const attributeScopeSchema = z.enum(['category', 'type', 'service']);

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

export const catalogAliasSchema = z
  .object({
    alias: z.string().min(1),
    language: aliasLanguageSchema,
  })
  .strict();

export const rateBandSchema = z
  .object({
    dimMin: z.number().int().nonnegative(),
    dimMax: z.number().int().positive(),
    basis: rateBasisSchema,
    priceMinor: z.number().int().positive(),
    currency: z.literal('NGN'),
    label: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((band, ctx) => {
    if (band.dimMin > band.dimMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dimMin must not be greater than dimMax.',
        path: ['dimMin'],
      });
    }
  });

export const catalogAttributeSchema = z
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
    sort: z.number().int().nonnegative().default(0),
  })
  .strict();

export const categoryTypeSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
    name: z.string().min(1),
    aliases: z.array(catalogAliasSchema).default([]),
    status: catalogStatusSchema.default('active'),
    sort: z.number().int().nonnegative().default(0),
    attributes: z.array(catalogAttributeSchema).default([]),
  })
  .strict();

export const servicePackageSchema = z
  .object({
    slug: z.string().min(1),
    name: z.string().min(1),
    priceMinor: z.number().int().positive(),
    currency: z.literal('NGN'),
    inclusions: z.array(z.string().min(1)).default([]),
  })
  .strict();

export const serviceDefinitionSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
    name: z.string().min(1),
    description: z.string().default(''),
    status: catalogStatusSchema.default('active'),
    sort: z.number().int().nonnegative().default(0),
    pricing_model: pricingModelSchema,
    dimension: dimensionSchema,
    dimension_label: z.string().min(1).optional(),
    unit_label: z.string().min(1).optional(),
    min_value: z.number().int().nonnegative().optional(),
    max_value: z.number().int().positive().optional(),
    step: z.number().int().positive().default(1),
    default_bands: z.array(rateBandSchema).default([]),
    packages: z.array(servicePackageSchema).default([]),
    allow_custom_bands: z.boolean().default(true),
    requires_inspection: z.boolean().default(false),
    default_lead_time_hours: z.number().int().nonnegative().default(24),
    regulated: z.boolean().default(false),
    required_documents: z.array(z.string().min(1)).default([]),
    aliases: z.array(catalogAliasSchema).default([]),
    type_slugs: z.array(z.string().min(1)).min(1),
    attributes: z.array(catalogAttributeSchema).default([]),
  })
  .strict()
  .superRefine((service, ctx) => {
    if (
      service.min_value !== undefined &&
      service.max_value !== undefined &&
      service.min_value >= service.max_value
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'min_value must be less than max_value.',
        path: ['min_value'],
      });
    }
    if (service.pricing_model === 'banded' && service.default_bands.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Banded services need at least one default band.',
        path: ['default_bands'],
      });
    }
    if (service.pricing_model === 'package' && service.packages.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Package services need at least one package.',
        path: ['packages'],
      });
    }
    if (service.regulated && service.required_documents.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Regulated services need required_documents.',
        path: ['required_documents'],
      });
    }
  });

export const catalogCategorySeedSchema = z
  .object({
    category_slug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
    category_name: z.string().min(1),
    type_label: z.string().min(1).default('Type'),
    types: z.array(categoryTypeSchema).min(1),
    services: z.array(serviceDefinitionSchema).min(1),
    attributes: z.array(catalogAttributeSchema).default([]),
    aliases: z.array(catalogAliasSchema).default([]),
  })
  .strict()
  .superRefine((seed, ctx) => {
    const typeSlugs = new Set(seed.types.map((t) => t.slug));
    for (const service of seed.services) {
      for (const typeSlug of service.type_slugs) {
        if (!typeSlugs.has(typeSlug)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Service "${service.slug}" references unknown type "${typeSlug}".`,
            path: ['services'],
          });
        }
      }
    }
  });

export const catalogVersionSnapshotSchema = z
  .object({
    version: z.number().int().positive(),
    category_slug: z.string().min(1),
    category_name: z.string().min(1),
    type_label: z.string().min(1),
    types: z.array(categoryTypeSchema),
    services: z.array(serviceDefinitionSchema),
    attributes: z.array(
      catalogAttributeSchema.extend({
        scope: attributeScopeSchema,
        scope_slug: z.string().min(1),
      }),
    ),
    aliases: z.array(
      catalogAliasSchema.extend({
        entity: aliasEntitySchema,
        entity_slug: z.string().min(1),
      }),
    ),
    service_type_links: z.array(
      z
        .object({
          service_slug: z.string().min(1),
          type_slug: z.string().min(1),
        })
        .strict(),
    ),
  })
  .strict();

export type AliasEntity = z.infer<typeof aliasEntitySchema>;
export type PricingModel = z.infer<typeof pricingModelSchema>;
export type Dimension = z.infer<typeof dimensionSchema>;
export type RateBasis = z.infer<typeof rateBasisSchema>;
export type RateBand = z.infer<typeof rateBandSchema>;
export type CatalogAttribute = z.infer<typeof catalogAttributeSchema>;
export type CategoryType = z.infer<typeof categoryTypeSchema>;
export type ServiceDefinition = z.infer<typeof serviceDefinitionSchema>;
export type CatalogCategorySeed = z.infer<typeof catalogCategorySeedSchema>;
export type CatalogVersionSnapshot = z.infer<typeof catalogVersionSnapshotSchema>;
export type CatalogAlias = z.infer<typeof catalogAliasSchema>;
export type AliasLanguage = z.infer<typeof aliasLanguageSchema>;
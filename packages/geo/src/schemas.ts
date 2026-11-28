import { z } from 'zod';

export const geoLevelSchema = z.enum(['country', 'state', 'area', 'neighbourhood']);
export const geoStatusSchema = z.enum(['draft', 'active', 'paused', 'archived']);
export const locationRuleSchema = z.enum(['specific', 'state', 'none']);
export const locationRoleSchema = z.enum(['at_buyer', 'at_venue', 'at_vendor']);

export const geoNodeSchema = z
  .object({
    id: z.string().min(1),
    parentId: z.string().min(1).nullable(),
    level: geoLevelSchema,
    slug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
    name: z.string().min(1),
    aliases: z.array(z.string().min(1)).default([]),
    lat: z.number().finite().nullable().optional(),
    lng: z.number().finite().nullable().optional(),
    isStatewide: z.boolean().default(false),
    status: geoStatusSchema.default('active'),
    sort: z.number().int().nonnegative().default(0),
  })
  .strict();

export const geoSeedSchema = z
  .object({
    version: z.number().int().positive().default(1),
    nodes: z.array(geoNodeSchema).min(1),
  })
  .strict()
  .superRefine((seed, ctx) => {
    const byId = new Map(seed.nodes.map((node) => [node.id, node]));
    const slugs = new Set<string>();
    for (const node of seed.nodes) {
      if (slugs.has(node.slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate geo slug "${node.slug}".`,
          path: ['nodes'],
        });
      }
      slugs.add(node.slug);
      if (node.parentId && !byId.has(node.parentId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Node "${node.slug}" references missing parent.`,
          path: ['nodes'],
        });
      }
      if (node.isStatewide && node.level !== 'area' && node.level !== 'neighbourhood') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Statewide node "${node.slug}" must be area or neighbourhood level.`,
          path: ['nodes'],
        });
      }
    }
  });

export const coveragePlanCapsSchema = z
  .object({
    maxCoverageLocations: z.number().int().positive(),
    allowStatewide: z.boolean(),
    maxStates: z.number().int().positive(),
  })
  .strict();

export type GeoLevel = z.infer<typeof geoLevelSchema>;
export type GeoStatus = z.infer<typeof geoStatusSchema>;
export type GeoNode = z.infer<typeof geoNodeSchema>;
export type GeoSeed = z.infer<typeof geoSeedSchema>;
export type LocationRule = z.infer<typeof locationRuleSchema>;
export type LocationRole = z.infer<typeof locationRoleSchema>;
export type CoveragePlanCaps = z.infer<typeof coveragePlanCapsSchema>;

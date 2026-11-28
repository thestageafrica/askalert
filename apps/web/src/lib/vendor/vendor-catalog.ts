import {
  buildSnapshotFromSeed,
  findCatalogSeedBySlug,
  listCatalogSeeds,
  resolveCatalogTree,
  type ResolvedCatalogService,
  type ResolvedCatalogTree,
  type ServiceDefinition,
} from '@askalert/catalog';
import type { VendorProfileDraft } from './types';
import type { ServiceRateCard } from './types';

export function catalogSeedsLive() {
  return listCatalogSeeds().filter((seed) =>
    seed.types.some((type) => type.status === 'active'),
  );
}

export function resolveTreeForCategory(categorySlug: string): ResolvedCatalogTree | null {
  const seed = findCatalogSeedBySlug(categorySlug);
  if (!seed) {
    return null;
  }
  return resolveCatalogTree(buildSnapshotFromSeed(seed));
}

export function findCatalogService(
  categorySlug: string,
  serviceSlug: string,
): (ServiceDefinition & { categorySlug: string }) | null {
  const tree = resolveTreeForCategory(categorySlug);
  if (!tree) {
    return null;
  }
  for (const type of tree.types) {
    const match = type.services.find((service) => service.slug === serviceSlug);
    if (match) {
      return { ...match, categorySlug };
    }
  }
  const seed = findCatalogSeedBySlug(categorySlug);
  const fromSeed = seed?.services.find((service) => service.slug === serviceSlug);
  return fromSeed ? { ...fromSeed, categorySlug } : null;
}

export function flattenSelectedServices(
  draft: Pick<VendorProfileDraft, 'categorySlugs' | 'serviceSlugsByCategory'>,
): Array<{ categorySlug: string; serviceSlug: string; service: ResolvedCatalogService | ServiceDefinition }> {
  const rows: Array<{
    categorySlug: string;
    serviceSlug: string;
    service: ResolvedCatalogService | ServiceDefinition;
  }> = [];
  for (const categorySlug of draft.categorySlugs) {
    const slugs = draft.serviceSlugsByCategory[categorySlug] ?? [];
    const tree = resolveTreeForCategory(categorySlug);
    for (const serviceSlug of slugs) {
      let service: ResolvedCatalogService | ServiceDefinition | undefined;
      if (tree) {
        for (const type of tree.types) {
          service = type.services.find((item) => item.slug === serviceSlug);
          if (service) {
            break;
          }
        }
      }
      if (!service) {
        service = findCatalogService(categorySlug, serviceSlug) ?? undefined;
      }
      if (service) {
        rows.push({ categorySlug, serviceSlug, service });
      }
    }
  }
  return rows;
}

export function regulatedRequiredDocuments(
  draft: Pick<VendorProfileDraft, 'categorySlugs' | 'serviceSlugsByCategory'>,
): string[] {
  const required = new Set<string>();
  for (const row of flattenSelectedServices(draft)) {
    if (row.service.regulated) {
      for (const doc of row.service.required_documents) {
        required.add(doc);
      }
    }
  }
  return [...required];
}

export function countSelectedServices(
  draft: Pick<VendorProfileDraft, 'serviceSlugsByCategory'>,
): number {
  let total = 0;
  for (const slugs of Object.values(draft.serviceSlugsByCategory)) {
    total += slugs.length;
  }
  return total;
}

export function serviceRateCardKey(categorySlug: string, serviceSlug: string): string {
  return `${categorySlug}::${serviceSlug}`;
}

export function createServiceRateCardFromSeed(
  categorySlug: string,
  service: ServiceDefinition,
): ServiceRateCard {
  const now = new Date().toISOString();
  const packages = service.packages.map((pkg) => ({
    slug: pkg.slug,
    name: pkg.name,
    priceMinor: pkg.priceMinor,
    inclusions: [...pkg.inclusions],
  }));

  return {
    categorySlug,
    serviceSlug: service.slug,
    appliesToTypeSlugs: 'all',
    bands: service.default_bands.map((band) => ({ ...band })),
    priceMinor:
      service.pricing_model === 'per_unit' || service.pricing_model === 'flat'
        ? service.default_bands[0]?.priceMinor
        : undefined,
    minChargeMinor: undefined,
    packages,
    allowCustomQuoteLarger: true,
    addons: [],
    minNoticeHours: service.default_lead_time_hours,
    depositPct: 0,
    inclusions: [],
    exclusions: [],
    notes: '',
    status: 'draft',
    updatedAt: now,
  };
}

export function previewQuantityForDimension(dimension: ServiceDefinition['dimension']): number {
  switch (dimension) {
    case 'guests':
      return 120;
    case 'hours':
      return 8;
    case 'nights':
      return 3;
    case 'guards':
      return 4;
    case 'items':
    case 'units':
      return 10;
    default:
      return 1;
  }
}
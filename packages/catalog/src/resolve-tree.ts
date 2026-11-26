import type {
  CatalogAttribute,
  CatalogVersionSnapshot,
  CategoryType,
  ServiceDefinition,
} from './schemas';

export type ResolvedCatalogService = ServiceDefinition & {
  id: string;
  typeSlugs: readonly string[];
};

export type ResolvedCatalogType = CategoryType & {
  id: string;
  services: readonly ResolvedCatalogService[];
};

export type ResolvedCatalogTree = {
  categorySlug: string;
  categoryName: string;
  typeLabel: string;
  version: number;
  types: readonly ResolvedCatalogType[];
  categoryAttributes: readonly CatalogAttribute[];
};

function stableId(parts: readonly string[]): string {
  return parts.join(':');
}

export function resolveCatalogTree(
  versionSnapshot: CatalogVersionSnapshot,
): ResolvedCatalogTree {
  const servicesBySlug = new Map<string, ServiceDefinition>();
  for (const service of versionSnapshot.services) {
    servicesBySlug.set(service.slug, service);
  }

  const typeSlugsByService = new Map<string, Set<string>>();
  for (const link of versionSnapshot.service_type_links) {
    const set = typeSlugsByService.get(link.service_slug) ?? new Set<string>();
    set.add(link.type_slug);
    typeSlugsByService.set(link.service_slug, set);
  }
  for (const service of versionSnapshot.services) {
    const set = typeSlugsByService.get(service.slug) ?? new Set<string>();
    for (const slug of service.type_slugs) {
      set.add(slug);
    }
    typeSlugsByService.set(service.slug, set);
  }

  const categoryAttributes: CatalogAttribute[] = versionSnapshot.attributes
    .filter((attr) => attr.scope === 'category')
    .map(({ scope: _scope, scope_slug: _slug, ...attr }) => attr);

  const types: ResolvedCatalogType[] = versionSnapshot.types.map((type) => {
    const services: ResolvedCatalogService[] = [];
    for (const [serviceSlug, typeSlugs] of typeSlugsByService) {
      if (!typeSlugs.has(type.slug)) {
        continue;
      }
      const service = servicesBySlug.get(serviceSlug);
      if (!service || service.status !== 'active') {
        continue;
      }
      services.push({
        ...service,
        id: stableId([versionSnapshot.category_slug, service.slug]),
        typeSlugs: [...typeSlugs],
      });
    }
    services.sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));

    return {
      ...type,
      id: stableId([versionSnapshot.category_slug, type.slug]),
      services,
    };
  });

  types.sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));

  return {
    categorySlug: versionSnapshot.category_slug,
    categoryName: versionSnapshot.category_name,
    typeLabel: versionSnapshot.type_label,
    version: versionSnapshot.version,
    types,
    categoryAttributes,
  };
}

export function buildSnapshotFromSeed(
  seed: import('./schemas').CatalogCategorySeed,
  version = 1,
): CatalogVersionSnapshot {
  const service_type_links = seed.services.flatMap((service) =>
    service.type_slugs.map((type_slug) => ({
      service_slug: service.slug,
      type_slug,
    })),
  );

  const attributes = [
    ...seed.attributes.map((attr) => ({
      ...attr,
      scope: 'category' as const,
      scope_slug: seed.category_slug,
    })),
    ...seed.types.flatMap((type) =>
      type.attributes.map((attr) => ({
        ...attr,
        scope: 'type' as const,
        scope_slug: type.slug,
      })),
    ),
    ...seed.services.flatMap((service) =>
      service.attributes.map((attr) => ({
        ...attr,
        scope: 'service' as const,
        scope_slug: service.slug,
      })),
    ),
  ];

  const aliases = [
    ...seed.aliases.map((alias) => ({
      ...alias,
      entity: 'category' as const,
      entity_slug: seed.category_slug,
    })),
    ...seed.types.flatMap((type) =>
      type.aliases.map((alias) => ({
        ...alias,
        entity: 'type' as const,
        entity_slug: type.slug,
      })),
    ),
    ...seed.services.flatMap((service) =>
      service.aliases.map((alias) => ({
        ...alias,
        entity: 'service' as const,
        entity_slug: service.slug,
      })),
    ),
  ];

  return {
    version,
    category_slug: seed.category_slug,
    category_name: seed.category_name,
    type_label: seed.type_label,
    types: seed.types,
    services: seed.services,
    attributes,
    aliases,
    service_type_links,
  };
}
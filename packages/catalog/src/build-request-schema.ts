import type { CatalogAttribute, CatalogVersionSnapshot } from './schemas';

export type RequestQuestion = CatalogAttribute & {
  scope: 'category' | 'type' | 'service';
  scopeSlug: string;
};

export type RequestSchemaResult = {
  dimensionQuestions: RequestQuestion[];
  attributeQuestions: RequestQuestion[];
  allQuestions: RequestQuestion[];
};

function mergeAttributes(
  layers: readonly (readonly CatalogAttribute[])[],
): CatalogAttribute[] {
  const byKey = new Map<string, CatalogAttribute>();
  for (const layer of layers) {
    for (const attr of layer) {
      byKey.set(attr.key, attr);
    }
  }
  return [...byKey.values()].sort(
    (a, b) => a.sort - b.sort || a.label.localeCompare(b.label),
  );
}

function scopedAttributes(
  snapshot: CatalogVersionSnapshot,
  scope: 'category' | 'type' | 'service',
  scopeSlug: string,
): CatalogAttribute[] {
  return snapshot.attributes
    .filter((attr) => attr.scope === scope && attr.scope_slug === scopeSlug)
    .map(({ scope: _s, scope_slug: _slug, ...attr }) => attr);
}

export function buildRequestSchema(
  category: Pick<CatalogVersionSnapshot, 'category_slug' | 'attributes' | 'services' | 'types'>,
  typeSlug: string,
  serviceSlugs: readonly string[],
): RequestSchemaResult {
  const categoryAttrs = scopedAttributes(
    category as CatalogVersionSnapshot,
    'category',
    category.category_slug,
  );
  const typeAttrs = scopedAttributes(
    category as CatalogVersionSnapshot,
    'type',
    typeSlug,
  );

  const selectedServices = category.services.filter(
    (service) => serviceSlugs.includes(service.slug) && service.status === 'active',
  );

  const serviceAttrLayers: CatalogAttribute[][] = [];
  for (const service of selectedServices) {
    serviceAttrLayers.push(
      scopedAttributes(category as CatalogVersionSnapshot, 'service', service.slug),
    );
  }

  const merged = mergeAttributes([categoryAttrs, typeAttrs, ...serviceAttrLayers]);

  const dimensionQuestions: RequestQuestion[] = selectedServices.map((service) => ({
    key: `${service.slug}_quantity`,
    label: service.dimension_label ?? service.name,
    type: 'number',
    required: true,
    applies_to: 'need',
    unit: service.unit_label,
    sort: service.sort,
    scope: 'service',
    scopeSlug: service.slug,
    validation: {
      min: service.min_value,
      max: service.max_value,
    },
  }));

  const attributeQuestions: RequestQuestion[] = merged.map((attr) => {
    const fromService = selectedServices.find((s) =>
      scopedAttributes(category as CatalogVersionSnapshot, 'service', s.slug).some(
        (a) => a.key === attr.key,
      ),
    );
    const fromType = category.types.some((t) => t.slug === typeSlug)
      ? scopedAttributes(category as CatalogVersionSnapshot, 'type', typeSlug).some(
          (a) => a.key === attr.key,
        )
      : false;

    let scope: 'category' | 'type' | 'service' = 'category';
    let scopeSlug = category.category_slug;
    if (fromService) {
      scope = 'service';
      scopeSlug = fromService.slug;
    } else if (fromType) {
      scope = 'type';
      scopeSlug = typeSlug;
    }

    return { ...attr, scope, scopeSlug };
  });

  const allQuestions = [...dimensionQuestions, ...attributeQuestions].sort(
    (a, b) => a.sort - b.sort || a.label.localeCompare(b.label),
  );

  return { dimensionQuestions, attributeQuestions, allQuestions };
}
'use client';

import { useMemo } from 'react';
import { cn } from '@askalert/ui';
import { DEFAULT_MAX_VENDOR_SERVICES } from '../../lib/vendor/schemas';
import { countSelectedServices, resolveTreeForCategory } from '../../lib/vendor/vendor-catalog';
import { useVendorStore } from '../../lib/vendor/vendor-store';

export function ServicesStep({ maxServices = DEFAULT_MAX_VENDOR_SERVICES }: { maxServices?: number }) {
  const { draft, updateDraft } = useVendorStore();
  const totalSelected = useMemo(
    () => countSelectedServices(draft),
    [draft.serviceSlugsByCategory],
  );

  return (
    <div className="space-y-5">
      <p className="text-xs font-semibold text-muted-foreground">
        {totalSelected} of {maxServices} services selected on your plan.
      </p>
      {draft.categorySlugs.map((categorySlug) => {
        const tree = resolveTreeForCategory(categorySlug);
        if (!tree) {
          return null;
        }
        const typeSlugs = new Set(draft.typeSlugsByCategory[categorySlug] ?? []);
        const selected = draft.serviceSlugsByCategory[categorySlug] ?? [];
        const services = tree.types
          .filter((type) => typeSlugs.has(type.slug))
          .flatMap((type) => type.services);

        const uniqueBySlug = new Map(services.map((service) => [service.slug, service]));

        return (
          <div
            key={categorySlug}
            className="rounded-2xl border border-border/70 bg-card-muted/40 p-4"
          >
            <p className="text-sm font-extrabold text-foreground">{tree.categoryName}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Services available for your selected types.
            </p>
            <div className="mt-3 space-y-2">
              {[...uniqueBySlug.values()].map((service) => {
                const on = selected.includes(service.slug);
                const atCap = !on && totalSelected >= maxServices;
                return (
                  <button
                    key={service.slug}
                    type="button"
                    disabled={atCap}
                    className={cn(
                      'flex w-full min-h-11 flex-col rounded-2xl border px-4 py-3 text-left transition',
                      on
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-border bg-card',
                      atCap && 'opacity-50',
                    )}
                    onClick={() => {
                      const next = on
                        ? selected.filter((slug) => slug !== service.slug)
                        : [...selected, service.slug];
                      updateDraft({
                        serviceSlugsByCategory: {
                          ...draft.serviceSlugsByCategory,
                          [categorySlug]: next,
                        },
                      });
                    }}
                  >
                    <span className="text-sm font-extrabold text-foreground">{service.name}</span>
                    <span className="mt-0.5 text-xs capitalize text-muted-foreground">
                      {service.pricing_model.replace('_', ' ')}
                      {service.regulated ? ' · regulated' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
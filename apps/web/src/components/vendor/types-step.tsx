'use client';

import { cn } from '@askalert/ui';
import { resolveTreeForCategory } from '../../lib/vendor/vendor-catalog';
import { useVendorStore } from '../../lib/vendor/vendor-store';

export function TypesStep() {
  const { draft, updateDraft } = useVendorStore();

  return (
    <div className="space-y-5">
      {draft.categorySlugs.map((categorySlug) => {
        const tree = resolveTreeForCategory(categorySlug);
        if (!tree) {
          return null;
        }
        const selected = draft.typeSlugsByCategory[categorySlug] ?? [];
        return (
          <div
            key={categorySlug}
            className="rounded-2xl border border-border/70 bg-card-muted/40 p-4"
          >
            <p className="text-sm font-extrabold text-foreground">{tree.categoryName}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick the {tree.typeLabel.toLowerCase()} you handle.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tree.types.map((type) => {
                const on = selected.includes(type.slug);
                return (
                  <button
                    key={type.slug}
                    type="button"
                    className={cn(
                      'min-h-11 rounded-2xl border px-4 text-sm font-bold transition',
                      on
                        ? 'border-orange-500 bg-orange-500/10 text-navy-950'
                        : 'border-border bg-card text-muted-foreground',
                    )}
                    onClick={() => {
                      const next = on
                        ? selected.filter((slug) => slug !== type.slug)
                        : [...selected, type.slug];
                      updateDraft({
                        typeSlugsByCategory: {
                          ...draft.typeSlugsByCategory,
                          [categorySlug]: next,
                        },
                      });
                    }}
                  >
                    {type.name}
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
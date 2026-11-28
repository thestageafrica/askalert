'use client';

import { Button, Input } from '@askalert/ui';
import { formatNairaInput, parseNairaInput } from '@askalert/payments';
import { useCategories } from '../../../lib/use-categories';
import { useVendorStore } from '../../../lib/vendor/vendor-store';
import type { RateCard } from '../../../lib/vendor/types';

export default function VendorRateCardsPage() {
  const { draft, upsertRateCard } = useVendorStore();
  const { categories } = useCategories();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Rate cards</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Starting prices seed instant quotes in the leads inbox.
        </p>
      </div>
      {draft.categorySlugs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Pick categories in{' '}
          <a href="/vendor/onboarding/" className="font-bold text-orange-600">
            onboarding
          </a>{' '}
          first.
        </p>
      ) : (
        draft.categorySlugs.map((slug) => {
          const category = categories.find((item) => item.slug === slug);
          const card =
            (draft.rateCards ?? []).find((item) => item.categorySlug === slug) ??
            ({
              categorySlug: slug,
              startingPriceMinor: 50_000_00,
              minPriceMinor: 30_000_00,
              maxPriceMinor: 120_000_00,
              unit: 'job',
              notes: '',
            } satisfies RateCard);
          const setCard = (patch: Partial<RateCard>) => upsertRateCard({ ...card, ...patch });
          return (
            <div key={slug} className="rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm">
              <p className="text-sm font-extrabold">{category?.name ?? slug}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Input
                  label="Starting (₦)"
                  value={formatNairaInput(card.startingPriceMinor)}
                  onChange={(event) =>
                    setCard({ startingPriceMinor: parseNairaInput(event.target.value) || 0 })
                  }
                />
                <Input
                  label="Unit"
                  value={card.unit}
                  onChange={(event) => setCard({ unit: event.target.value })}
                />
                <Input
                  label="Min (₦)"
                  value={formatNairaInput(card.minPriceMinor)}
                  onChange={(event) =>
                    setCard({ minPriceMinor: parseNairaInput(event.target.value) || 0 })
                  }
                />
                <Input
                  label="Max (₦)"
                  value={formatNairaInput(card.maxPriceMinor)}
                  onChange={(event) =>
                    setCard({ maxPriceMinor: parseNairaInput(event.target.value) || 0 })
                  }
                />
              </div>
              <Input
                className="mt-3"
                label="Notes"
                value={card.notes}
                onChange={(event) => setCard({ notes: event.target.value })}
              />
            </div>
          );
        })
      )}
      <Button href="/vendor/" variant="secondary">
        Back to dashboard
      </Button>
    </div>
  );
}

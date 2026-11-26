'use client';

import { areaDisplayName } from '@askalert/db';
import { Button } from '@askalert/ui';
import { createMoney, formatNaira } from '@askalert/payments';
import { useVendorStore } from '../../../lib/vendor/vendor-store';
import { useCategories } from '../../../lib/use-categories';

export default function VendorProfilePreviewPage() {
  const { draft } = useVendorStore();
  const { categories } = useCategories();
  const areaNames = draft.areaSlugs.map((slug) => areaDisplayName(slug)).join(', ');

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Public preview</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
        {draft.displayName || 'Your vendor name'}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {draft.entityType === 'business' && draft.businessName
          ? draft.businessName
          : 'Individual vendor'}{' '}
        · Lagos Nigeria
      </p>

      <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm">
        <div className="bg-gradient-to-r from-navy-950 to-navy-900 px-5 py-6 text-surface">
          <p className="text-sm text-surface/70">Verification</p>
          <p className="mt-1 text-lg font-extrabold capitalize">
            {draft.verificationTiers.join(' · ')}
          </p>
          <p className="mt-3 text-xs uppercase tracking-wide text-orange-400">
            Status · {draft.status.replace('_', ' ')}
          </p>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Categories
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {draft.categorySlugs
                .map((slug) => categories.find((item) => item.slug === slug)?.name ?? slug)
                .join(', ') || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Service areas
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">{areaNames || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              From
            </p>
            <ul className="mt-2 space-y-2">
              {draft.rateCards.map((card) => (
                <li
                  key={card.categorySlug}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-surface-subtle px-3 py-2 text-sm"
                >
                  <span className="font-semibold">{card.categorySlug}</span>
                  <span>
                    {formatNaira(createMoney(card.startingPriceMinor))} / {card.unit}
                  </span>
                </li>
              ))}
              {draft.rateCards.length === 0 ? (
                <li className="text-sm text-muted-foreground">No rate cards yet.</li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>

      <Button href="/vendor/" className="mt-6" variant="secondary">
        Back to dashboard
      </Button>
    </div>
  );
}

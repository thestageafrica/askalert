'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { computeQuote, dimensionLabel } from '@askalert/catalog';
import { Button, cn } from '@askalert/ui';
import { formatKoboNGN } from '../../../lib/vendor/format-money';
import { ServiceRateCardEditor } from '../../../components/vendor/service-rate-card-editor';
import {
  findCatalogService,
  flattenSelectedServices,
  previewQuantityForDimension,
} from '../../../lib/vendor/vendor-catalog';
import { useVendorStore } from '../../../lib/vendor/vendor-store';
import type { ServiceRateCard } from '../../../lib/vendor/types';

export function MyServicesView() {
  const { draft, ready, upsertServiceRateCard, setServiceRateCardStatus } = useVendorStore();
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const rows = useMemo(() => flattenSelectedServices(draft), [draft]);

  if (!ready) {
    return <div className="h-48 animate-pulse rounded-2xl bg-card-muted" aria-busy="true" />;
  }

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-border/60 bg-card p-6 shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight">My services</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Finish{' '}
          <Link href="/vendor/onboarding/" className="font-bold text-orange-600">
            onboarding
          </Link>{' '}
          to list services and prices.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24 lg:pb-8">
      <MyServicesHeader
        count={rows.length}
        active={draft.serviceRateCards.filter((c) => c.status === 'active').length}
      />

      <ul className="space-y-4">
        {rows.map((row) => {
          const key = `${row.categorySlug}:${row.serviceSlug}`;
          const card = draft.serviceRateCards.find(
            (item) => item.categorySlug === row.categorySlug && item.serviceSlug === row.serviceSlug,
          );
          const editing = editingKey === key;

          return (
            <li
              key={key}
              className="rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {row.categorySlug}
                  </p>
                  <h2 className="text-lg font-extrabold text-foreground">{row.service.name}</h2>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">
                    {row.service.pricing_model.replace('_', ' ')} ·{' '}
                    <span
                      className={cn(
                        card?.status === 'active'
                          ? 'text-orange-700'
                          : card?.status === 'paused'
                            ? 'text-muted-foreground'
                            : 'text-danger',
                      )}
                    >
                      {card?.status ?? 'missing rates'}
                    </span>
                  </p>
                </div>
                <ServiceActions
                  card={card}
                  onEdit={() => setEditingKey(editing ? null : key)}
                  editing={editing}
                  onPause={() =>
                    setServiceRateCardStatus(row.categorySlug, row.serviceSlug, 'paused')
                  }
                  onResume={() =>
                    setServiceRateCardStatus(row.categorySlug, row.serviceSlug, 'active')
                  }
                />
              </div>

              {card ? <QuoteChip card={card} serviceSlug={row.serviceSlug} categorySlug={row.categorySlug} /> : null}

              {editing && card ? (
                <ServiceEditPanel
                  card={card}
                  onDone={(next: ServiceRateCard) => {
                    upsertServiceRateCard(next);
                    setEditingKey(null);
                  }}
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      <Button href="/vendor/" variant="secondary" className="min-h-11">
        Back to dashboard
      </Button>
    </div>
  );
}

function MyServicesHeader({ count, active }: { count: number; active: number }) {
  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground">My services</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {active} active · {count} listed. Edit rates or pause a service when you are full.
      </p>
    </div>
  );
}

function QuoteChip({
  card,
  categorySlug,
  serviceSlug,
}: {
  card: ServiceRateCard;
  categorySlug: string;
  serviceSlug: string;
}) {
  const catalog = findCatalogService(categorySlug, serviceSlug);
  if (!catalog || catalog.pricing_model === 'quote_only') {
    return (
      <p className="mt-3 text-xs font-semibold text-muted-foreground">Custom quotes in chat</p>
    );
  }
  const qty = previewQuantityForDimension(catalog.dimension);
  const packages =
    card.packages.length > 0
      ? card.packages.map((pkg) => ({
          slug: pkg.slug,
          name: pkg.name,
          priceMinor: pkg.priceMinor,
          currency: 'NGN' as const,
          inclusions: pkg.inclusions,
        }))
      : catalog.packages;

  const result = computeQuote(
    {
      service: {
        slug: catalog.slug,
        pricing_model: catalog.pricing_model,
        dimension: catalog.dimension,
        min_value: catalog.min_value,
        max_value: catalog.max_value,
        packages,
      },
      rates: card.bands.length
        ? card.bands
        : card.priceMinor
          ? [
              {
                dimMin: catalog.min_value ?? 1,
                dimMax: catalog.max_value ?? qty,
                basis: 'per_unit' as const,
                priceMinor: card.priceMinor,
                currency: 'NGN' as const,
              },
            ]
          : [],
      minChargeMinor: card.minChargeMinor,
    },
    {
      serviceSlug: catalog.slug,
      quantity: qty,
      packageSlug: catalog.pricing_model === 'package' ? card.packages[0]?.slug : undefined,
    },
  );

  return (
    <p className="mt-3 rounded-2xl border border-border/60 bg-card-muted px-3 py-2 text-xs font-semibold text-navy-950">
      Preview ({qty} {dimensionLabel(catalog.dimension).toLowerCase()}):{' '}
      {result.customQuoteNeeded
        ? 'Custom quote'
        : formatKoboNGN(result.amountMinor)}
    </p>
  );
}

function ServiceActions({
  card,
  editing,
  onEdit,
  onPause,
  onResume,
}: {
  card: ServiceRateCard | undefined;
  editing: boolean;
  onEdit: () => void;
  onPause: () => void;
  onResume: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {card ? (
        <Button type="button" variant="secondary" className="min-h-11" onClick={onEdit}>
          {editing ? 'Close' : 'Edit'}
        </Button>
      ) : null}
      {card?.status === 'active' ? (
        <Button type="button" variant="ghost" className="min-h-11" onClick={onPause}>
          Pause
        </Button>
      ) : null}
      {card?.status === 'paused' ? (
        <Button type="button" className="min-h-11" onClick={onResume}>
          Resume
        </Button>
      ) : null}
    </div>
  );
}

function ServiceEditPanel({
  card,
  onDone,
}: {
  card: ServiceRateCard;
  onDone: (card: ServiceRateCard) => void;
}) {
  const [local, setLocal] = useState(card);
  useEffect(() => {
    setLocal(card);
  }, [card]);

  return (
    <div className="mt-4">
      <ServiceRateCardEditor card={local} compact onChange={setLocal} />
      <Button
        type="button"
        className="mt-4 min-h-11 w-full"
        onClick={() => onDone({ ...local, status: card.status })}
      >
        Save changes
      </Button>
    </div>
  );
}
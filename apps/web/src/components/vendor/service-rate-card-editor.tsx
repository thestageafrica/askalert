'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  computeQuote,
  dimensionLabel,
  validateRateCard,
  type PricingModel,
} from '@askalert/catalog';
import { Button, Input, cn } from '@askalert/ui';
import { formatNairaInput, parseNairaInput } from '@askalert/payments';
import { formatKoboNGN } from '../../lib/vendor/format-money';
import type { ServiceRateCard } from '../../lib/vendor/types';
import {
  createServiceRateCardFromSeed,
  findCatalogService,
  previewQuantityForDimension,
  resolveTreeForCategory,
} from '../../lib/vendor/vendor-catalog';

type Props = {
  card: ServiceRateCard;
  onChange: (card: ServiceRateCard) => void;
  compact?: boolean;
};

export function ServiceRateCardEditor({ card, onChange, compact = false }: Props) {
  const [pctAdjust, setPctAdjust] = useState('');
  const [validationHint, setValidationHint] = useState<string | null>(null);

  const catalogService = useMemo(
    () => findCatalogService(card.categorySlug, card.serviceSlug),
    [card.categorySlug, card.serviceSlug],
  );

  const typeOptions = useMemo(() => {
    const tree = resolveTreeForCategory(card.categorySlug);
    const picked = tree?.types.filter((type) =>
      (type.services.some((service) => service.slug === card.serviceSlug)),
    ) ?? [];
    return picked;
  }, [card.categorySlug, card.serviceSlug]);

  const previewQty = catalogService
    ? previewQuantityForDimension(catalogService.dimension)
    : 1;

  // Clamp rows that sit past the service max (e.g. after "Add band" past 250 guests).
  useEffect(() => {
    if (!catalogService || catalogService.max_value == null || catalogService.pricing_model !== 'banded') {
      return;
    }
    const max = catalogService.max_value;
    const unit = dimensionLabel(catalogService.dimension);
    let changed = false;
    const nextBands = card.bands.flatMap((band) => {
      if (band.dimMin > max) {
        changed = true;
        return [];
      }
      if (band.dimMax > max) {
        changed = true;
        return [{ ...band, dimMax: max }];
      }
      return [band];
    });
    if (!changed) {
      return;
    }
    onChange({ ...card, bands: nextBands, updatedAt: new Date().toISOString() });
    setValidationHint(
      `A price row went past the maximum of ${max} ${unit}. We trimmed it so you can continue.`,
    );
    // Only when this service's bands are out of range.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogService?.slug, catalogService?.max_value, card.bands]);

  const quotePreview = useMemo(() => {
    if (!catalogService) {
      return null;
    }
    const model = catalogService.pricing_model as PricingModel;
    if (model === 'quote_only') {
      return { text: 'Buyers will request a custom quote.', custom: true };
    }

    const packagesForQuote =
      card.packages.length > 0 ? card.packages.map((pkg) => ({
        slug: pkg.slug,
        name: pkg.name,
        priceMinor: pkg.priceMinor,
        currency: 'NGN' as const,
        inclusions: pkg.inclusions,
      })) : catalogService.packages;

    const result = computeQuote(
      {
        service: {
          slug: catalogService.slug,
          pricing_model: catalogService.pricing_model,
          dimension: catalogService.dimension,
          min_value: catalogService.min_value,
          max_value: catalogService.max_value,
          packages: packagesForQuote,
        },
        rates: card.bands.length
          ? card.bands
          : card.priceMinor
            ? [
                {
                  dimMin: catalogService.min_value ?? 1,
                  dimMax: catalogService.max_value ?? previewQty,
                  basis: 'per_unit' as const,
                  priceMinor: card.priceMinor,
                  currency: 'NGN' as const,
                },
              ]
            : [],
        minChargeMinor: card.minChargeMinor,
        addons: card.addons,
      },
      {
        serviceSlug: catalogService.slug,
        quantity: previewQty,
        packageSlug: model === 'package' ? card.packages[0]?.slug : undefined,
      },
    );

    if (result.customQuoteNeeded) {
      return {
        text: card.allowCustomQuoteLarger
          ? 'Custom quote needed for this size.'
          : 'Outside your listed bands — enable custom quotes to accept larger jobs.',
        custom: true,
      };
    }
    return {
      text: `For ${previewQty} ${dimensionLabel(catalogService.dimension).toLowerCase()} you would quote ${formatKoboNGN(result.amountMinor)}.`,
      custom: false,
    };
  }, [card, catalogService, previewQty]);

  if (!catalogService) {
    return <p className="text-sm text-muted-foreground">Service not found in catalog.</p>;
  }

  const model = catalogService.pricing_model as PricingModel;
  const canEditBands = model === 'banded' && catalogService.allow_custom_bands;

  const applyPct = () => {
    const pct = Number(pctAdjust);
    if (!Number.isFinite(pct) || pct === 0) {
      return;
    }
    const factor = 1 + pct / 100;
    const round = (value: number) => Math.max(100, Math.round(value * factor));
    onChange({
      ...card,
      bands: card.bands.map((band) => ({ ...band, priceMinor: round(band.priceMinor) })),
      priceMinor: card.priceMinor !== undefined ? round(card.priceMinor) : undefined,
      packages: card.packages.map((pkg) => ({ ...pkg, priceMinor: round(pkg.priceMinor) })),
    });
    setPctAdjust('');
  };

  const resetTemplate = () => {
    onChange(createServiceRateCardFromSeed(card.categorySlug, catalogService));
    setValidationHint(null);
  };

  const validateBands = (next: ServiceRateCard) => {
    if (model !== 'banded') {
      setValidationHint(null);
      return;
    }
    const check = validateRateCard(next.bands, {
      minValue: catalogService.min_value,
      maxValue: catalogService.max_value,
      minChargeMinor: next.minChargeMinor,
    });
    setValidationHint(check.ok ? (check.warnings[0] ?? null) : (check.errors[0] ?? null));
  };

  const setAppliesTo = (slug: string) => {
    if (card.appliesToTypeSlugs === 'all') {
      onChange({ ...card, appliesToTypeSlugs: [slug] });
      return;
    }
    const on = card.appliesToTypeSlugs.includes(slug);
    const next = on
      ? card.appliesToTypeSlugs.filter((item) => item !== slug)
      : [...card.appliesToTypeSlugs, slug];
    onChange({ ...card, appliesToTypeSlugs: next.length ? next : 'all' });
  };

  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-extrabold text-foreground">{catalogService.name}</p>
          <p className="text-xs capitalize text-muted-foreground">{model.replace('_', ' ')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" className="min-h-11 text-xs" onClick={resetTemplate}>
            Reset to template
          </Button>
        </div>
      </div>

      <AppliesToPicker
        appliesTo={card.appliesToTypeSlugs}
        typeOptions={typeOptions}
        setAll={() => onChange({ ...card, appliesToTypeSlugs: 'all' })}
        toggle={setAppliesTo}
      />

      {model === 'banded' ? (
        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-card-muted text-xs font-bold uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">From</th>
                <th className="px-3 py-2">To</th>
                <th className="px-3 py-2">Price (₦)</th>
                <th className="px-3 py-2">Basis</th>
                {canEditBands ? <th className="px-3 py-2" /> : null}
              </tr>
            </thead>
            <tbody>
              {card.bands.map((band, index) => (
                <tr key={`${band.dimMin}-${band.dimMax}-${index}`} className="border-t border-border/50">
                  <td className="px-3 py-2">
                    <input
                      className="w-16 min-h-10 rounded-lg border border-border bg-card px-2 text-sm"
                      inputMode="numeric"
                      value={band.dimMin}
                      disabled={!canEditBands}
                      onChange={(event) => {
                        const next = {
                          ...card,
                          bands: card.bands.map((row, i) =>
                            i === index ? { ...row, dimMin: Number(event.target.value) || 0 } : row,
                          ),
                        };
                        onChange(next);
                        validateBands(next);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-16 min-h-10 rounded-lg border border-border bg-card px-2 text-sm"
                      inputMode="numeric"
                      value={band.dimMax}
                      disabled={!canEditBands}
                      onChange={(event) => {
                        const next = {
                          ...card,
                          bands: card.bands.map((row, i) =>
                            i === index ? { ...row, dimMax: Number(event.target.value) || 0 } : row,
                          ),
                        };
                        onChange(next);
                        validateBands(next);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="min-w-[6.5rem] min-h-10 rounded-lg border border-border bg-card px-2 text-sm"
                      value={formatNairaInput(band.priceMinor)}
                      onChange={(event) => {
                        const next = {
                          ...card,
                          bands: card.bands.map((row, i) =>
                            i === index
                              ? {
                                  ...row,
                                  priceMinor: parseNairaInput(event.target.value) || 0,
                                }
                              : row,
                          ),
                        };
                        onChange(next);
                        validateBands(next);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="min-h-10 rounded-lg border border-border bg-card px-2 text-sm"
                      value={band.basis}
                      onChange={(event) => {
                        const basis = event.target.value as 'per_unit' | 'total';
                        onChange({
                          ...card,
                          bands: card.bands.map((row, i) => (i === index ? { ...row, basis } : row)),
                        });
                      }}
                    >
                      <option value="per_unit">Per unit</option>
                      <option value="total">Total</option>
                    </select>
                  </td>
                  {canEditBands ? (
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="text-xs font-bold text-danger"
                        onClick={() => {
                          const next = {
                            ...card,
                            bands: card.bands.filter((_, i) => i !== index),
                          };
                          onChange(next);
                          validateBands(next);
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
          {canEditBands ? (
            <div className="border-t border-border/50 p-3">
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 w-full sm:w-auto"
                disabled={
                  catalogService.max_value != null &&
                  (card.bands[card.bands.length - 1]?.dimMax ?? 0) >= catalogService.max_value
                }
                onClick={() => {
                  const last = card.bands[card.bands.length - 1];
                  const serviceMax = catalogService.max_value;
                  const dimMin = last ? last.dimMax + 1 : catalogService.min_value ?? 1;
                  if (serviceMax != null && dimMin > serviceMax) {
                    setValidationHint(
                      `This service only goes up to ${serviceMax} ${dimensionLabel(catalogService.dimension)}. Remove or shorten the last row first.`,
                    );
                    return;
                  }
                  const rawMax = dimMin + 10;
                  const dimMax =
                    serviceMax != null ? Math.min(rawMax, serviceMax) : rawMax;
                  const next = {
                    ...card,
                    bands: [
                      ...card.bands,
                      {
                        dimMin,
                        dimMax,
                        basis: 'per_unit' as const,
                        priceMinor: last?.priceMinor ?? 100_00,
                        currency: 'NGN' as const,
                      },
                    ],
                  };
                  onChange(next);
                  validateBands(next);
                }}
              >
                Add band
              </Button>
              {catalogService.max_value != null &&
              (card.bands[card.bands.length - 1]?.dimMax ?? 0) >= catalogService.max_value ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Already covers up to the maximum (
                  {catalogService.max_value} {dimensionLabel(catalogService.dimension)}).
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {model === 'per_unit' || model === 'flat' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={model === 'flat' ? 'Flat price (₦)' : 'Price per unit (₦)'}
            value={formatNairaInput(card.priceMinor ?? 0)}
            onChange={(event) =>
              onChange({ ...card, priceMinor: parseNairaInput(event.target.value) || 0 })
            }
          />
          <Input
            label="Minimum charge (₦)"
            value={formatNairaInput(card.minChargeMinor ?? 0)}
            onChange={(event) =>
              onChange({
                ...card,
                minChargeMinor: parseNairaInput(event.target.value) || undefined,
              })
            }
          />
        </div>
      ) : null}

      {model === 'package' ? (
        <div className="space-y-3">
          {card.packages.map((pkg, index) => (
            <div key={pkg.slug} className="rounded-2xl border border-border/60 p-3">
              <Input
                label="Package name"
                value={pkg.name}
                onChange={(event) =>
                  onChange({
                    ...card,
                    packages: card.packages.map((row, i) =>
                      i === index ? { ...row, name: event.target.value } : row,
                    ),
                  })
                }
              />
              <Input
                className="mt-2"
                label="Price (₦)"
                value={formatNairaInput(pkg.priceMinor)}
                onChange={(event) =>
                  onChange({
                    ...card,
                    packages: card.packages.map((row, i) =>
                      i === index
                        ? { ...row, priceMinor: parseNairaInput(event.target.value) || 0 }
                        : row,
                    ),
                  })
                }
              />
            </div>
          ))}
        </div>
      ) : null}

      {model === 'quote_only' ? (
        <p className="rounded-2xl border border-orange-500/25 bg-orange-500/10 px-3 py-3 text-sm font-medium text-navy-950">
          This service is quote-only. Buyers send details; you reply with a price in chat.
        </p>
      ) : null}

      {model === 'banded' ? (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-border/60 px-3 py-2">
          <input
            type="checkbox"
            checked={card.allowCustomQuoteLarger}
            onChange={(event) =>
              onChange({ ...card, allowCustomQuoteLarger: event.target.checked })
            }
          />
          <span className="text-sm font-semibold text-foreground">
            Accept custom quotes above my largest band
          </span>
        </label>
      ) : null}

      <PercentAdjustRow pctAdjust={pctAdjust} setPctAdjust={setPctAdjust} onApply={applyPct} />

      {quotePreview ? (
        <p
          className={cn(
            'rounded-2xl border px-3 py-3 text-sm font-semibold',
            quotePreview.custom
              ? 'border-border/70 bg-card-muted text-muted-foreground'
              : 'border-orange-500/25 bg-orange-500/10 text-navy-950',
          )}
        >
          {quotePreview.text}
        </p>
      ) : null}

      {validationHint ? (
        <p className="text-xs font-medium text-muted-foreground">{validationHint}</p>
      ) : null}

      <Input
        label="Notes for buyers"
        value={card.notes}
        onChange={(event) => onChange({ ...card, notes: event.target.value })}
      />
    </div>
  );
}

function AppliesToPicker({
  appliesTo,
  typeOptions,
  setAll,
  toggle,
}: {
  appliesTo: ServiceRateCard['appliesToTypeSlugs'];
  typeOptions: Array<{ slug: string; name: string }>;
  setAll: () => void;
  toggle: (slug: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/60 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Applies to</p>
      <ToggleChip
        label="All types"
        on={appliesTo === 'all'}
        onClick={setAll}
        className="mt-2"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {typeOptions.map((type) => {
          const on =
            appliesTo === 'all' ? false : appliesTo.includes(type.slug);
          return (
            <ToggleChip
              key={type.slug}
              label={type.name}
              on={on}
              onClick={() => toggle(type.slug)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ToggleChip({
  label,
  on,
  onClick,
  className,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        'min-h-11 rounded-2xl border px-3 text-xs font-bold',
        on ? 'border-orange-500 bg-orange-500/10 text-navy-950' : 'border-border bg-card',
        className,
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function PercentAdjustRow({
  pctAdjust,
  setPctAdjust,
  onApply,
}: {
  pctAdjust: string;
  setPctAdjust: (value: string) => void;
  onApply: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Input
        label="Adjust all prices by %"
        inputMode="decimal"
        placeholder="e.g. 10 or -5"
        value={pctAdjust}
        onChange={(event) => setPctAdjust(event.target.value)}
        className="max-w-[12rem]"
      />
      <Button type="button" className="min-h-11" onClick={onApply}>
        Apply
      </Button>
    </div>
  );
}
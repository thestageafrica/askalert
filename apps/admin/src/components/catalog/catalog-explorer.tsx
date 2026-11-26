'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  buildRequestSchema,
  buildSnapshotFromSeed,
  computeQuote,
  flattenSnapshotAliases,
  listCatalogSeeds,
  matchAlias,
  resolveCatalogTree,
  validateRateCard,
  type CatalogCategorySeed,
  type ServiceDefinition,
} from '@askalert/catalog';
import { Button, Input, cn } from '@askalert/ui';
import { formatNairaFromKobo } from '../../lib/format-naira';

type Panel = 'browse' | 'detail';

function categoryIconLabel(slug: string): string {
  const map: Record<string, string> = {
    events: 'EV',
    shortlets: 'SH',
    security: 'SE',
    'car-hire': 'CH',
    'beauty-at-home': 'BE',
    'home-care': 'HC',
    'auto-services': 'AU',
    'professional-services': 'PR',
    tutors: 'TU',
  };
  return map[slug] ?? slug.slice(0, 2).toUpperCase();
}

function defaultPreviewQty(service: ServiceDefinition): number {
  if (service.default_bands[0]) {
    const band = service.default_bands[0];
    return Math.min(Math.max(band.dimMin, 1), band.dimMax);
  }
  return service.min_value ?? 1;
}

export function CatalogExplorer() {
  const seeds = useMemo(() => listCatalogSeeds(), []);
  const [categorySlug, setCategorySlug] = useState(seeds[0]?.category_slug ?? 'events');
  const [serviceSlug, setServiceSlug] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | 'all'>('all');
  const [mobilePanel, setMobilePanel] = useState<Panel>('browse');
  const [aliasQuery, setAliasQuery] = useState('');
  const [previewQty, setPreviewQty] = useState(120);

  const category = seeds.find((seed) => seed.category_slug === categorySlug) ?? seeds[0];
  const snapshot = useMemo(
    () => (category ? buildSnapshotFromSeed(category) : null),
    [category],
  );
  const tree = useMemo(
    () => (snapshot ? resolveCatalogTree(snapshot) : null),
    [snapshot],
  );

  const selectedService: ServiceDefinition | null =
    category?.services.find((service) => service.slug === serviceSlug) ??
    category?.services[0] ??
    null;

  useEffect(() => {
    if (selectedService) {
      setPreviewQty(defaultPreviewQty(selectedService));
    }
  }, [selectedService?.slug]);

  const filteredServices = useMemo(() => {
    if (!category) return [];
    if (typeFilter === 'all') return category.services;
    return category.services.filter((service) => service.type_slugs.includes(typeFilter));
  }, [category, typeFilter]);

  const aliasHits = useMemo(() => {
    if (!snapshot || aliasQuery.trim().length < 2) return [];
    const aliases = flattenSnapshotAliases(snapshot.aliases, snapshot.category_slug);
    const hit = matchAlias(aliasQuery, aliases);
    return hit ? [hit] : [];
  }, [aliasQuery, snapshot]);

  const rateValidation = useMemo(() => {
    if (!selectedService || selectedService.default_bands.length === 0) return null;
    return validateRateCard(selectedService.default_bands, {
      minValue: selectedService.min_value,
      maxValue: selectedService.max_value,
    });
  }, [selectedService]);

  const quotePreview = useMemo(() => {
    if (!selectedService || selectedService.pricing_model === 'quote_only') {
      return null;
    }
    if (
      selectedService.pricing_model === 'banded' ||
      selectedService.pricing_model === 'per_unit' ||
      selectedService.pricing_model === 'flat'
    ) {
      return computeQuote(
        {
          service: selectedService,
          rates: selectedService.default_bands,
        },
        {
          serviceSlug: selectedService.slug,
          quantity: previewQty,
        },
      );
    }
    return null;
  }, [previewQty, selectedService]);

  const requestPreview = useMemo(() => {
    if (!snapshot || !selectedService) return null;
    const typeSlug =
      typeFilter === 'all' ? snapshot.types[0]?.slug : typeFilter;
    if (!typeSlug) return null;
    return buildRequestSchema(snapshot, typeSlug, [selectedService.slug]);
  }, [selectedService, snapshot, typeFilter]);

  if (!category || !tree) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        No catalog seeds found.
      </p>
    );
  }

  const selectCategory = (slug: string) => {
    setCategorySlug(slug);
    setTypeFilter('all');
    setAliasQuery('');
    const next = seeds.find((seed) => seed.category_slug === slug);
    setServiceSlug(next?.services[0]?.slug ?? null);
    setMobilePanel('browse');
  };

  const selectService = (slug: string) => {
    setServiceSlug(slug);
    setMobilePanel('detail');
  };

  const applyAliasHit = (entity: string, entityId: string) => {
    const slug = entityId.includes(':') ? entityId.split(':').slice(1).join(':') : entityId;
    if (entity === 'service') {
      selectService(slug);
      setAliasQuery('');
      return;
    }
    if (entity === 'type') {
      setTypeFilter(slug);
      setAliasQuery('');
      setMobilePanel('browse');
    }
  };

  const typeNameBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const type of category.types) {
      map.set(type.slug, type.name);
    }
    return map;
  }, [category.types]);

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <header className="relative overflow-hidden rounded-[1.75rem] border border-border bg-navy-950 px-5 py-6 text-surface shadow-sm sm:px-7 sm:py-7">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_0%_0%,_var(--glow-orange-strong),_transparent_55%),radial-gradient(ellipse_50%_60%_at_100%_100%,_rgba(255,255,255,0.06),_transparent_50%)]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-400">
              Marketplace
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Service catalog
            </h1>
            <p className="mt-2 max-w-xl text-sm text-surface/70">
              Types, services, and pricing for Lekki. Seed data powers browse, alias match, and
              instant quote preview — design can restyle this later.
            </p>
          </div>
          <div className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-surface/15 bg-surface/10 px-3.5 py-2 text-xs font-semibold text-surface/80 backdrop-blur-sm">
            <span className="size-2 rounded-full bg-orange-500" aria-hidden />
            {seeds.length} categories · seed v1
          </div>
        </div>
      </header>

      {/* Mobile category strip */}
      <div className="lg:hidden">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {seeds.map((seed) => (
            <button
              key={seed.category_slug}
              type="button"
              onClick={() => selectCategory(seed.category_slug)}
              className={cn(
                'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition',
                seed.category_slug === categorySlug
                  ? 'border-orange-500 bg-orange-500 text-navy-900'
                  : 'border-border bg-card text-foreground',
              )}
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-navy-950 text-[10px] font-extrabold text-orange-400">
                {categoryIconLabel(seed.category_slug)}
              </span>
              {seed.category_name}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant={mobilePanel === 'browse' ? 'primary' : 'secondary'}
            className="min-h-11"
            onClick={() => setMobilePanel('browse')}
          >
            Browse
          </Button>
          <Button
            variant={mobilePanel === 'detail' ? 'primary' : 'secondary'}
            className="min-h-11"
            onClick={() => setMobilePanel('detail')}
            disabled={!selectedService}
          >
            Details
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)_24rem] lg:items-start">
        {/* Desktop category rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-1.5 rounded-[1.5rem] border border-border bg-card p-3 shadow-sm">
            <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-600">
              Categories
            </p>
            {seeds.map((seed) => (
              <CategoryRailButton
                key={seed.category_slug}
                seed={seed}
                active={seed.category_slug === categorySlug}
                onClick={() => selectCategory(seed.category_slug)}
              />
            ))}
          </div>
        </aside>

        {/* Browse column */}
        <section
          className={cn(
            'min-w-0 space-y-4',
            mobilePanel === 'detail' ? 'hidden lg:block' : 'block',
          )}
        >
          <div className="rounded-[1.5rem] border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">{category.category_name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {category.type_label} · {category.types.length} types ·{' '}
                  {category.services.length} services
                </p>
              </div>
              <Input
                label="Find alias"
                value={aliasQuery}
                placeholder="jollof, gele, owambe…"
                className="w-full sm:max-w-xs"
                onChange={(event) => setAliasQuery(event.target.value)}
              />
            </div>

            {aliasHits.length > 0 ? (
              <ul className="mt-3 space-y-1.5 rounded-2xl border border-orange-500/25 bg-orange-500/5 p-2">
                {aliasHits.map((hit) => (
                  <li key={`${hit.entityId}-${hit.alias}`}>
                    <button
                      type="button"
                      onClick={() => applyAliasHit(hit.entity, hit.entityId)}
                      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-orange-500/10"
                    >
                      <span>
                        <span className="font-semibold text-foreground">{hit.alias}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          → {hit.entity} · {hit.language}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-navy-950 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                        {Math.round(hit.confidence * 100)}%
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {category.type_label}
              </p>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="All types"
                  active={typeFilter === 'all'}
                  onClick={() => setTypeFilter('all')}
                />
                {category.types.map((type) => (
                  <FilterChip
                    key={type.slug}
                    label={type.name}
                    active={typeFilter === type.slug}
                    onClick={() => setTypeFilter(type.slug)}
                  />
                ))}
              </div>
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
              No services for this type. Try another filter.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredServices.map((service) => {
                const active = selectedService?.slug === service.slug;
                return (
                  <button
                    key={service.slug}
                    type="button"
                    onClick={() => selectService(service.slug)}
                    className={cn(
                      'min-h-[8rem] rounded-[1.35rem] border p-4 text-left transition',
                      active
                        ? 'border-orange-500 bg-orange-500/10 shadow-[0_10px_28px_var(--glow-orange)]'
                        : 'border-border bg-card hover:border-orange-500/40',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-extrabold text-foreground">{service.name}</h3>
                      {service.regulated ? (
                        <span className="rounded-full bg-navy-950 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-400">
                          Regulated
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-400">
                      {service.pricing_model.replace('_', ' ')} · {service.dimension}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {service.description ||
                        `${service.default_bands.length} default band${service.default_bands.length === 1 ? '' : 's'}`}
                    </p>
                    <p className="mt-3 line-clamp-1 text-[11px] text-muted-foreground">
                      {service.type_slugs
                        .map((slug) => typeNameBySlug.get(slug) ?? slug)
                        .join(' · ')}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Detail column */}
        <aside
          className={cn(
            'min-w-0',
            mobilePanel === 'browse' ? 'hidden lg:block' : 'block',
          )}
        >
          {selectedService ? (
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-[1.5rem] border border-border bg-navy-950 text-surface shadow-sm">
                <div className="bg-[radial-gradient(ellipse_80%_60%_at_10%_0%,_var(--glow-orange-strong),_transparent_55%)] p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-400">
                    Service detail
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                    {selectedService.name}
                  </h2>
                  <p className="mt-2 text-sm text-surface/70">
                    {selectedService.pricing_model.replace('_', ' ')} pricing · dimension{' '}
                    {selectedService.dimension}
                    {selectedService.min_value != null
                      ? ` · ${selectedService.min_value}–${selectedService.max_value ?? '∞'}`
                      : ''}
                  </p>
                </div>
                <div className="space-y-3 border-t border-surface/10 bg-card p-4 text-foreground">
                  {selectedService.default_bands.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-border">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-surface-subtle text-xs uppercase tracking-wide text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2 font-semibold">From</th>
                            <th className="px-3 py-2 font-semibold">To</th>
                            <th className="px-3 py-2 font-semibold">Price</th>
                            <th className="px-3 py-2 font-semibold">Basis</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedService.default_bands.map((band) => (
                            <tr
                              key={`${band.dimMin}-${band.dimMax}`}
                              className="border-t border-border"
                            >
                              <td className="px-3 py-2.5">{band.dimMin}</td>
                              <td className="px-3 py-2.5">{band.dimMax}</td>
                              <td className="px-3 py-2.5 font-semibold">
                                {formatNairaFromKobo(band.priceMinor)}
                              </td>
                              <td className="px-3 py-2.5 text-muted-foreground">
                                {band.basis === 'per_unit' ? 'Per unit' : 'Total'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {selectedService.pricing_model === 'quote_only'
                        ? 'Quote only — vendors price each request.'
                        : 'No default bands on this seed.'}
                    </p>
                  )}

                  {rateValidation && (!rateValidation.ok || rateValidation.warnings.length > 0) ? (
                    <div
                      className={cn(
                        'rounded-2xl border px-3 py-2.5 text-sm',
                        rateValidation.ok
                          ? 'border-warning/40 bg-warning/10'
                          : 'border-danger/40 bg-danger/10',
                      )}
                    >
                      <p className="font-semibold text-foreground">
                        {rateValidation.ok ? 'Rate card warnings' : 'Rate card issues'}
                      </p>
                      <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                        {[...rateValidation.errors, ...rateValidation.warnings].map((msg) => (
                          <li key={msg}>{msg}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {selectedService.regulated && selectedService.required_documents.length > 0 ? (
                    <div className="rounded-2xl border border-warning/40 bg-warning/10 px-3 py-2.5 text-sm">
                      <p className="font-semibold text-foreground">Documents required</p>
                      <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                        {selectedService.required_documents.map((doc) => (
                          <li key={doc}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {selectedService.aliases.length > 0 ? (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        Aliases
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {selectedService.aliases.map((alias) => (
                          <span
                            key={`${alias.language}-${alias.alias}`}
                            className="rounded-full border border-border bg-surface-subtle px-2.5 py-1 text-xs font-medium"
                          >
                            {alias.alias}
                            <span className="ml-1 text-muted-foreground">{alias.language}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {selectedService.pricing_model !== 'quote_only' &&
              selectedService.default_bands.length > 0 ? (
                <div className="rounded-[1.5rem] border border-border bg-card p-4 shadow-sm">
                  <h3 className="text-sm font-extrabold">Instant quote preview</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Example buyer quantity for {selectedService.dimension}.
                  </p>
                  <div className="mt-3">
                    <Input
                      label={`Quantity (${selectedService.dimension})`}
                      type="number"
                      min={selectedService.min_value ?? 1}
                      max={selectedService.max_value ?? 9999}
                      step={selectedService.step ?? 1}
                      value={previewQty}
                      onChange={(event) => setPreviewQty(Number(event.target.value) || 0)}
                    />
                  </div>
                  {quotePreview ? (
                    <div className="mt-4 rounded-2xl bg-navy-950 p-4 text-surface">
                      {quotePreview.customQuoteNeeded ? (
                        <p className="text-sm font-semibold text-orange-300">
                          Custom quote needed for this quantity.
                        </p>
                      ) : (
                        <>
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-orange-400">
                            Instant quote
                          </p>
                          <p className="mt-1 text-3xl font-extrabold tracking-tight">
                            {formatNairaFromKobo(quotePreview.amountMinor)}
                          </p>
                        </>
                      )}
                      <ul className="mt-3 space-y-1 text-sm text-surface/70">
                        {quotePreview.breakdown.map((line) => (
                          <li key={line.label} className="flex justify-between gap-3">
                            <span>{line.label}</span>
                            <span className="font-semibold text-surface">
                              {formatNairaFromKobo(line.amountMinor)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {requestPreview ? (
                <div className="rounded-[1.5rem] border border-border bg-card p-4 shadow-sm">
                  <h3 className="text-sm font-extrabold">Buyer questions (preview)</h3>
                  <ol className="mt-3 space-y-2">
                    {requestPreview.allQuestions.map((question, index) => (
                      <li
                        key={question.key}
                        className="flex gap-3 rounded-xl border border-border/80 bg-surface-subtle/60 px-3 py-2.5 text-sm"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-navy-950 text-[11px] font-bold text-orange-400">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{question.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {question.type}
                            {question.required ? ' · required' : ''} · from {question.scope}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              <Button
                variant="secondary"
                className="min-h-11 w-full lg:hidden"
                onClick={() => setMobilePanel('browse')}
              >
                Back to services
              </Button>
            </div>
          ) : (
            <p className="rounded-[1.5rem] border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
              Select a service to see pricing bands and quote preview.
            </p>
          )}
        </aside>
      </div>

      {/* Mobile sticky selected service bar */}
      {selectedService && mobilePanel === 'browse' ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobilePanel('detail')}
            className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl bg-navy-950 px-4 text-left text-surface"
          >
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-orange-400">
                Selected
              </span>
              <span className="block text-sm font-extrabold">{selectedService.name}</span>
            </span>
            <span className="text-xs font-semibold text-orange-400">Open →</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CategoryRailButton({
  seed,
  active,
  onClick,
}: {
  seed: CatalogCategorySeed;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold transition',
        active
          ? 'bg-orange-500 text-navy-900'
          : 'text-foreground hover:bg-surface-subtle',
      )}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold',
          active ? 'bg-navy-950 text-orange-400' : 'bg-navy-950/90 text-orange-400',
        )}
      >
        {categoryIconLabel(seed.category_slug)}
      </span>
      <span className="truncate">{seed.category_name}</span>
    </button>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-11 rounded-full border px-3.5 text-sm font-semibold transition',
        active
          ? 'border-navy-950 bg-navy-950 text-orange-400'
          : 'border-border bg-surface-subtle text-foreground hover:border-orange-500/50',
      )}
    >
      {label}
    </button>
  );
}

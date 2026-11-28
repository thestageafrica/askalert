'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  buildRequestSchema,
  buildSnapshotFromSeed,
  dimensionLabel,
  findCatalogSeedBySlug,
  listCatalogSeeds,
  resolveCatalogTree,
  type CatalogCategorySeed,
  type ResolvedCatalogTree,
} from '@askalert/catalog';
import { buildGeoLookup, findNode, listGeoSeedNodes, type LocationRule } from '@askalert/geo';
import { createMoney, formatNaira, formatNairaInput, parseNairaInput } from '@askalert/payments';
import { Button, Input, LocationSelect, cn } from '@askalert/ui';
import {
  BUYER_REQUEST_STEPS,
  clearBuyerDraft,
  emptyBuyerRequestDraft,
  nextBuyerStep,
  previousBuyerStep,
  readBuyerDraft,
  validateBuyerStep,
  writeBuyerDraft,
  type BuyerRequestDraft,
  type BuyerRequestStepId,
} from '../../lib/app/buyer-request';
import {
  buildDemoMatchVendors,
  matchBuyerRequest,
} from '../../lib/app/buyer-matching';
import { involvementOptions } from '../../lib/app/involvement';
import { useMockStore } from '../../lib/app/mock-store';
import { usePlanStore } from '../../lib/app/plan-store';
import { navigateStatic, requestHref } from '../../lib/app/static-nav';
import type { AppRequestPayload, InvolvementMode, Quote } from '../../lib/app/types';
import { useCategory } from '../../lib/use-categories';
import { AppHeader } from './app-header';
import { notifyFirstRequestCreated } from './push-prompt';

export function NewRequestFlow({ categorySlug }: { categorySlug: string }) {
  const { createRequest } = useMockStore();
  const { check, consume } = usePlanStore();
  const { category: engineCategory, loading: engineLoading } = useCategory(categorySlug);

  const catalogSeed = useMemo(
    () => findCatalogSeedBySlug(categorySlug) ?? null,
    [categorySlug],
  );
  const allSeeds = useMemo(() => listCatalogSeeds(), []);
  const geoNodes = useMemo(() => listGeoSeedNodes(), []);

  const tree = useMemo((): ResolvedCatalogTree | null => {
    if (!catalogSeed) {
      return null;
    }
    return resolveCatalogTree(buildSnapshotFromSeed(catalogSeed));
  }, [catalogSeed]);

  const snapshot = useMemo(
    () => (catalogSeed ? buildSnapshotFromSeed(catalogSeed) : null),
    [catalogSeed],
  );

  const [draft, setDraft] = useState<BuyerRequestDraft>(() =>
    emptyBuyerRequestDraft({
      categorySlug,
      catalogVersion: 1,
      currentStep: catalogSeed ? 'type' : 'category',
    }),
  );
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = readBuyerDraft(categorySlug);
    if (saved && saved.categorySlug === categorySlug) {
      setDraft({
        ...saved,
        catalogVersion: saved.catalogVersion || 1,
      });
    } else if (catalogSeed) {
      setDraft(
        emptyBuyerRequestDraft({
          categorySlug,
          catalogVersion: 1,
          currentStep: 'type',
        }),
      );
    }
    setReady(true);
  }, [categorySlug, catalogSeed]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    writeBuyerDraft(draft);
  }, [draft, ready]);

  const locationRule: LocationRule =
    (engineCategory as { location_rule?: LocationRule } | null)?.location_rule ?? 'specific';

  const requestSchema = useMemo(() => {
    if (!snapshot || !draft.typeSlug || draft.items.length === 0) {
      return null;
    }
    return buildRequestSchema(
      snapshot,
      draft.typeSlug,
      draft.items.map((item) => item.serviceSlug),
    );
  }, [snapshot, draft.typeSlug, draft.items]);

  const matchPreview = useMemo(() => {
    if (!tree || !draft.typeSlug || draft.items.length === 0 || !draft.locationSlug) {
      return null;
    }
    const services = draft.items
      .map((item) => tree.types.flatMap((type) => type.services).find((s) => s.slug === item.serviceSlug))
      .filter((service): service is NonNullable<typeof service> => Boolean(service));
    const vendors = buildDemoMatchVendors({
      categorySlug: draft.categorySlug,
      typeSlug: draft.typeSlug,
      items: draft.items,
      services,
      locationSlug: draft.locationSlug,
    });
    return matchBuyerRequest({
      draft,
      vendors,
      nodes: geoNodes,
    });
  }, [tree, draft, geoNodes]);

  const step = draft.currentStep;
  const stepNumber = BUYER_REQUEST_STEPS.indexOf(step) + 1;
  const progress = (stepNumber / BUYER_REQUEST_STEPS.length) * 100;

  const patchDraft = (patch: Partial<BuyerRequestDraft>) => {
    setDraft((current) => ({ ...current, ...patch, updatedAt: new Date().toISOString() }));
  };

  const goNext = () => {
    const message = validateBuyerStep(step, draft, {
      locationRequired: locationRule !== 'none',
    });
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    const next = nextBuyerStep(step);
    if (next) {
      patchDraft({ currentStep: next });
    }
  };

  const goBack = () => {
    setError(null);
    const prev = previousBuyerStep(step);
    if (prev === 'category' && catalogSeed) {
      // Category came from the URL — stay on type.
      return;
    }
    if (prev) {
      patchDraft({ currentStep: prev });
    }
  };

  const onSubmit = () => {
    if (!tree || !catalogSeed) {
      return;
    }
    for (const item of BUYER_REQUEST_STEPS) {
      if (item === 'review') {
        continue;
      }
      const message = validateBuyerStep(item, draft, {
        locationRequired: locationRule !== 'none',
      });
      if (message) {
        setError(message);
        patchDraft({ currentStep: item });
        return;
      }
    }

    const vendorsToAsk = Math.max(3, matchPreview?.vendorsCovering ?? 3);
    const startGate = check('start_request');
    if (startGate.outcome === 'block') {
      setError(`${startGate.reason} ${startGate.nextStep}`);
      return;
    }
    for (let i = 0; i < vendorsToAsk; i += 1) {
      const vendorGate = check('contact_vendors', i);
      if (vendorGate.outcome === 'block') {
        setError(`${vendorGate.reason} ${vendorGate.nextStep}`);
        return;
      }
    }

    const entitlement = consume('start_request');
    if (entitlement.blocked) {
      setError(
        entitlement.decision.outcome === 'block'
          ? `${entitlement.decision.reason} ${entitlement.decision.nextStep}`
          : 'You cannot start another request right now.',
      );
      return;
    }

    for (let i = 0; i < Math.min(vendorsToAsk, 3); i += 1) {
      consume('contact_vendors', i);
    }

    const typeName =
      tree.types.find((type) => type.slug === draft.typeSlug)?.name ?? draft.typeSlug;
    const serviceNames = draft.items.map((item) => {
      const service = tree.types
        .flatMap((type) => type.services)
        .find((row) => row.slug === item.serviceSlug);
      return service?.name ?? item.serviceSlug;
    });
    const title = `${typeName} · ${serviceNames.slice(0, 2).join(' + ')}${
      serviceNames.length > 2 ? '…' : ''
    }`;

    const payload: AppRequestPayload = {
      catalogVersion: draft.catalogVersion,
      typeSlug: draft.typeSlug,
      typeName,
      items: draft.items.map((item) => ({
        serviceSlug: item.serviceSlug,
        serviceName:
          tree.types.flatMap((type) => type.services).find((s) => s.slug === item.serviceSlug)
            ?.name ?? item.serviceSlug,
        quantity: item.quantity,
        attributes: item.attributes,
      })),
      attributes: draft.attributes,
      startDate: draft.startDate,
      endDate: draft.endDate || undefined,
      startTime: draft.startTime || undefined,
      location: {
        stateSlug: draft.stateSlug,
        locationSlug: draft.locationSlug,
        venueText: draft.venueText || undefined,
      },
      budgetMinMinor: draft.budgetMinMinor,
      budgetMaxMinor: draft.budgetMaxMinor,
    };

    const quotes: Quote[] = (matchPreview?.matches ?? [])
      .filter((row) => row.instantQuote && row.quote.amountMinor > 0)
      .slice(0, 5)
      .map((row, index) => ({
        id: `q_${row.vendorId}_${index}`,
        vendorAlias: row.alias,
        verified: row.verified,
        priceMinor: row.quote.amountMinor,
        availability: draft.startDate,
        rating: row.rating,
        reason: row.instantQuote ? 'Instant quote from rate card' : 'Custom quote needed',
        recommended: index === 0,
      }));

    const request = createRequest({
      categorySlug: tree.categorySlug,
      categoryName: tree.categoryName,
      title,
      involvement: draft.involvement,
      answers: {
        type: draft.typeSlug,
        services: draft.items.map((item) => item.serviceSlug),
        location: draft.locationSlug,
        date: draft.startDate,
        budgetMaxMinor: draft.budgetMaxMinor,
      },
      payload,
      quotes,
    });

    clearBuyerDraft(categorySlug);
    notifyFirstRequestCreated();
    navigateStatic(requestHref(request.id));
  };

  if (engineLoading || !ready) {
    return (
      <div className="p-4" aria-busy="true">
        <AppHeader title="Loading…" subtitle="Preparing your ask." />
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-card-muted" />
      </div>
    );
  }

  if (!catalogSeed || !tree) {
    return (
      <div className="p-4">
        <AppHeader title="Category unavailable" subtitle="This category is not in the catalog yet." />
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">
            Pick a live category from Home.
          </p>
          <Button href="/app" className="mt-4">
            Back home
          </Button>
        </div>
      </div>
    );
  }

  if (
    engineCategory &&
    engineCategory.status !== 'pilot' &&
    engineCategory.status !== 'live'
  ) {
    return (
      <div className="p-4">
        <AppHeader title="Category unavailable" subtitle="This category is not live yet." />
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-5 text-center">
          <Button href="/app" className="mt-2">
            Back home
          </Button>
        </div>
      </div>
    );
  }

  const typeLabel = tree.typeLabel || 'Type';

  return (
    <div>
      <div className="lg:hidden">
        <AppHeader
          title={`New ${tree.categoryName.toLowerCase()} ask`}
          subtitle="Built from the live catalog — calm steps, clear answers."
        />
      </div>

      <div className="hidden px-0 pb-4 pt-2 lg:block">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
          Buyer ask
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
          New {tree.categoryName.toLowerCase()} ask
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Pick what you need, where, and when. AskAlert matches verified vendors from rate cards.
        </p>
      </div>

      <div className="space-y-5 px-4 pt-2 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(17rem,0.8fr)] lg:items-start lg:gap-8 lg:space-y-0 lg:px-0">
        <div className="space-y-5">
          <div className="rounded-[1.5rem] border border-border/60 bg-[radial-gradient(90%_80%_at_0%_0%,_color-mix(in_srgb,var(--orange-500)_12%,transparent),_transparent_55%),var(--card)] p-4 shadow-sm sm:p-5">
            <div
              className="h-2.5 overflow-hidden rounded-full bg-border/80"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Ask progress"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Step {stepNumber} of {BUYER_REQUEST_STEPS.length}
              </p>
              <p className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-navy-950">
                {labelForStep(step, typeLabel)}
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm transition-opacity duration-300 lg:p-7">
            {step === 'category' ? (
              <CategoryStep
                seeds={allSeeds}
                selected={draft.categorySlug}
                onSelect={(slug) =>
                  patchDraft({
                    categorySlug: slug,
                    typeSlug: '',
                    items: [],
                    attributes: {},
                    catalogVersion: 1,
                  })
                }
              />
            ) : null}

            {step === 'type' ? (
              <TypeStep
                typeLabel={typeLabel}
                types={tree.types}
                selected={draft.typeSlug}
                onSelect={(slug) =>
                  patchDraft({
                    typeSlug: slug,
                    items: [],
                    attributes: {},
                  })
                }
              />
            ) : null}

            {step === 'services' ? (
              <ServicesStep
                tree={tree}
                typeSlug={draft.typeSlug}
                selected={draft.items.map((item) => item.serviceSlug)}
                onToggle={(serviceSlug) => {
                  const exists = draft.items.some((item) => item.serviceSlug === serviceSlug);
                  const service = tree.types
                    .flatMap((type) => type.services)
                    .find((row) => row.slug === serviceSlug);
                  const defaultQty = service?.min_value ?? 1;
                  patchDraft({
                    items: exists
                      ? draft.items.filter((item) => item.serviceSlug !== serviceSlug)
                      : [
                          ...draft.items,
                          { serviceSlug, quantity: defaultQty, attributes: {} },
                        ],
                  });
                }}
              />
            ) : null}

            {step === 'details' && requestSchema ? (
              <DetailsStep
                tree={tree}
                draft={draft}
                dimensionQuestions={requestSchema.dimensionQuestions}
                attributeQuestions={requestSchema.attributeQuestions}
                onQuantity={(serviceSlug, quantity) =>
                  patchDraft({
                    items: draft.items.map((item) =>
                      item.serviceSlug === serviceSlug ? { ...item, quantity } : item,
                    ),
                  })
                }
                onAttribute={(key, value) =>
                  patchDraft({
                    attributes: { ...draft.attributes, [key]: value },
                  })
                }
              />
            ) : null}

            {step === 'date' ? (
              <DateStep
                draft={draft}
                onChange={(patch) => patchDraft(patch)}
              />
            ) : null}

            {step === 'location' ? (
              <div className="space-y-4">
                <StepIntro
                  title="Where is this?"
                  body="State then location. Venue or address stays private until you book."
                />
                <LocationSelect
                  nodes={geoNodes}
                  locationRule={locationRule}
                  value={{ stateSlug: draft.stateSlug, locationSlug: draft.locationSlug }}
                  onChange={(value) =>
                    patchDraft({
                      stateSlug: value.stateSlug,
                      locationSlug: value.locationSlug,
                    })
                  }
                />
                <Input
                  label="Venue or address (optional)"
                  value={draft.venueText}
                  onChange={(event) => patchDraft({ venueText: event.target.value })}
                  hint="Private until booking."
                />
              </div>
            ) : null}

            {step === 'budget' ? (
              <BudgetStep draft={draft} onChange={(patch) => patchDraft(patch)} />
            ) : null}

            {step === 'involvement' ? (
              <InvolvementStep
                value={draft.involvement}
                onChange={(involvement) => patchDraft({ involvement })}
              />
            ) : null}

            {step === 'review' ? (
              <ReviewAskStep
                tree={tree}
                draft={draft}
                matchPreview={matchPreview}
                geoNodes={geoNodes}
                onEdit={(next) => patchDraft({ currentStep: next })}
              />
            ) : null}

            {error ? <p className="mt-4 text-sm font-medium text-danger">{error}</p> : null}

            <div className="mt-6 flex gap-3">
              <Button
                variant="ghost"
                className="min-h-11 flex-1"
                onClick={goBack}
                disabled={step === 'type' || (step === 'category' && Boolean(catalogSeed))}
              >
                Back
              </Button>
              {step === 'review' ? (
                <Button className="min-h-11 flex-1" onClick={onSubmit}>
                  Send ask
                </Button>
              ) : (
                <Button className="min-h-11 flex-1" onClick={goNext}>
                  Continue
                </Button>
              )}
            </div>
          </div>
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <LiveSummary tree={tree} draft={draft} matchPreview={matchPreview} />
          <div className="mt-4 rounded-[1.5rem] border border-border/60 bg-navy-950 p-5 text-surface shadow-sm">
            <p className="text-sm font-extrabold">What happens next</p>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-surface/75">
              <li>We match vendors that cover this service and location.</li>
              <li>Instant quotes come from their rate cards.</li>
              <li>You compare offers and choose the best fit.</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StepIntro({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-extrabold tracking-tight text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function CategoryStep({
  seeds,
  selected,
  onSelect,
}: {
  seeds: readonly CatalogCategorySeed[];
  selected: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div>
      <StepIntro title="What do you need?" body="Start with a category." />
      <div className="grid gap-2 sm:grid-cols-2">
        {seeds.map((seed) => (
          <button
            key={seed.category_slug}
            type="button"
            className={cn(
              'min-h-11 rounded-2xl border px-4 py-3 text-left text-sm font-bold',
              selected === seed.category_slug
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-border bg-card-muted',
            )}
            onClick={() => onSelect(seed.category_slug)}
          >
            {seed.category_name}
          </button>
        ))}
      </div>
    </div>
  );
}

function TypeStep({
  typeLabel,
  types,
  selected,
  onSelect,
}: {
  typeLabel: string;
  types: ResolvedCatalogTree['types'];
  selected: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div>
      <StepIntro
        title={`Which ${typeLabel.toLowerCase()}?`}
        body="This filters the services vendors can offer."
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {types
          .filter((type) => type.status === 'active')
          .map((type) => (
            <button
              key={type.slug}
              type="button"
              className={cn(
                'min-h-11 rounded-2xl border px-4 py-3 text-left text-sm font-bold capitalize',
                selected === type.slug
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-border bg-card-muted',
              )}
              onClick={() => onSelect(type.slug)}
            >
              {type.name}
            </button>
          ))}
      </div>
    </div>
  );
}

function ServicesStep({
  tree,
  typeSlug,
  selected,
  onToggle,
}: {
  tree: ResolvedCatalogTree;
  typeSlug: string;
  selected: string[];
  onToggle: (slug: string) => void;
}) {
  const type = tree.types.find((item) => item.slug === typeSlug);
  const services = type?.services.filter((service) => service.status === 'active') ?? [];

  return (
    <div>
      <StepIntro
        title="Which services?"
        body="Select one or more. Each gets its own details next."
      />
      <div className="space-y-2">
        {services.map((service) => {
          const on = selected.includes(service.slug);
          return (
            <button
              key={service.slug}
              type="button"
              className={cn(
                'flex w-full min-h-11 items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left',
                on ? 'border-orange-500 bg-orange-500/10' : 'border-border bg-card-muted',
              )}
              onClick={() => onToggle(service.slug)}
            >
              <span>
                <span className="block text-sm font-extrabold text-foreground">{service.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {dimensionLabel(service.dimension)}
                  {service.min_value != null ? ` · from ${service.min_value}` : ''}
                </span>
              </span>
              <span className="text-xs font-bold text-orange-700">{on ? 'Selected' : 'Add'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DetailsStep({
  tree,
  draft,
  dimensionQuestions,
  attributeQuestions,
  onQuantity,
  onAttribute,
}: {
  tree: ResolvedCatalogTree;
  draft: BuyerRequestDraft;
  dimensionQuestions: ReturnType<typeof buildRequestSchema>['dimensionQuestions'];
  attributeQuestions: ReturnType<typeof buildRequestSchema>['attributeQuestions'];
  onQuantity: (serviceSlug: string, quantity: number) => void;
  onAttribute: (key: string, value: string | number | boolean) => void;
}) {
  // Date and area belong in their own steps — skip them here.
  const extraAttributes = attributeQuestions.filter(
    (attr) => attr.type !== 'date' && attr.type !== 'area',
  );

  return (
    <div className="space-y-5">
      <StepIntro
        title="How much for each service?"
        body="Enter the quantity. Date and location come next."
      />
      {dimensionQuestions.map((question) => {
        const item = draft.items.find((row) => row.serviceSlug === question.scopeSlug);
        const service = tree.types
          .flatMap((type) => type.services)
          .find((row) => row.slug === question.scopeSlug);
        const bands = service?.default_bands ?? [];
        return (
          <div key={question.key} className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="text-sm font-extrabold text-foreground">{question.label}</p>
            <Input
              className="mt-3"
              type="number"
              inputMode="numeric"
              value={item?.quantity ?? ''}
              onChange={(event) => {
                const raw = event.target.value;
                onQuantity(question.scopeSlug, raw === '' ? 0 : Number(raw));
              }}
              hint={
                question.unit
                  ? `Unit: ${question.unit}`
                  : question.validation?.min != null
                    ? `From ${question.validation.min}${question.validation.max != null ? ` to ${question.validation.max}` : ''}`
                    : undefined
              }
            />
            {bands.length > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Price bands:{' '}
                {bands
                  .slice(0, 3)
                  .map((band) => `${band.dimMin}–${band.dimMax}`)
                  .join(' · ')}
                {bands.length > 3 ? '…' : ''}
              </p>
            ) : null}
          </div>
        );
      })}
      {extraAttributes.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Extra details
          </p>
          {extraAttributes.map((attr) => (
            <Input
              key={attr.key}
              label={attr.label}
              value={
                draft.attributes[attr.key] === undefined
                  ? ''
                  : String(draft.attributes[attr.key])
              }
              onChange={(event) => onAttribute(attr.key, event.target.value)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DateStep({
  draft,
  onChange,
}: {
  draft: BuyerRequestDraft;
  onChange: (patch: Partial<BuyerRequestDraft>) => void;
}) {
  return (
    <div className="space-y-4">
      <StepIntro title="When do you need this?" body="Date first. Add an end date for stays." />
      <Input
        label="Date"
        type="date"
        value={draft.startDate}
        onChange={(event) => onChange({ startDate: event.target.value })}
      />
      <Input
        label="End date (optional)"
        type="date"
        value={draft.endDate}
        onChange={(event) => onChange({ endDate: event.target.value })}
      />
      <Input
        label="Time (optional)"
        type="time"
        value={draft.startTime}
        onChange={(event) => onChange({ startTime: event.target.value })}
      />
    </div>
  );
}

function BudgetStep({
  draft,
  onChange,
}: {
  draft: BuyerRequestDraft;
  onChange: (patch: Partial<BuyerRequestDraft>) => void;
}) {
  return (
    <div className="space-y-4">
      <StepIntro
        title="Budget (optional)"
        body="Helps vendors stay realistic. You can leave this blank."
      />
      <Input
        label="Minimum (₦)"
        inputMode="decimal"
        value={
          draft.budgetMinMinor === null ? '' : formatNairaInput(draft.budgetMinMinor)
        }
        onChange={(event) => {
          const raw = event.target.value;
          onChange({
            budgetMinMinor: raw === '' ? null : (parseNairaInput(raw) ?? null),
          });
        }}
      />
      <Input
        label="Maximum (₦)"
        inputMode="decimal"
        value={
          draft.budgetMaxMinor === null ? '' : formatNairaInput(draft.budgetMaxMinor)
        }
        onChange={(event) => {
          const raw = event.target.value;
          onChange({
            budgetMaxMinor: raw === '' ? null : (parseNairaInput(raw) ?? null),
          });
        }}
      />
    </div>
  );
}

function InvolvementStep({
  value,
  onChange,
}: {
  value: InvolvementMode;
  onChange: (value: InvolvementMode) => void;
}) {
  return (
    <div>
      <StepIntro
        title="How involved should AskAlert be?"
        body="Choose how much of the chase you want us to handle."
      />
      <div className="space-y-2">
        {involvementOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            className={cn(
              'w-full min-h-11 rounded-2xl border px-4 py-3 text-left',
              value === option.id
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-border bg-card-muted',
            )}
            onClick={() => onChange(option.id)}
          >
            <p className="text-sm font-extrabold text-foreground">
              {option.title}{' '}
              <span className="font-semibold text-orange-600">({option.label})</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{option.blurb}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewAskStep({
  tree,
  draft,
  matchPreview,
  geoNodes,
  onEdit,
}: {
  tree: ResolvedCatalogTree;
  draft: BuyerRequestDraft;
  matchPreview: ReturnType<typeof matchBuyerRequest> | null;
  geoNodes: ReturnType<typeof listGeoSeedNodes>;
  onEdit: (step: BuyerRequestStepId) => void;
}) {
  const typeName = tree.types.find((type) => type.slug === draft.typeSlug)?.name ?? draft.typeSlug;
  const involvement = involvementOptions.find((option) => option.id === draft.involvement);
  const lookup = buildGeoLookup(geoNodes);
  const locationNode = draft.locationSlug ? findNode(lookup, draft.locationSlug) : null;
  const stateNode = draft.stateSlug ? findNode(lookup, draft.stateSlug) : null;
  const locationLabel = locationNode?.name ?? draft.locationSlug.replaceAll('-', ' ');
  const stateLabel = stateNode?.name ?? draft.stateSlug.replaceAll('-', ' ');
  const whenLabel = formatReviewWhen(draft.startDate, draft.endDate, draft.startTime);
  const budgetLabel =
    draft.budgetMinMinor === null && draft.budgetMaxMinor === null
      ? 'No budget set'
      : `${draft.budgetMinMinor != null ? formatNaira(createMoney(draft.budgetMinMinor)) : '—'} – ${draft.budgetMaxMinor != null ? formatNaira(createMoney(draft.budgetMaxMinor)) : '—'}`;

  const extraAttributes = Object.entries(draft.attributes).filter(([, value]) => {
    if (value === undefined || value === null || value === '') {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-orange-500/25 bg-[radial-gradient(120%_90%_at_100%_0%,_color-mix(in_srgb,var(--orange-500)_22%,transparent),_transparent_55%),linear-gradient(160deg,_color-mix(in_srgb,var(--navy-950)_6%,transparent),_transparent_50%),var(--card)] p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-600">
          Ready to send
        </p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
          {typeName} · {tree.categoryName}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Check each section. Tap Edit to jump back and fix anything.
        </p>

        {matchPreview?.typicalPrice.showEstimate ? (
          <div className="mt-4 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-navy-950">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-orange-700">
                  Typical price
                </p>
                <p className="mt-1 text-xl font-extrabold tabular-nums">
                  {formatNaira(createMoney(matchPreview.typicalPrice.minMinor))} –{' '}
                  {formatNaira(createMoney(matchPreview.typicalPrice.maxMinor))}
                </p>
              </div>
              <p className="rounded-full bg-orange-500/20 px-3 py-1.5 text-xs font-bold text-navy-950">
                {matchPreview.typicalPrice.vendorCount} vendors cover this
              </p>
            </div>
          </div>
        ) : matchPreview && matchPreview.vendorsCovering > 0 ? (
          <p className="mt-4 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
            {matchPreview.vendorsCovering} vendor
            {matchPreview.vendorsCovering === 1 ? '' : 's'} may cover this. Typical price shows when
            at least 3 match.
          </p>
        ) : (
          <p className="mt-4 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
            We will still send your ask. Supply looks thin in this spot right now.
          </p>
        )}
      </div>

      <ReviewBlock title="What you need" onEdit={() => onEdit('services')}>
        <p className="text-sm font-semibold text-muted-foreground">{typeName}</p>
        <ul className="mt-3 space-y-2">
          {draft.items.map((item) => {
            const service = tree.types
              .flatMap((type) => type.services)
              .find((row) => row.slug === item.serviceSlug);
            return (
              <li
                key={item.serviceSlug}
                className="flex items-center justify-between gap-3 rounded-xl bg-background/80 px-3 py-2.5"
              >
                <span className="text-sm font-extrabold text-foreground">
                  {service?.name ?? item.serviceSlug}
                </span>
                <span className="text-sm font-semibold text-muted-foreground">
                  {item.quantity} {service ? dimensionLabel(service.dimension) : ''}
                </span>
              </li>
            );
          })}
        </ul>
        {extraAttributes.length > 0 ? (
          <dl className="mt-3 space-y-2 border-t border-border/50 pt-3">
            {extraAttributes.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-3 text-sm">
                <dt className="capitalize text-muted-foreground">{key.replaceAll('_', ' ')}</dt>
                <dd className="font-semibold text-foreground">{String(value)}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </ReviewBlock>

      <div className="grid gap-3 sm:grid-cols-2">
        <ReviewBlock title="When" onEdit={() => onEdit('date')}>
          <p className="text-sm font-extrabold text-foreground">{whenLabel}</p>
        </ReviewBlock>
        <ReviewBlock title="Where" onEdit={() => onEdit('location')}>
          <p className="text-sm font-extrabold capitalize text-foreground">{locationLabel}</p>
          <p className="mt-1 text-xs text-muted-foreground">{stateLabel}</p>
          {draft.venueText ? (
            <p className="mt-2 text-sm text-muted-foreground">Venue: {draft.venueText}</p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">No private venue text</p>
          )}
        </ReviewBlock>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ReviewBlock title="Budget" onEdit={() => onEdit('budget')}>
          <p className="text-sm font-extrabold text-foreground">{budgetLabel}</p>
        </ReviewBlock>
        <ReviewBlock title="AskAlert role" onEdit={() => onEdit('involvement')}>
          <p className="text-sm font-extrabold text-foreground">
            {involvement?.title ?? draft.involvement}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{involvement?.blurb}</p>
        </ReviewBlock>
      </div>
    </div>
  );
}

function formatReviewWhen(startDate: string, endDate: string, startTime: string): string {
  if (!startDate) {
    return '—';
  }
  const start = formatFriendlyDate(startDate);
  if (endDate && endDate !== startDate) {
    return `${start} → ${formatFriendlyDate(endDate)}${startTime ? ` · ${startTime}` : ''}`;
  }
  return `${start}${startTime ? ` · ${startTime}` : ''}`;
}

function formatFriendlyDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function ReviewBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold tracking-tight text-foreground">{title}</h3>
        <button
          type="button"
          className="min-h-11 shrink-0 rounded-xl px-3 text-xs font-bold text-orange-700 hover:bg-orange-500/10"
          onClick={onEdit}
        >
          Edit
        </button>
      </div>
      {children}
    </section>
  );
}

function LiveSummary({
  tree,
  draft,
  matchPreview,
}: {
  tree: ResolvedCatalogTree;
  draft: BuyerRequestDraft;
  matchPreview: ReturnType<typeof matchBuyerRequest> | null;
}) {
  const typeName = tree.types.find((type) => type.slug === draft.typeSlug)?.name;

  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Live summary</p>
      <h2 className="mt-2 text-lg font-extrabold text-foreground">{tree.categoryName}</h2>
      <dl className="mt-4 space-y-2 text-sm">
        {typeName ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Type</dt>
            <dd className="text-right font-semibold">{typeName}</dd>
          </div>
        ) : null}
        {draft.items.length > 0 ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Services</dt>
            <dd className="text-right font-semibold">{draft.items.length}</dd>
          </div>
        ) : null}
        {draft.startDate ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Date</dt>
            <dd className="text-right font-semibold">{draft.startDate}</dd>
          </div>
        ) : null}
        {draft.locationSlug ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Location</dt>
            <dd className="capitalize text-right font-semibold">
              {draft.locationSlug.replaceAll('-', ' ')}
            </dd>
          </div>
        ) : null}
        {!typeName && draft.items.length === 0 ? (
          <p className="text-muted-foreground">Answers appear here as you go.</p>
        ) : null}
      </dl>
      {matchPreview?.typicalPrice.showEstimate ? (
        <div className="mt-4 rounded-xl border border-orange-500/25 bg-orange-500/10 px-3 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-orange-700">
            Typical price
          </p>
          <p className="mt-1 text-sm font-extrabold text-navy-950">
            {formatNaira(createMoney(matchPreview.typicalPrice.minMinor))} –{' '}
            {formatNaira(createMoney(matchPreview.typicalPrice.maxMinor))}
          </p>
          <p className="mt-1 text-xs font-semibold text-navy-950/80">
            {matchPreview.typicalPrice.vendorCount} vendors cover this
          </p>
        </div>
      ) : null}
    </div>
  );
}

function labelForStep(step: BuyerRequestStepId, typeLabel: string): string {
  switch (step) {
    case 'category':
      return 'Category';
    case 'type':
      return typeLabel;
    case 'services':
      return 'Services';
    case 'details':
      return 'Details';
    case 'date':
      return 'Date';
    case 'location':
      return 'Location';
    case 'budget':
      return 'Budget';
    case 'involvement':
      return 'Involvement';
    case 'review':
      return 'Review';
  }
}

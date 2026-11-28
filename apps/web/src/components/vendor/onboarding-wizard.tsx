'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  catalogSeedsLive,
  createServiceRateCardFromSeed,
  findCatalogService,
  regulatedRequiredDocuments,
} from '../../lib/vendor/vendor-catalog';
import { getActivePlan, getPlanById, resolveCoveragePlanCaps } from '@askalert/core';
import { areaDisplayName, rowsFromAreaSlugs } from '@askalert/db';
import { Button, Input, cn } from '@askalert/ui';
import { useAuth } from '../../lib/auth/auth-provider';
import { usePlanStore } from '../../lib/app/plan-store';
import { prepareVendorDocument } from '../../lib/vendor/document-prep';
import { maskAccountNumber } from '../../lib/vendor/documents';
import {
  availabilityStepSchema,
  categoriesStepSchema,
  DEFAULT_MAX_VENDOR_SERVICES,
  listServiceRateCardIssues,
  nextStep,
  payoutStepSchema,
  previousStep,
  STEP_ORDER,
  validateCoverageRows,
  validateDocumentsStep,
  validateServiceRateCardsStep,
  validateServicesStep,
  validateTypesStep,
  whoYouAreSchema,
} from '../../lib/vendor/schemas';
import {
  type OnboardingStepId,
  type ServiceRateCard,
  type VendorDocument,
  type VendorProfileDraft,
} from '../../lib/vendor/types';
import { useVendorStore } from '../../lib/vendor/vendor-store';
import { ServiceAreasStep } from './service-areas-step';
import { ServiceRateCardEditor } from './service-rate-card-editor';
import { ServicesStep } from './services-step';
import { TypesStep } from './types-step';

export function OnboardingWizard() {
  const { user } = useAuth();
  const {
    draft,
    updateDraft,
    setStep,
    upsertServiceRateCard,
    submitOnboarding,
    ready,
  } = useVendorStore();
  const { state: planState } = usePlanStore();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const catalogCategories = useMemo(() => catalogSeedsLive(), []);

  const coverageCaps = useMemo(() => {
    const plan = getActivePlan(planState) ?? getPlanById(planState.planId);
    return resolveCoveragePlanCaps(plan?.limits);
  }, [planState]);

  const regulatedDocs = useMemo(() => regulatedRequiredDocuments(draft), [draft]);

  if (!ready) {
    return <div className="h-40 animate-pulse rounded-2xl bg-card-muted" aria-busy="true" />;
  }

  const step = draft.currentStep;
  const stepNumber = STEP_ORDER.indexOf(step) + 1;
  const progress = (stepNumber / STEP_ORDER.length) * 100;

  const validateStep = (current: OnboardingStepId): string | null => {
    switch (current) {
      case 'who': {
        const result = whoYouAreSchema.safeParse({
          entityType: draft.entityType,
          displayName: draft.displayName,
          legalName: draft.legalName,
          dateOfBirth: draft.dateOfBirth,
          address: draft.address,
          businessName: draft.businessName,
          businessAddress: draft.businessAddress,
          ninOrBvn: draft.ninOrBvn,
        });
        return result.success ? null : result.error.issues[0]?.message ?? 'Check this step.';
      }
      case 'categories': {
        const result = categoriesStepSchema.safeParse({ categorySlugs: draft.categorySlugs });
        return result.success ? null : result.error.issues[0]?.message ?? 'Check this step.';
      }
      case 'types':
        return validateTypesStep(draft.categorySlugs, draft.typeSlugsByCategory);
      case 'services':
        return validateServicesStep(
          draft.categorySlugs,
          draft.serviceSlugsByCategory,
          DEFAULT_MAX_VENDOR_SERVICES,
        );
      case 'rate_cards':
        return validateServiceRateCardsStep(draft);
      case 'areas': {
        const rows = rowsFromAreaSlugs(draft.areaSlugs);
        return validateCoverageRows(
          rows.length > 0 ? rows : [{ stateSlug: 'lagos', locationSlug: '' }],
          coverageCaps.maxCoverageLocations,
        );
      }
      case 'availability': {
        const result = availabilityStepSchema.safeParse({
          weeklyHours: draft.weeklyHours,
          blackoutDates: draft.blackoutDates,
        });
        return result.success ? null : result.error.issues[0]?.message ?? 'Check availability.';
      }
      case 'documents':
        return validateDocumentsStep(draft.documents, {
          entityType: draft.entityType,
          regulatedDocCount: regulatedDocs.length,
        });
      case 'payout': {
        const result = payoutStepSchema.safeParse(draft.payout);
        return result.success ? null : result.error.issues[0]?.message ?? 'Check payout details.';
      }
      case 'review':
        return null;
      default:
        return null;
    }
  };

  const goNext = () => {
    setError(null);
    const validation = validateStep(step);
    if (validation) {
      setError(validation);
      return;
    }
    if (step === 'services') {
      for (const categorySlug of draft.categorySlugs) {
        for (const serviceSlug of draft.serviceSlugsByCategory[categorySlug] ?? []) {
          const existing = draft.serviceRateCards.find(
            (item) => item.categorySlug === categorySlug && item.serviceSlug === serviceSlug,
          );
          if (existing) {
            continue;
          }
          const catalog = findCatalogService(categorySlug, serviceSlug);
          if (catalog) {
            upsertServiceRateCard(createServiceRateCardFromSeed(categorySlug, catalog));
          }
        }
      }
    }
    if (step === 'rate_cards') {
      for (const categorySlug of draft.categorySlugs) {
        for (const serviceSlug of draft.serviceSlugsByCategory[categorySlug] ?? []) {
          const existing = draft.serviceRateCards.find(
            (item) => item.categorySlug === categorySlug && item.serviceSlug === serviceSlug,
          );
          if (existing) {
            upsertServiceRateCard({ ...existing, status: 'active' });
          }
        }
      }
    }
    const next = nextStep(step);
    if (next) {
      setStep(next);
    }
  };

  const goBack = () => {
    setError(null);
    const prev = previousStep(step);
    if (prev) {
      setStep(prev);
    }
  };

  const onSubmit = () => {
    for (const item of STEP_ORDER) {
      if (item === 'review') {
        continue;
      }
      const message = validateStep(item);
      if (message) {
        setError(message);
        setStep(item);
        return;
      }
    }
    const result = submitOnboarding();
    if (!result.ok) {
      setError(result.error);
    }
  };

  const rateCardBlocks = draft.categorySlugs.flatMap((categorySlug) =>
    (draft.serviceSlugsByCategory[categorySlug] ?? []).map((serviceSlug) => ({
      categorySlug,
      serviceSlug,
    })),
  );

  return (
    <div className="mx-auto max-w-2xl">
      <header className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-[radial-gradient(90%_80%_at_0%_0%,_color-mix(in_srgb,var(--orange-500)_14%,transparent),_transparent_55%),var(--card)] p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
          Vendor onboarding
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
          Set up your profile
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Saved as you go. One calm step at a time — leave and come back anytime.
        </p>

        <StatsProgress value={progress} stepNumber={stepNumber} total={STEP_ORDER.length} label={labelFor(step)} />
      </header>

      <div
        key={step}
        className="mt-5 rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm transition-opacity duration-300 ease-out lg:p-7"
      >
        <h2 className="mb-4 text-lg font-extrabold tracking-tight text-foreground">
          {labelFor(step)}
        </h2>

        {step === 'who' ? <WhoStep draft={draft} updateDraft={updateDraft} /> : null}
        {step === 'categories' ? (
          <CategoriesStep
            categories={catalogCategories}
            selected={draft.categorySlugs}
            onToggle={(slug) => {
              const on = draft.categorySlugs.includes(slug);
              const categorySlugs = on
                ? draft.categorySlugs.filter((item) => item !== slug)
                : [...draft.categorySlugs, slug];
              const typeSlugsByCategory = { ...draft.typeSlugsByCategory };
              const serviceSlugsByCategory = { ...draft.serviceSlugsByCategory };
              if (on) {
                delete typeSlugsByCategory[slug];
                delete serviceSlugsByCategory[slug];
              }
              updateDraft({
                categorySlugs,
                typeSlugsByCategory,
                serviceSlugsByCategory,
                serviceRateCards: on
                  ? draft.serviceRateCards.filter((card) => card.categorySlug !== slug)
                  : draft.serviceRateCards,
              });
            }}
          />
        ) : null}
        {step === 'types' ? <TypesStep /> : null}
        {step === 'services' ? <ServicesStep /> : null}
        {step === 'rate_cards' ? (
          <RateCardsStep
            blocks={rateCardBlocks}
            cards={draft.serviceRateCards}
            upsert={upsertServiceRateCard}
            draft={draft}
            showIssues={Boolean(error)}
          />
        ) : null}
        {step === 'areas' ? (
          <ServiceAreasStep
            areaSlugs={draft.areaSlugs}
            maxServiceAreas={coverageCaps.maxCoverageLocations}
            allowStatewide={coverageCaps.allowStatewide}
            maxStates={coverageCaps.maxStates}
            onChange={(slugs) => updateDraft({ areaSlugs: slugs })}
          />
        ) : null}
        {step === 'availability' ? (
          <AvailabilityStep draft={draft} updateDraft={updateDraft} />
        ) : null}
        {step === 'documents' ? (
          <DocumentsStep
            draft={draft}
            regulatedDocs={regulatedDocs}
            busy={busy}
            setBusy={setBusy}
            setError={setError}
            userId={user?.id ?? 'local-vendor'}
            updateDraft={updateDraft}
          />
        ) : null}
        {step === 'payout' ? <PayoutStep draft={draft} updateDraft={updateDraft} /> : null}
        {step === 'review' ? <ReviewStep draft={draft} rateCardBlocks={rateCardBlocks.length} /> : null}

        {error ? <p className="mt-4 text-sm font-medium text-danger">{error}</p> : null}

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" className="min-h-11 flex-1" onClick={goBack} disabled={step === 'who'}>
            Back
          </Button>
          {step === 'review' ? (
            <Button
              className="min-h-11 flex-1"
              onClick={onSubmit}
              disabled={draft.status === 'pending_review' || draft.status === 'approved'}
            >
              {draft.status === 'pending_review' ? 'Submitted' : 'Submit for review'}
            </Button>
          ) : (
            <Button className="min-h-11 flex-1" onClick={goNext}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsProgress({
  value,
  stepNumber,
  total,
  label,
}: {
  value: number;
  stepNumber: number;
  total: number;
  label: string;
}) {
  return (
    <>
      <div
        className="mt-6 h-2.5 overflow-hidden rounded-full bg-border/80"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Onboarding progress"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-[width] duration-500 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">
          Step {stepNumber} of {total}
        </p>
        <p className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-navy-950">
          {label}
        </p>
      </div>
    </>
  );
}

function WhoStep({
  draft,
  updateDraft,
}: {
  draft: VendorProfileDraft;
  updateDraft: (patch: Partial<VendorProfileDraft>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(['individual', 'business'] as const).map((type) => (
          <button
            key={type}
            type="button"
            className={cn(
              'min-h-11 rounded-2xl border text-sm font-bold capitalize',
              draft.entityType === type
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-border bg-card-muted',
            )}
            onClick={() => updateDraft({ entityType: type })}
          >
            {type}
          </button>
        ))}
      </div>
      <Input
        label="Display name"
        value={draft.displayName}
        onChange={(event) => updateDraft({ displayName: event.target.value })}
        hint="Shown to buyers on your profile."
      />
      <Input
        label="Legal name"
        value={draft.legalName}
        onChange={(event) => updateDraft({ legalName: event.target.value })}
        hint="Exactly as it appears on your government ID."
      />
      <Input
        label="Date of birth"
        type="date"
        value={draft.dateOfBirth}
        onChange={(event) => updateDraft({ dateOfBirth: event.target.value })}
        hint="You must be 18 or older."
      />
      <Input
        label="NIN or BVN"
        inputMode="numeric"
        value={draft.ninOrBvn}
        onChange={(event) =>
          updateDraft({ ninOrBvn: event.target.value.replace(/\D/g, '').slice(0, 11) })
        }
        hint="11 digits. Used for verification only — not shown to buyers."
      />
      {draft.entityType === 'individual' ? (
        <Input
          label="Residential address"
          value={draft.address}
          onChange={(event) => updateDraft({ address: event.target.value })}
          hint="Street, area, and city where you live."
        />
      ) : (
        <>
          <Input
            label="Business name"
            value={draft.businessName}
            onChange={(event) => updateDraft({ businessName: event.target.value })}
          />
          <Input
            label="Business address"
            value={draft.businessAddress}
            onChange={(event) => updateDraft({ businessAddress: event.target.value })}
            hint="Registered or operating address of the business."
          />
        </>
      )}
    </div>
  );
}

function CategoriesStep({
  categories,
  selected,
  onToggle,
}: {
  categories: ReturnType<typeof catalogSeedsLive>;
  selected: string[];
  onToggle: (slug: string) => void;
}) {
  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const isSelected = selected.includes(category.category_slug);
        return (
          <button
            key={category.category_slug}
            type="button"
            className={cn(
              'w-full min-h-11 rounded-2xl border p-4 text-left',
              isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-border bg-card-muted',
            )}
            onClick={() => onToggle(category.category_slug)}
          >
            <p className="text-sm font-extrabold text-foreground">{category.category_name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {category.types.length} types · {category.services.length} services
            </p>
          </button>
        );
      })}
    </div>
  );
}

function RateCardsStep({
  blocks,
  cards,
  upsert,
  draft,
  showIssues = false,
}: {
  blocks: Array<{ categorySlug: string; serviceSlug: string }>;
  cards: ServiceRateCard[];
  upsert: (card: ServiceRateCard) => void;
  draft: VendorProfileDraft;
  showIssues?: boolean;
}) {
  // Persist seed templates so Continue does not fail with “pricing not saved”.
  useEffect(() => {
    for (const { categorySlug, serviceSlug } of blocks) {
      const exists = cards.some(
        (item) => item.categorySlug === categorySlug && item.serviceSlug === serviceSlug,
      );
      if (exists) {
        continue;
      }
      const catalog = findCatalogService(categorySlug, serviceSlug);
      if (!catalog) {
        continue;
      }
      upsert(createServiceRateCardFromSeed(categorySlug, catalog));
    }
  }, [blocks, cards, upsert]);

  const issues = useMemo(
    () => (showIssues ? listServiceRateCardIssues(draft) : []),
    [draft, showIssues],
  );
  const issueByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const issue of issues) {
      map.set(`${issue.categorySlug}:${issue.serviceSlug}`, issue.error);
    }
    return map;
  }, [issues]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Set a price card for each service. Red notices mark the ones that still need a fix.
      </p>
      {blocks.map(({ categorySlug, serviceSlug }) => {
        const catalog = findCatalogService(categorySlug, serviceSlug);
        const existing = cards.find(
          (item) => item.categorySlug === categorySlug && item.serviceSlug === serviceSlug,
        );
        const card =
          existing ??
          (catalog ? createServiceRateCardFromSeed(categorySlug, catalog) : null);
        if (!card) {
          return null;
        }
        const issue = issueByKey.get(`${categorySlug}:${serviceSlug}`);
        return (
          <div
            key={`${categorySlug}:${serviceSlug}`}
            className={cn(
              'rounded-2xl border p-4',
              issue
                ? 'border-danger/50 bg-danger/5'
                : 'border-border/70 bg-card',
            )}
          >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {categorySlug}
                </p>
                <h3 className="text-base font-extrabold text-foreground">
                  {catalog?.name ?? serviceSlug}
                </h3>
              </div>
              {issue ? (
                <span className="rounded-full bg-danger/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-danger">
                  Needs fix
                </span>
              ) : (
                <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-700">
                  Ready
                </span>
              )}
            </div>
            {issue ? (
              <p
                className="mb-3 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm font-semibold text-danger"
                role="alert"
              >
                {issue}
              </p>
            ) : null}
            <ServiceRateCardEditor
              card={card}
              onChange={(next) => upsert({ ...next, status: 'draft' })}
            />
          </div>
        );
      })}
    </div>
  );
}

function AvailabilityStep({
  draft,
  updateDraft,
}: {
  draft: VendorProfileDraft;
  updateDraft: (patch: Partial<VendorProfileDraft>) => void;
}) {
  return (
    <div className="space-y-3">
      {draft.weeklyHours.map((day, index) => (
        <div
          key={day.day}
          className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 p-3"
        >
          <button
            type="button"
            className={cn(
              'min-h-11 min-w-16 rounded-xl text-xs font-bold uppercase',
              day.open ? 'bg-navy-950 text-surface' : 'bg-card-muted text-muted-foreground',
            )}
            onClick={() => {
              const weeklyHours = draft.weeklyHours.map((item, i) =>
                i === index ? { ...item, open: !item.open } : item,
              );
              updateDraft({ weeklyHours });
            }}
          >
            {day.day}
          </button>
          <Input
            aria-label={`${day.day} start`}
            type="time"
            value={day.start}
            disabled={!day.open}
            onChange={(event) => {
              const weeklyHours = draft.weeklyHours.map((item, i) =>
                i === index ? { ...item, start: event.target.value } : item,
              );
              updateDraft({ weeklyHours });
            }}
          />
          <Input
            aria-label={`${day.day} end`}
            type="time"
            value={day.end}
            disabled={!day.open}
            onChange={(event) => {
              const weeklyHours = draft.weeklyHours.map((item, i) =>
                i === index ? { ...item, end: event.target.value } : item,
              );
              updateDraft({ weeklyHours });
            }}
          />
        </div>
      ))}
      <Input
        label="Add blackout date"
        type="date"
        onChange={(event) => {
          const value = event.target.value;
          if (!value || draft.blackoutDates.includes(value)) {
            return;
          }
          updateDraft({ blackoutDates: [...draft.blackoutDates, value] });
        }}
      />
      {draft.blackoutDates.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {draft.blackoutDates.map((date) => (
            <button
              key={date}
              type="button"
              className="min-h-11 rounded-full border border-border px-3 py-1 text-xs font-semibold"
              onClick={() =>
                updateDraft({
                  blackoutDates: draft.blackoutDates.filter((item) => item !== date),
                })
              }
            >
              {date} ×
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DocumentsStep({
  draft,
  regulatedDocs,
  busy,
  setBusy,
  setError,
  userId,
  updateDraft,
}: {
  draft: VendorProfileDraft;
  regulatedDocs: string[];
  busy: boolean;
  setBusy: (value: boolean) => void;
  setError: (value: string | null) => void;
  userId: string;
  updateDraft: (patch: Partial<VendorProfileDraft>) => void;
}) {
  const isBusiness = draft.entityType === 'business';
  const hasId = draft.documents.some((doc) => doc.kind === 'id');
  const hasIdSelfie = draft.documents.some((doc) => doc.kind === 'id_selfie');
  const hasBusinessProof = draft.documents.some((doc) => doc.kind === 'business_proof');
  const licenceCount = draft.documents.filter((doc) => doc.kind === 'licence').length;

  const slots: Array<{
    kind: VendorDocument['kind'];
    title: string;
    detail: string;
    required: boolean;
    done: boolean;
    capture?: 'user' | 'environment';
    accept?: string;
  }> = [
    {
      kind: 'id',
      title: isBusiness ? 'Owner photo ID' : 'Your photo ID',
      detail: isBusiness
        ? 'Clear photo of the owner’s NIN slip, driver’s licence, international passport, or national ID.'
        : 'Clear photo of your NIN slip, driver’s licence, international passport, or national ID.',
      required: true,
      done: hasId,
    },
    {
      kind: 'id_selfie',
      title: 'Selfie holding your ID',
      detail:
        'Take a live photo of your face while holding the same ID you just uploaded. Your face and the ID details must both be clear.',
      required: true,
      done: hasIdSelfie,
      capture: 'user',
      accept: 'image/jpeg,image/png,image/webp',
    },
  ];

  if (isBusiness) {
    slots.push({
      kind: 'business_proof',
      title: 'Business proof',
      detail: 'CAC certificate or registered business name document.',
      required: true,
      done: hasBusinessProof,
    });
  }

  regulatedDocs.forEach((label, index) => {
    slots.push({
      kind: 'licence',
      title: label,
      detail: 'Required because one of your services is regulated.',
      required: true,
      done: licenceCount > index,
    });
  });

  slots.push({
    kind: 'portfolio',
    title: 'Work sample (optional)',
    detail: 'A photo of past work helps buyers trust you. You can skip this.',
    required: false,
    done: draft.documents.some((doc) => doc.kind === 'portfolio'),
  });

  const upload = (kind: VendorDocument['kind'], file: File | undefined) => {
    if (!file) {
      return;
    }
    setBusy(true);
    setError(null);
    void prepareVendorDocument({
      file,
      kind,
      ownerUserId: userId,
    }).then((result) => {
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      updateDraft({ documents: [...draft.documents, result.document] });
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {isBusiness
          ? 'As a business, upload the owner’s ID, a selfie holding that ID, and proof the business is registered. Files stay private.'
          : 'As an individual vendor, upload a clear government ID and a selfie holding that same ID. Files stay private.'}
      </p>
      <p className="text-xs text-muted-foreground">
        JPEG, PNG, WebP or PDF. Max 5 MB each. The selfie must be a photo, not a PDF.
      </p>

      <ul className="space-y-3">
        {slots.map((slot, index) => (
          <li
            key={`${slot.kind}-${slot.title}-${index}`}
            className={cn(
              'rounded-2xl border p-4',
              slot.required && !slot.done
                ? 'border-orange-500/40 bg-orange-500/5'
                : 'border-border/70 bg-card',
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-foreground">
                  {slot.title}
                  {slot.required ? (
                    <span className="ml-1 text-xs font-bold text-orange-700">Required</span>
                  ) : (
                    <span className="ml-1 text-xs font-semibold text-muted-foreground">Optional</span>
                  )}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{slot.detail}</p>
              </div>
              {slot.done ? (
                <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-700">
                  Uploaded
                </span>
              ) : null}
            </div>
            <label className="mt-3 flex min-h-11 cursor-pointer items-center rounded-xl border border-dashed border-border/80 bg-background px-3 text-sm font-semibold text-foreground">
              <span>
                {busy
                  ? 'Uploading…'
                  : slot.done
                    ? 'Add another file'
                    : slot.capture
                      ? 'Take or choose photo'
                      : 'Choose file'}
              </span>
              <input
                type="file"
                accept={slot.accept ?? 'image/jpeg,image/png,image/webp,application/pdf'}
                capture={slot.capture}
                className="sr-only"
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  upload(slot.kind, file);
                }}
              />
            </label>
          </li>
        ))}
      </ul>

      {draft.documents.length > 0 ? (
        <ul className="space-y-2">
          <li className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Uploaded files
          </li>
          {draft.documents.map((doc) => (
            <li
              key={doc.id}
              className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-border/60 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{doc.fileName}</p>
                <p className="text-xs text-muted-foreground">{documentKindLabel(doc.kind)}</p>
              </div>
              <button
                type="button"
                className="shrink-0 text-xs font-bold text-danger"
                onClick={() =>
                  updateDraft({
                    documents: draft.documents.filter((item) => item.id !== doc.id),
                  })
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function documentKindLabel(kind: VendorDocument['kind']): string {
  switch (kind) {
    case 'id':
      return 'Photo ID';
    case 'id_selfie':
      return 'Selfie with ID';
    case 'business_proof':
      return 'Business proof';
    case 'licence':
      return 'Licence';
    case 'portfolio':
      return 'Work sample';
  }
}

function PayoutStep({
  draft,
  updateDraft,
}: {
  draft: VendorProfileDraft;
  updateDraft: (patch: Partial<VendorProfileDraft>) => void;
}) {
  return (
    <div className="space-y-4">
      <Input
        label="Bank name"
        value={draft.payout.bankName}
        onChange={(event) =>
          updateDraft({ payout: { ...draft.payout, bankName: event.target.value } })
        }
      />
      <Input
        label="Account name"
        value={draft.payout.accountName}
        onChange={(event) =>
          updateDraft({ payout: { ...draft.payout, accountName: event.target.value } })
        }
      />
      <Input
        label="Account number"
        inputMode="numeric"
        value={draft.payout.accountNumber}
        onChange={(event) =>
          updateDraft({
            payout: {
              ...draft.payout,
              accountNumber: event.target.value.replace(/\D/g, '').slice(0, 10),
            },
          })
        }
        hint={
          draft.payout.accountNumber
            ? `Stored masked as ${maskAccountNumber(draft.payout.accountNumber)}. Paystack verification comes later.`
            : '10 digits. Verified later with Paystack.'
        }
      />
    </div>
  );
}

function ReviewStep({
  draft,
  rateCardBlocks,
}: {
  draft: VendorProfileDraft;
  rateCardBlocks: number;
}) {
  return (
    <div className="space-y-3 text-sm">
      {draft.status === 'pending_review' ? (
        <p className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-3 py-3 font-medium text-navy-950">
          Submitted for review. We will alert you when you are approved.
        </p>
      ) : null}
      <Row label="Display name" value={draft.displayName} />
      <Row label="Legal name" value={draft.legalName} />
      <Row label="Type" value={draft.entityType} />
      <Row
        label="Address"
        value={
          draft.entityType === 'business'
            ? draft.businessAddress || '—'
            : draft.address || '—'
        }
      />
      <Row label="Categories" value={draft.categorySlugs.join(', ') || '—'} />
      <Row label="Services" value={String(rateCardBlocks)} />
      <Row
        label="Areas"
        value={draft.areaSlugs.map((slug) => areaDisplayName(slug)).join(', ') || '—'}
      />
      <Row label="Documents" value={`${draft.documents.length} uploaded`} />
      <Row
        label="Payout"
        value={`${draft.payout.bankName} · ${maskAccountNumber(draft.payout.accountNumber)}`}
      />
      <Row label="Status" value={draft.status.replace('_', ' ')} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/50 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold capitalize text-foreground">{value}</dd>
    </div>
  );
}

function labelFor(step: OnboardingStepId): string {
  switch (step) {
    case 'who':
      return 'Who you are';
    case 'categories':
      return 'Categories';
    case 'types':
      return 'Types you handle';
    case 'services':
      return 'Services';
    case 'rate_cards':
      return 'Rate cards';
    case 'areas':
      return 'Service areas';
    case 'availability':
      return 'Availability';
    case 'documents':
      return 'Verify with documents';
    case 'payout':
      return 'Payout details';
    case 'review':
      return 'Review';
  }
}
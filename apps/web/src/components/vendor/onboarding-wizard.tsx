'use client';

import { useMemo, useState } from 'react';
import {
  catalogSeedsLive,
  createServiceRateCardFromSeed,
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
  type VendorProfileDraft,
} from '../../lib/vendor/types';
import { findCatalogService } from '../../lib/vendor/vendor-catalog';
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
          businessName: draft.businessName,
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
        return validateDocumentsStep(draft.documents, regulatedDocs.length);
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
      />
      {draft.entityType === 'business' ? (
        <Input
          label="Business name"
          value={draft.businessName}
          onChange={(event) => updateDraft({ businessName: event.target.value })}
        />
      ) : null}
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
}: {
  blocks: Array<{ categorySlug: string; serviceSlug: string }>;
  cards: ServiceRateCard[];
  upsert: (card: ServiceRateCard) => void;
}) {
  return (
    <div className="space-y-6">
      {blocks.map(({ categorySlug, serviceSlug }) => {
        const catalog = findCatalogService(categorySlug, serviceSlug);
        const existing = cards.find(
          (item) => item.categorySlug === categorySlug && item.serviceSlug === serviceSlug,
        );
        const card =
          existing ??
          (catalog
            ? createServiceRateCardFromSeed(categorySlug, catalog)
            : null);
        if (!card) {
          return null;
        }
        return (
          <span key={`${categorySlug}:${serviceSlug}`} className="block rounded-2xl border border-border/70 p-4">
            <ServiceRateCardEditor
              card={card}
              onChange={(next) => upsert({ ...next, status: 'draft' })}
            />
          </span>
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
  return (
    <div className="space-y-4">
      {regulatedDocs.length > 0 ? (
        <p className="rounded-2xl border border-orange-500/25 bg-orange-500/10 px-3 py-3 text-sm font-medium text-navy-950">
          Regulated services need extra uploads: {regulatedDocs.join(', ')}.
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        JPEG, PNG, WebP or PDF. Max 5 MB. Files stay private to your account.
      </p>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="block w-full min-h-11 text-sm"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) {
            return;
          }
          setBusy(true);
          void prepareVendorDocument({
            file,
            kind: regulatedDocs.length > 0 ? 'licence' : 'id',
            ownerUserId: userId,
          }).then((result) => {
            setBusy(false);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            updateDraft({ documents: [...draft.documents, result.document] });
          });
        }}
      />
      <ul className="space-y-2">
        {draft.documents.map((doc) => (
          <li
            key={doc.id}
            className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-border/60 px-3 py-2 text-sm"
          >
            <span className="truncate font-semibold">{doc.fileName}</span>
            <button
              type="button"
              className="text-xs font-bold text-danger"
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
    </div>
  );
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
      <Row label="Name" value={draft.displayName} />
      <Row label="Type" value={draft.entityType} />
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
      return 'Documents';
    case 'payout':
      return 'Payout details';
    case 'review':
      return 'Review';
  }
}
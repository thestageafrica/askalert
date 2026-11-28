'use client';

import { useMemo, type ReactNode } from 'react';
import { findCatalogSeedBySlug } from '@askalert/catalog';
import { areaDisplayName } from '@askalert/db';
import { createMoney, formatNaira } from '@askalert/payments';
import { cn } from '@askalert/ui';
import { maskAccountNumber, maskIdentityNumber } from '../../lib/vendor/documents';
import { computeOnboardingCompleteness } from '../../lib/vendor/schemas';
import {
  type OnboardingStepId,
  type ServiceRateCard,
  type VendorDocument,
  type VendorProfileDraft,
  type WeekDay,
} from '../../lib/vendor/types';
import { findCatalogService, regulatedRequiredDocuments } from '../../lib/vendor/vendor-catalog';

const DAY_LABELS: Record<WeekDay, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

export function ReviewStep({
  draft,
  onEditStep,
}: {
  draft: VendorProfileDraft;
  onEditStep: (step: OnboardingStepId) => void;
}) {
  const regulatedDocs = useMemo(() => regulatedRequiredDocuments(draft), [draft]);
  const completeness = useMemo(
    () => computeOnboardingCompleteness(draft, regulatedDocs.length),
    [draft, regulatedDocs.length],
  );

  const openDays = draft.weeklyHours.filter((day) => day.open);
  const payoutFilled =
    draft.payout.bankName.trim() ||
    draft.payout.accountName.trim() ||
    draft.payout.accountNumber.trim();

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-orange-500/25 bg-[radial-gradient(120%_90%_at_100%_0%,_color-mix(in_srgb,var(--orange-500)_22%,transparent),_transparent_55%),linear-gradient(160deg,_color-mix(in_srgb,var(--navy-950)_6%,transparent),_transparent_50%),var(--card)] p-5 sm:p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
          <CircularProgress percent={completeness.percent} />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-600">
              Almost there
            </p>
            <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
              {completeness.percent === 100
                ? 'Your profile looks ready'
                : 'Review and finish missing bits'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Check every section below. Tap Edit to jump back and fix anything.
              Payout can wait until payments go live.
            </p>
          </div>
        </div>

        <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {completeness.items.map((item) => (
            <li
              key={item.id}
              className={cn(
                'rounded-xl border px-2.5 py-2 text-xs font-semibold',
                item.done
                  ? 'border-orange-500/30 bg-orange-500/10 text-navy-950'
                  : item.optional
                    ? 'border-border/70 bg-background/70 text-muted-foreground'
                    : 'border-danger/30 bg-danger/5 text-danger',
              )}
            >
              <span className="block truncate">
                {item.done ? '✓ ' : item.optional ? '○ ' : '! '}
                {item.label}
                {item.optional && !item.done ? ' later' : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {draft.status === 'pending_review' ? (
        <p className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm font-medium text-navy-950">
          Submitted for review. We will alert you when you are approved.
        </p>
      ) : null}

      <ReviewSection title="Who you are" onEdit={() => onEditStep('who')}>
        <ReviewRow label="Vendor type" value={draft.entityType === 'business' ? 'Business' : 'Individual'} />
        <ReviewRow label="Display name" value={draft.displayName || '—'} />
        <ReviewRow label="Legal name" value={draft.legalName || '—'} />
        <ReviewRow label="Date of birth" value={formatDateOfBirth(draft.dateOfBirth)} />
        <ReviewRow label="NIN / BVN" value={maskIdentityNumber(draft.ninOrBvn)} />
        {draft.entityType === 'business' ? (
          <>
            <ReviewRow label="Business name" value={draft.businessName || '—'} />
            <ReviewRow label="Business address" value={draft.businessAddress || '—'} />
          </>
        ) : (
          <ReviewRow label="Residential address" value={draft.address || '—'} />
        )}
      </ReviewSection>

      <ReviewSection title="Categories & types" onEdit={() => onEditStep('types')}>
        {draft.categorySlugs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories selected.</p>
        ) : (
          <ul className="space-y-3">
            {draft.categorySlugs.map((categorySlug) => {
              const seed = findCatalogSeedBySlug(categorySlug);
              const typeSlugs = draft.typeSlugsByCategory[categorySlug] ?? [];
              const typeNames = typeSlugs.map((typeSlug) => {
                const match = seed?.types.find((type) => type.slug === typeSlug);
                return match?.name ?? typeSlug;
              });
              return (
                <li key={categorySlug} className="rounded-xl bg-background/80 px-3 py-2.5">
                  <p className="text-sm font-extrabold text-foreground">
                    {seed?.category_name ?? categorySlug}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {typeNames.length > 0 ? typeNames.join(' · ') : 'No types yet'}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </ReviewSection>

      <ReviewSection title="Services & pricing" onEdit={() => onEditStep('rate_cards')}>
        {draft.categorySlugs.every(
          (slug) => (draft.serviceSlugsByCategory[slug] ?? []).length === 0,
        ) ? (
          <p className="text-sm text-muted-foreground">No services selected.</p>
        ) : (
          <ul className="space-y-3">
            {draft.categorySlugs.flatMap((categorySlug) =>
              (draft.serviceSlugsByCategory[categorySlug] ?? []).map((serviceSlug) => {
                const catalog = findCatalogService(categorySlug, serviceSlug);
                const card = draft.serviceRateCards.find(
                  (item) =>
                    item.categorySlug === categorySlug && item.serviceSlug === serviceSlug,
                );
                const seed = findCatalogSeedBySlug(categorySlug);
                return (
                  <li
                    key={`${categorySlug}:${serviceSlug}`}
                    className="rounded-xl bg-background/80 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                          {seed?.category_name ?? categorySlug}
                        </p>
                        <p className="text-sm font-extrabold text-foreground">
                          {catalog?.name ?? serviceSlug}
                        </p>
                      </div>
                      <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-700">
                        {card ? 'Priced' : 'Missing'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {summarizeRateCard(card, catalog?.pricing_model)}
                    </p>
                  </li>
                );
              }),
            )}
          </ul>
        )}
      </ReviewSection>

      <ReviewSection title="Service areas" onEdit={() => onEditStep('areas')}>
        {draft.areaSlugs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No areas selected.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {draft.areaSlugs.map((slug) => (
              <span
                key={slug}
                className="rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
              >
                {areaDisplayName(slug)}
              </span>
            ))}
          </div>
        )}
      </ReviewSection>

      <ReviewSection title="Availability" onEdit={() => onEditStep('availability')}>
        {openDays.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open days set.</p>
        ) : (
          <ul className="space-y-2">
            {openDays.map((day) => (
              <li
                key={day.day}
                className="flex items-center justify-between gap-3 rounded-xl bg-background/80 px-3 py-2 text-sm"
              >
                <span className="font-semibold text-foreground">{DAY_LABELS[day.day]}</span>
                <span className="text-muted-foreground">
                  {day.start} – {day.end}
                </span>
              </li>
            ))}
          </ul>
        )}
        {draft.blackoutDates.length > 0 ? (
          <div className="mt-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Blackout dates
            </p>
            <div className="flex flex-wrap gap-2">
              {draft.blackoutDates.map((date) => (
                <span
                  key={date}
                  className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold"
                >
                  {date}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </ReviewSection>

      <ReviewSection title="Documents" onEdit={() => onEditStep('documents')}>
        {draft.documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents uploaded.</p>
        ) : (
          <ul className="space-y-2">
            {draft.documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-background/80 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{doc.fileName}</p>
                  <p className="text-xs text-muted-foreground">{documentKindLabel(doc.kind)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ReviewSection>

      <ReviewSection
        title="Payout"
        onEdit={() => onEditStep('payout')}
        badge={payoutFilled ? undefined : 'After payments'}
      >
        {payoutFilled ? (
          <>
            <ReviewRow label="Bank" value={draft.payout.bankName || '—'} />
            <ReviewRow label="Account name" value={draft.payout.accountName || '—'} />
            <ReviewRow
              label="Account number"
              value={
                draft.payout.accountNumber
                  ? maskAccountNumber(draft.payout.accountNumber)
                  : '—'
              }
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Bank details can be added after the payment gateway is connected. You can still
            submit for review.
          </p>
        )}
      </ReviewSection>
    </div>
  );
}

function CircularProgress({ percent }: { percent: number }) {
  const size = 120;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Profile completeness"
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border/70"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#reviewProgressGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
        <defs>
          <linearGradient id="reviewProgressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--orange-500)" />
            <stop offset="100%" stopColor="var(--orange-400, var(--orange-500))" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold tabular-nums text-foreground">{percent}%</span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Complete
        </span>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  badge,
  children,
}: {
  title: string;
  onEdit: () => void;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="text-sm font-extrabold tracking-tight text-foreground">{title}</h3>
          {badge ? (
            <span className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {badge}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="min-h-11 shrink-0 rounded-xl px-3 text-xs font-bold text-orange-700 hover:bg-orange-500/10"
        >
          Edit
        </button>
      </div>
      {children}
    </section>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 py-2 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="max-w-[60%] text-right text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function formatDateOfBirth(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value || '—';
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function summarizeRateCard(
  card: ServiceRateCard | undefined,
  pricingModel: string | undefined,
): string {
  if (!card) {
    return 'Pricing not set yet.';
  }
  if (pricingModel === 'quote_only') {
    return 'Custom quotes only';
  }
  if (card.bands.length > 0) {
    const lowest = Math.min(...card.bands.map((band) => band.priceMinor));
    return `${card.bands.length} price band${card.bands.length === 1 ? '' : 's'} · from ${formatNaira(createMoney(lowest))}`;
  }
  if (card.packages.some((pkg) => pkg.priceMinor > 0)) {
    return `${card.packages.length} package${card.packages.length === 1 ? '' : 's'}`;
  }
  if (card.priceMinor && card.priceMinor > 0) {
    return formatNaira(createMoney(card.priceMinor));
  }
  return 'Pricing saved';
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

'use client';

import { useEffect, useState } from 'react';
import { formatNaira, formatNairaInput, parseNairaInput } from '@askalert/payments';
import { Button, Input, cn } from '@askalert/ui';
import { useBillingAdmin } from '../lib/billing-admin-store';
import {
  getLiveVersion,
  previewPlanCapabilities,
  type AdminPlanRecord,
  type PlanDraftInput,
} from '../lib/plan-admin';
import { useAdminStore } from '../lib/admin-store';
import { canEditPlans } from '../lib/roles';

export function PlansAdminView() {
  const { role } = useAdminStore();
  const { plans, publishPlan, rollbackPlan } = useBillingAdmin();
  const canEdit = canEditPlans(role);
  const [selectedId, setSelectedId] = useState(plans[0]?.id ?? '');
  const selected = plans.find((plan) => plan.id === selectedId) ?? plans[0];
  const live = selected ? getLiveVersion(selected) : null;
  const liveVersion = live?.version ?? 0;
  const livePriceMinor = live?.priceMinor ?? 0;
  const liveRequests = live?.limits.requestsPerMonth ?? 0;
  const [note, setNote] = useState('');
  const [priceNaira, setPriceNaira] = useState(formatNairaInput(livePriceMinor));
  const [requests, setRequests] = useState(liveRequests);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setPriceNaira(formatNairaInput(livePriceMinor));
    setRequests(liveRequests);
  }, [selectedId, liveVersion, livePriceMinor, liveRequests]);

  if (!selected || !live) {
    return <p className="text-sm text-muted-foreground">No plans seeded.</p>;
  }

  const onPublish = () => {
    if (!canEdit) {
      setMessage('Only Super admin or Operations can edit plans.');
      return;
    }
    if (note.trim().length < 3) {
      setMessage('Add a short change note before publishing.');
      return;
    }
    const parsedPrice = parseNairaInput(priceNaira);
    if (parsedPrice === null) {
      setMessage('Enter a valid plan price in Naira.');
      return;
    }
    const draft: PlanDraftInput = {
      slug: selected.slug,
      audience: selected.audience,
      name: selected.name,
      priceMinor: parsedPrice,
      periodDays: live.periodDays,
      currency: 'NGN',
      limits: {
        ...live.limits,
        requestsPerMonth: requests || live.limits.requestsPerMonth,
      },
      features: live.features,
      disabled: selected.disabled,
      changeNote: note,
    };
    const result = publishPlan(selected.id, draft);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setNote('');
    setMessage('Published a new plan version. Active subscriptions keep their current period.');
  };

  return (
    <div className="space-y-5">
      <Header
        title="Plans"
        subtitle="Versioned catalogue. Publishing never rewrites active subscriber periods."
      />
      {!canEdit ? (
        <p className="text-sm font-semibold text-orange-700">
          View only for your role. Switch to Super admin or Operations to edit.
        </p>
      ) : null}
      {message ? (
        <p className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm font-medium text-navy-950">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <ul className="space-y-2">
          {plans.map((plan) => (
            <li key={plan.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(plan.id);
                  setMessage(null);
                }}
                className={cn(
                  'w-full rounded-2xl border px-3 py-3 text-left text-sm transition',
                  plan.id === selected.id
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-border bg-card hover:border-orange-500/40',
                )}
              >
                <p className="font-extrabold text-foreground">{plan.name}</p>
                <p className="text-xs text-muted-foreground">
                  {plan.audience} · v{plan.currentVersion}
                  {plan.disabled ? ' · disabled' : ''}
                </p>
              </button>
            </li>
          ))}
        </ul>

        <div className="space-y-4">
          <section className="rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-sm">
            <h2 className="text-sm font-bold text-foreground">Live preview</h2>
            <p className="mt-1 text-sm text-muted-foreground">{live.features.summary}</p>
            <p className="mt-3 text-lg font-extrabold text-foreground">
              {formatNaira({ amountKobo: live.priceMinor, currency: 'NGN' })} / {live.periodDays}{' '}
              days
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {previewPlanCapabilities(live).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-sm">
            <h2 className="text-sm font-bold text-foreground">Edit and publish</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input
                label="Price (₦)"
                inputMode="decimal"
                value={priceNaira}
                disabled={!canEdit}
                onChange={(event) => setPriceNaira(event.target.value)}
                hint="Enter Naira. Example: 3000 for ₦3,000."
              />
              <Input
                label="Requests / month"
                type="number"
                value={String(requests)}
                disabled={!canEdit || selected.audience !== 'buyer'}
                onChange={(event) => setRequests(Number(event.target.value) || 0)}
              />
            </div>
            <div className="mt-3">
              <Input
                label="Change note"
                value={note}
                disabled={!canEdit}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Why this change?"
              />
            </div>
            <Button
              type="button"
              className="mt-4 min-h-11"
              disabled={!canEdit}
              onClick={onPublish}
            >
              Publish new version
            </Button>
          </section>

          <VersionHistory
            plan={selected}
            canEdit={canEdit}
            onRollback={(version) => {
              const result = rollbackPlan(selected.id, version);
              setMessage(
                result.ok
                  ? `Catalogue rolled back to v${version}. Subscribers stay on their active period.`
                  : result.error,
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}

function VersionHistory({
  plan,
  canEdit,
  onRollback,
}: {
  plan: AdminPlanRecord;
  canEdit: boolean;
  onRollback: (version: number) => void;
}) {
  const sorted = [...plan.versions].sort((a, b) => b.version - a.version);
  return (
    <section className="rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-sm">
      <h2 className="text-sm font-bold text-foreground">Versions</h2>
      <ul className="mt-3 divide-y divide-border/60">
        {sorted.map((version) => (
          <li key={version.version} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-bold text-foreground">
                v{version.version}
                {version.version === plan.currentVersion ? ' · live' : ''}
              </p>
              <p className="text-xs text-muted-foreground">{version.changeNote}</p>
            </div>
            {version.version !== plan.currentVersion ? (
              <Button
                type="button"
                variant="secondary"
                className="min-h-11"
                disabled={!canEdit}
                onClick={() => onRollback(version.version)}
              >
                Roll back
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">Billing</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

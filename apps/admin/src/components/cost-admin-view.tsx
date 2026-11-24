'use client';

import { useMemo, useState } from 'react';
import { formatNaira } from '@askalert/payments';
import { Button, Input } from '@askalert/ui';
import { AccessibleBarChart } from './accessible-bar-chart';
import { useBillingAdmin } from '../lib/billing-admin-store';
import { useAdminStore } from '../lib/admin-store';
import { canEditUnitCosts } from '../lib/roles';
import { getPlanById } from '@askalert/core';

const TYPE_GROUPS: Record<string, string[]> = {
  AI: ['ai_tokens', 'ai_suggestion'],
  WhatsApp: ['wa_service', 'wa_utility', 'wa_template'],
  SMS: ['sms'],
  'Speech-to-text': ['stt'],
  Maps: ['places'],
};

export function CostAdminView({ mode = 'dashboard' }: { mode?: 'dashboard' | 'settings' }) {
  const { role } = useAdminStore();
  const { events, users, unitCosts, setUnitCosts, thresholds, setThresholds } =
    useBillingAdmin();
  const canEdit = canEditUnitCosts(role);
  const [message, setMessage] = useState<string | null>(null);

  const byType = useMemo(() => {
    return Object.entries(TYPE_GROUPS).map(([label, types]) => ({
      label,
      value: events
        .filter((event) => types.includes(event.type))
        .reduce((sum, event) => sum + event.estCostMinor, 0),
    }));
  }, [events]);

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of events) {
      const day = event.createdAt.slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + event.estCostMinor);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value }));
  }, [events]);

  const requestCount = events.filter((event) => event.type === 'request').length || 1;
  const bookingProxy = Math.max(1, Math.floor(users.filter((u) => u.audience === 'buyer').length));
  const totalCost = events.reduce((sum, event) => sum + event.estCostMinor, 0);

  const topUsers = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of events) {
      map.set(event.userId, (map.get(event.userId) ?? 0) + event.estCostMinor);
    }
    return [...map.entries()]
      .map(([userId, value]) => ({
        label: users.find((user) => user.userId === userId)?.displayName ?? userId,
        value,
        userId,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
  }, [events, users]);

  const vendorsOver = users.filter((user) => {
    if (user.audience !== 'vendor') {
      return false;
    }
    const plan = getPlanById(user.planId);
    const limit = (plan?.limits.leadAlertsPerMonth ?? 0) + user.bonusLeadAlerts;
    return user.usage.leadAlerts >= limit && limit > 0;
  });

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayCost = byDay.find((item) => item.label === todayKey)?.value ?? byDay.at(-1)?.value ?? 0;
  const dailyAlert = todayCost > thresholds.dailyCostMinor;
  const userAlert = topUsers.some((user) => user.value > thresholds.userCostMinor);

  if (mode === 'settings') {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
            Billing
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Unit cost settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Placeholder kobo costs used for estimates. WhatsApp, AI and SMS are editable here.
          </p>
        </div>
        {!canEdit ? (
          <p className="text-sm font-semibold text-orange-700">
            Only Super admin or Operations can edit unit costs.
          </p>
        ) : null}
        {message ? (
          <p className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm font-medium text-navy-950">
            {message}
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ['wa_service', 'WhatsApp / message'],
              ['ai_suggestion', 'AI / suggestion'],
              ['sms', 'SMS / message'],
            ] as const
          ).map(([key, label]) => (
            <Input
              key={key}
              label={`${label} (kobo)`}
              type="number"
              disabled={!canEdit}
              value={String(unitCosts.costsMinor[key] ?? 0)}
              onChange={(event) => {
                const next = Number(event.target.value) || 0;
                setUnitCosts({
                  costsMinor: { ...unitCosts.costsMinor, [key]: next },
                });
              }}
            />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Daily cost alert (kobo)"
            type="number"
            disabled={!canEdit}
            value={String(thresholds.dailyCostMinor)}
            onChange={(event) =>
              setThresholds({
                ...thresholds,
                dailyCostMinor: Number(event.target.value) || 0,
              })
            }
          />
          <Input
            label="Per-user cost alert (kobo)"
            type="number"
            disabled={!canEdit}
            value={String(thresholds.userCostMinor)}
            onChange={(event) =>
              setThresholds({
                ...thresholds,
                userCostMinor: Number(event.target.value) || 0,
              })
            }
          />
        </div>
        <Button
          type="button"
          className="min-h-11"
          disabled={!canEdit}
          onClick={() => setMessage('Unit costs and alert thresholds saved for this session.')}
        >
          Save settings
        </Button>
        <Button href="/cost" variant="secondary" className="min-h-11">
          Back to cost dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
            Billing
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Cost</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Estimated cost by day and type. Mock data until live usage_events stream in.
          </p>
        </div>
        <Button href="/cost/settings" variant="secondary" className="min-h-11">
          Unit cost settings
        </Button>
      </div>

      {(dailyAlert || userAlert) && (
        <p className="rounded-2xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm font-medium text-navy-950">
          Alert: {dailyAlert ? 'daily cost above threshold. ' : ''}
          {userAlert ? 'at least one user is above the per-user threshold.' : ''}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Cost / request"
          value={formatNaira({
            amountKobo: Math.round(totalCost / requestCount),
            currency: 'NGN',
          })}
        />
        <Stat
          label="Cost / booking (proxy)"
          value={formatNaira({
            amountKobo: Math.round(totalCost / bookingProxy),
            currency: 'NGN',
          })}
        />
        <Stat
          label="Vendors over allowance"
          value={String(vendorsOver.length)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AccessibleBarChart
          title="Estimated cost by type"
          data={byType}
          valueFormatter={(value) => formatNaira({ amountKobo: value, currency: 'NGN' })}
        />
        <AccessibleBarChart
          title="Estimated cost by day"
          data={byDay}
          valueFormatter={(value) => formatNaira({ amountKobo: value, currency: 'NGN' })}
        />
      </div>

      <section className="rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-sm">
        <h2 className="text-sm font-bold">Top users by cost</h2>
        <ol className="mt-3 space-y-2 text-sm">
          {topUsers.map((user, index) => (
            <li key={user.userId} className="flex justify-between gap-3">
              <span>
                {index + 1}. {user.label}
              </span>
              <span className="font-semibold">
                {formatNaira({ amountKobo: user.value, currency: 'NGN' })}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {vendorsOver.length ? (
        <section className="rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-sm">
          <h2 className="text-sm font-bold">Vendors over lead allowance</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {vendorsOver.map((vendor) => (
              <li key={vendor.userId}>
                {vendor.displayName} · {vendor.usage.leadAlerts} alerts used
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-xl font-extrabold text-foreground">{value}</p>
    </div>
  );
}

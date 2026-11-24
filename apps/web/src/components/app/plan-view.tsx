'use client';

import { formatNaira } from '@askalert/payments';
import { getActivePlan, getPlanBySlug, listPlans } from '@askalert/core';
import { Button, cn } from '@askalert/ui';
import { AppHeader } from './app-header';
import { usePlanStore } from '../../lib/app/plan-store';

function remainingLabel(used: number, limit: number | undefined): string {
  if (limit == null) {
    return '—';
  }
  return `${Math.max(0, limit - used)} of ${limit} left`;
}

export function PlanView() {
  const { state, planName, buyStarter, buyCreditPack } = usePlanStore();
  const plan = getActivePlan(state) ?? getPlanBySlug('buyer_free');
  const limits = plan?.limits;
  const requestPct =
    limits?.requestsPerMonth && limits.requestsPerMonth > 0
      ? Math.round((state.usage.requests / limits.requestsPerMonth) * 100)
      : 0;
  const atWarn = requestPct >= 80 && requestPct < 100;
  const atBlock = requestPct >= 100;
  const starter = listPlans().find((item) => item.slug === 'buyer_starter');

  return (
    <div>
      <AppHeader title="Your plan" subtitle="Plain allowances. No tokens." />
      <div className="space-y-4 px-4 pt-2">
        <section className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-card shadow-[0_10px_24px_color-mix(in_srgb,var(--navy-950)_6%,transparent)]">
          <div className="border-b border-border/70 bg-gradient-to-r from-navy-950 to-navy-900 px-4 py-4 text-surface">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">
              Current plan
            </p>
            <p className="mt-1 text-2xl font-extrabold">{planName}</p>
            <p className="mt-1 text-sm text-surface/70">
              {plan?.features.summary ?? 'Monthly demo allowance.'}
            </p>
          </div>
          <ul className="divide-y divide-border/60 p-1">
            <AllowanceRow
              label="Requests this month"
              value={remainingLabel(state.usage.requests, limits?.requestsPerMonth)}
            />
            <AllowanceRow
              label="Vendors per request"
              value={`${limits?.vendorsPerRequest ?? '—'}`}
            />
            <AllowanceRow
              label="Chat messages"
              value={remainingLabel(state.usage.relayedMessages, limits?.relayedMessages)}
            />
            <AllowanceRow
              label="AI suggestions"
              value={remainingLabel(state.usage.aiSuggestions, limits?.aiSuggestions)}
            />
            <AllowanceRow
              label="WhatsApp chat"
              value={limits?.whatsappEnabled ? 'Included' : 'Not on Free'}
            />
          </ul>
        </section>

        {atWarn || atBlock ? (
          <section
            className={cn(
              'rounded-[1.5rem] border p-4',
              atBlock
                ? 'border-warning/40 bg-warning/10'
                : 'border-orange-500/30 bg-orange-500/10',
            )}
          >
            <p className="text-sm font-bold text-navy-950">
              {atBlock
                ? 'You have used all requests for this month.'
                : 'You are close to your monthly request limit.'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {atBlock
                ? 'Top up or get Starter to keep asking vendors.'
                : 'Consider Starter before you run out.'}
            </p>
          </section>
        ) : null}

        <section className="rounded-[1.5rem] border border-border/60 bg-card p-4">
          <h2 className="text-sm font-bold text-foreground">Upgrade</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Starter is{' '}
            {starter
              ? formatNaira({ amountKobo: starter.priceMinor, currency: 'NGN' })
              : '₦3,000.00'}{' '}
            per 30 days (placeholder). Payment is mocked for now.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button type="button" onClick={buyStarter} className="w-full min-h-11">
              Get Starter
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={buyCreditPack}
              className="w-full min-h-11"
            >
              Top up (mock)
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function AllowanceRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex min-h-11 items-center justify-between gap-3 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold text-foreground">{value}</span>
    </li>
  );
}

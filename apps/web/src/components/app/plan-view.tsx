'use client';

import { useState } from 'react';
import { formatNaira } from '@askalert/payments';
import {
  getActivePlan,
  getPlanBySlug,
  listPlans,
  type PurchaseKind,
} from '@askalert/core';
import { Button, Sheet, cn } from '@askalert/ui';
import { AppHeader } from './app-header';
import { usePlanStore } from '../../lib/app/plan-store';

function remainingLabel(used: number, limit: number | undefined): string {
  if (limit == null) {
    return '—';
  }
  return `${Math.max(0, limit - used)} of ${limit} left`;
}

export function PlanView() {
  const {
    state,
    planName,
    walletBalanceMinor,
    creditPackMinor,
    completePurchase,
  } = usePlanStore();
  const plan = getActivePlan(state) ?? getPlanBySlug('buyer_free');
  const limits = plan?.limits;
  const requestPct =
    limits?.requestsPerMonth && limits.requestsPerMonth > 0
      ? Math.round((state.usage.requests / limits.requestsPerMonth) * 100)
      : 0;
  const atWarn = requestPct >= 80 && requestPct < 100;
  const atBlock = requestPct >= 100;
  const starter = listPlans().find((item) => item.slug === 'buyer_starter');
  const [purchaseKind, setPurchaseKind] = useState<PurchaseKind | null>(null);
  const [purchaseDone, setPurchaseDone] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const openPurchase = (kind: PurchaseKind) => {
    setPurchaseDone(null);
    setPurchaseKind(kind);
  };

  const confirmPurchase = async () => {
    if (!purchaseKind) {
      return;
    }
    setPaying(true);
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    completePurchase(purchaseKind);
    setPaying(false);
    setPurchaseDone(
      purchaseKind === 'starter_pass'
        ? 'You are on Starter. More asks and WhatsApp chat are unlocked.'
        : `Top-up added. Credit balance is now ${formatNaira({ amountKobo: walletBalanceMinor + creditPackMinor, currency: 'NGN' })}.`,
    );
    setPurchaseKind(null);
  };

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
            <AllowanceRow
              label="Credit balance"
              value={formatNaira({ amountKobo: walletBalanceMinor, currency: 'NGN' })}
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
            {atBlock ? (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11 w-full sm:flex-1"
                  onClick={() => openPurchase('credit_pack')}
                >
                  Top up
                </Button>
                <Button
                  type="button"
                  className="min-h-11 w-full sm:flex-1"
                  onClick={() => openPurchase('starter_pass')}
                >
                  Get Starter
                </Button>
              </div>
            ) : null}
          </section>
        ) : null}

        {purchaseDone ? (
          <section className="rounded-[1.5rem] border border-orange-500/30 bg-orange-500/10 p-4">
            <p className="text-sm font-bold text-navy-950">{purchaseDone}</p>
          </section>
        ) : null}

        <section className="rounded-[1.5rem] border border-border/60 bg-card p-4">
          <h2 className="text-sm font-bold text-foreground">Upgrade</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Starter is{' '}
            {starter
              ? formatNaira({ amountKobo: starter.priceMinor, currency: 'NGN' })
              : '₦3,000.00'}{' '}
            per 30 days. Credit packs are{' '}
            {formatNaira({ amountKobo: creditPackMinor, currency: 'NGN' })}. Payment is mocked
            for now.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              type="button"
              onClick={() => openPurchase('starter_pass')}
              className="w-full min-h-11"
            >
              Get Starter
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => openPurchase('credit_pack')}
              className="w-full min-h-11"
            >
              Top up
            </Button>
          </div>
        </section>
      </div>

      <Sheet
        open={purchaseKind !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPurchaseKind(null);
          }
        }}
        title={purchaseKind === 'starter_pass' ? 'Get Starter' : 'Top up credits'}
      >
        <p className="text-sm text-muted-foreground">
          Mock payment only. Paystack will replace this later.
        </p>
        <p className="mt-3 text-base font-extrabold text-foreground">
          {purchaseKind === 'starter_pass'
            ? formatNaira({
                amountKobo: starter?.priceMinor ?? 300_000,
                currency: 'NGN',
              })
            : formatNaira({ amountKobo: creditPackMinor, currency: 'NGN' })}
        </p>
        <Button
          type="button"
          className="mt-5 w-full min-h-11"
          disabled={paying}
          onClick={() => void confirmPurchase()}
        >
          {paying ? 'Confirming…' : 'Confirm mock payment'}
        </Button>
      </Sheet>
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

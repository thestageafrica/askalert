'use client';

import { useEffect, useState } from 'react';
import { Button, cn } from '@askalert/ui';
import {
  adminLedgerHoldWarning,
  defaultPaymentsAdminState,
  loadPaymentsAdminState,
  savePaymentsAdminState,
  type PaymentsAdminState,
} from '../../lib/payments-admin';

export function PaymentsConsole() {
  const [state, setState] = useState<PaymentsAdminState | null>(null);

  useEffect(() => {
    setState(loadPaymentsAdminState());
  }, []);

  if (!state) {
    return <div className="h-40 animate-pulse rounded-[1.75rem] bg-card-muted" aria-busy />;
  }

  const persist = (next: PaymentsAdminState) => {
    setState(next);
    savePaymentsAdminState(next);
  };

  return (
    <div className="space-y-6">
      <header className="rounded-[1.75rem] border border-border/60 bg-card p-6 sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">
          Prompt 48 · Payments
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
          Payments console
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Flutterwave direct splits are the default path. Staged-payout strategies stay off until
          written confirmation and a legal opinion are on file.
        </p>
        {state.sandbox ? (
          <p className="mt-4 inline-flex rounded-full bg-orange-500 px-3 py-1 text-xs font-extrabold text-navy-950">
            SANDBOX
          </p>
        ) : null}
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          { label: 'Provider', value: 'Flutterwave' },
          { label: 'Direct mode', value: 'DIRECT_SPLIT' },
          {
            label: 'Staged payout strategies',
            value: state.strategyEnabled ? 'Enabled (gated)' : 'Off',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[1.5rem] border border-border/60 bg-card p-5 shadow-sm"
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-2 text-xl font-extrabold text-foreground">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[1.75rem] border border-orange-500/30 bg-orange-500/10 p-5">
        <p className="text-sm font-extrabold text-navy-950 dark:text-surface">
          Admin warning
        </p>
        <p className="mt-2 text-sm leading-relaxed text-navy-950/80 dark:text-surface/80">
          {adminLedgerHoldWarning()}
        </p>
      </section>

      <section className="rounded-[1.75rem] border border-border/60 bg-card p-5">
        <h2 className="text-lg font-extrabold text-foreground">Provider registry</h2>
        <ul className="mt-4 space-y-3">
          {state.router.providers.map((provider) => (
            <li
              key={provider.key}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/50 bg-background/70 px-4 py-3"
            >
              <div>
                <p className="text-sm font-extrabold text-foreground">{provider.key}</p>
                <p className="text-xs text-muted-foreground">
                  {provider.mode} · webhook {provider.webhookPath} · strategy {provider.strategy}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-[10px] font-bold uppercase',
                    provider.enabled
                      ? 'bg-orange-500/15 text-navy-950 dark:text-surface'
                      : 'bg-card-muted text-muted-foreground',
                  )}
                >
                  {provider.enabled ? 'Enabled' : 'Disabled'}
                </span>
                {provider.killSwitch ? (
                  <span className="rounded-full bg-card-muted px-3 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                    Kill switch
                  </span>
                ) : null}
                {provider.drainMode ? (
                  <span className="rounded-full bg-card-muted px-3 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                    Drain
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[1.75rem] border border-border/60 bg-card p-5">
        <h2 className="text-lg font-extrabold text-foreground">Gates</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant={state.flutterwaveHoldConfirmed ? 'primary' : 'ghost'}
            className="min-h-11"
            onClick={() =>
              persist({
                ...state,
                flutterwaveHoldConfirmed: !state.flutterwaveHoldConfirmed,
              })
            }
          >
            Flutterwave hold confirmed
          </Button>
          <Button
            variant={state.legalOpinionOnFile ? 'primary' : 'ghost'}
            className="min-h-11"
            onClick={() =>
              persist({
                ...state,
                legalOpinionOnFile: !state.legalOpinionOnFile,
              })
            }
          >
            Legal opinion on file
          </Button>
          <Button
            variant="ghost"
            className="min-h-11"
            onClick={() => persist(defaultPaymentsAdminState())}
          >
            Reset local draft
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Local draft only — production secrets stay in server env. Never put Flutterwave secret
          keys in the browser.
        </p>
      </section>
    </div>
  );
}

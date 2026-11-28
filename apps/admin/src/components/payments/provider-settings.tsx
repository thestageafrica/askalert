'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Select } from '@askalert/ui';
import {
  loadPaymentsAdminState,
  savePaymentsAdminState,
  type PaymentsAdminState,
} from '../../lib/payments-admin';

export function ProviderSettings() {
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

  const updateProvider = (
    key: string,
    patch: Partial<PaymentsAdminState['router']['providers'][number]>,
  ) => {
    persist({
      ...state,
      router: {
        ...state.router,
        providers: state.router.providers.map((provider) =>
          provider.key === key ? { ...provider, ...patch } : provider,
        ),
      },
    });
  };

  return (
    <div className="space-y-6">
      <header className="rounded-[1.75rem] border border-border/60 bg-card p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">
          Provider settings
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
          Payout routing
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Default provider, per-category overrides, kill switch and drain mode. In-flight payouts
          stay pinned to the provider that created them.
        </p>
        {state.sandbox ? (
          <p className="mt-4 inline-flex rounded-full bg-orange-500 px-3 py-1 text-xs font-extrabold text-navy-950">
            SANDBOX
          </p>
        ) : null}
      </header>

      <section className="rounded-[1.75rem] border border-border/60 bg-card p-5">
        <Select
          label="Default provider"
          value={state.router.defaultProviderKey}
          options={state.router.providers.map((provider) => ({
            value: provider.key,
            label: provider.key,
          }))}
          onChange={(event) =>
            persist({
              ...state,
              router: {
                ...state.router,
                defaultProviderKey: event.target.value,
              },
            })
          }
        />
        <div className="mt-4">
          <Input
            label="Category override (slug → provider)"
            hint="Example: events=mock"
            value={Object.entries(state.router.categoryOverrides)
              .map(([slug, key]) => `${slug}=${key}`)
              .join(', ')}
            onChange={(event) => {
              const overrides: Record<string, string> = {};
              for (const part of event.target.value.split(',')) {
                const [slug, key] = part.split('=').map((item) => item.trim());
                if (slug && key) {
                  overrides[slug] = key;
                }
              }
              persist({
                ...state,
                router: { ...state.router, categoryOverrides: overrides },
              });
            }}
          />
        </div>
      </section>

      {state.router.providers.map((provider) => (
        <section
          key={provider.key}
          className="space-y-3 rounded-[1.75rem] border border-border/60 bg-card p-5"
        >
          <h2 className="text-lg font-extrabold text-foreground">{provider.key}</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              className="min-h-11"
              variant={provider.enabled ? 'primary' : 'ghost'}
              onClick={() => updateProvider(provider.key, { enabled: !provider.enabled })}
            >
              {provider.enabled ? 'Enabled' : 'Disabled'}
            </Button>
            <Button
              className="min-h-11"
              variant={provider.killSwitch ? 'primary' : 'ghost'}
              onClick={() => updateProvider(provider.key, { killSwitch: !provider.killSwitch })}
            >
              Kill switch
            </Button>
            <Button
              className="min-h-11"
              variant={provider.drainMode ? 'primary' : 'ghost'}
              onClick={() => updateProvider(provider.key, { drainMode: !provider.drainMode })}
            >
              Drain mode
            </Button>
          </div>
          <Select
            label="Mode"
            value={provider.mode}
            options={[
              { value: 'sandbox', label: 'sandbox' },
              { value: 'live', label: 'live' },
            ]}
            onChange={(event) =>
              updateProvider(provider.key, {
                mode: event.target.value as 'sandbox' | 'live',
              })
            }
          />
        </section>
      ))}
    </div>
  );
}

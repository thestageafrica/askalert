'use client';

import { Button, Input } from '@askalert/ui';
import { AppHeader } from './app-header';
import { useMockStore } from '../../lib/app/mock-store';

export function AccountView() {
  const { account, updateAccount } = useMockStore();

  return (
    <div>
      <AppHeader title="Account" subtitle="Your number, alerts and privacy." />
      <div className="space-y-5 px-4 pt-5">
        <section className="rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">Phone</h2>
          <Input
            className="mt-3"
            label="WhatsApp number"
            value={account.phone}
            onChange={(event) => updateAccount({ phone: event.target.value })}
          />
        </section>

        <section className="rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">Notifications</h2>
          <div className="mt-3 space-y-3">
            {(
              [
                ['notifyQuotes', 'Quote updates'],
                ['notifyChat', 'Chat messages'],
                ['notifyMarketing', 'Tips and offers'],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex min-h-11 items-center justify-between gap-3 text-sm font-medium"
              >
                <span>{label}</span>
                <input
                  type="checkbox"
                  className="size-5 accent-orange-500"
                  checked={account[key]}
                  onChange={(event) => updateAccount({ [key]: event.target.checked })}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">Language</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(
              [
                ['en', 'English'],
                ['pidgin', 'Pidgin (soon)'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  account.language === value
                    ? 'min-h-11 rounded-2xl border border-orange-500 bg-orange-500/10 text-sm font-bold'
                    : 'min-h-11 rounded-2xl border border-border bg-card-muted text-sm font-semibold text-muted-foreground'
                }
                onClick={() => updateAccount({ language: value })}
                disabled={value === 'pidgin'}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">Data and privacy</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Vendors only see your contact after you book. You can clear local demo data anytime by
            refreshing this session.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button href="/privacy" variant="secondary">
              Privacy policy
            </Button>
            <Button href="/terms" variant="ghost">
              Terms
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

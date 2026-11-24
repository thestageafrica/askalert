'use client';

import { useEffect, useState } from 'react';
import { Button, Input, cn } from '@askalert/ui';
import { AppHeader } from './app-header';
import { useMockStore } from '../../lib/app/mock-store';
import { useNotificationsStore } from '../../lib/app/notifications-store';
import {
  getPushPermissionState,
  pushStateLabel,
  subscribeToPush,
  type PushPermissionState,
} from '../../lib/app/push-client';

export function AccountView() {
  const { account, updateAccount } = useMockStore();
  const { unreadCount } = useNotificationsStore();
  const [pushState, setPushState] = useState<PushPermissionState>('default');
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);

  useEffect(() => {
    setPushState(getPushPermissionState());
  }, []);

  const enablePush = async () => {
    setPushBusy(true);
    setPushMessage(null);
    const result = await subscribeToPush();
    setPushBusy(false);
    if (result.ok) {
      setPushState('enabled');
      setPushMessage('Notifications are on for this device.');
      return;
    }
    setPushState(result.state);
    if (result.state === 'ios_needs_homescreen') {
      setPushMessage(
        'On iPhone, add AskAlert to Home Screen, open it from that icon, then try again.',
      );
    } else if (result.state === 'blocked') {
      setPushMessage('Notifications are blocked in browser settings.');
    } else if (result.state === 'unsupported') {
      setPushMessage('Push is not supported on this browser.');
    }
  };

  return (
    <div>
      <AppHeader title="Account" subtitle="Your number, alerts and privacy." />
      <div className="space-y-4 px-4 pt-2">
        <section className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-card shadow-[0_10px_24px_color-mix(in_srgb,var(--navy-950)_6%,transparent)]">
          <div className="border-b border-border/70 bg-gradient-to-r from-navy-950 to-navy-900 px-4 py-4 text-surface">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">Profile</p>
            <p className="mt-1 text-lg font-extrabold">{account.phone}</p>
            <p className="mt-0.5 text-xs text-surface/65">WhatsApp · Lagos demo account</p>
          </div>
          <div className="p-4">
            <Input
              label="WhatsApp number"
              value={account.phone}
              onChange={(event) => updateAccount({ phone: event.target.value })}
            />
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-border/60 bg-card p-4 shadow-[0_10px_24px_color-mix(in_srgb,var(--navy-950)_6%,transparent)]">
          <h2 className="text-sm font-bold text-foreground">Push notifications</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Status: {pushStateLabel(pushState)}. Quiet hours default to 9pm–7am.
          </p>
          {pushMessage ? (
            <p className="mt-2 text-sm font-medium text-navy-950">{pushMessage}</p>
          ) : null}
          <Button
            type="button"
            className="mt-4 w-full min-h-11"
            disabled={pushBusy || pushState === 'enabled' || pushState === 'unsupported'}
            onClick={() => void enablePush()}
          >
            {pushState === 'enabled'
              ? 'Notifications enabled'
              : pushBusy
                ? 'Enabling…'
                : 'Turn on notifications'}
          </Button>
          <Button href="/app/notifications" variant="secondary" className="mt-2 w-full min-h-11">
            Notification centre{unreadCount > 0 ? ` (${unreadCount})` : ''}
          </Button>
        </section>

        <section className="rounded-[1.5rem] border border-border/60 bg-card p-4 shadow-[0_10px_24px_color-mix(in_srgb,var(--navy-950)_6%,transparent)]">
          <h2 className="text-sm font-bold text-foreground">Notification preferences</h2>
          <div className="mt-3 space-y-1">
            {(
              [
                ['notifyQuotes', 'Quote updates'],
                ['notifyChat', 'Chat messages'],
                ['notifyMarketing', 'Tips and offers'],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex min-h-12 items-center justify-between gap-3 rounded-2xl px-2 text-sm font-medium"
              >
                <span>{label}</span>
                <Toggle
                  checked={account[key]}
                  onChange={(checked) => updateAccount({ [key]: checked })}
                  label={label}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-border/60 bg-card p-4 shadow-[0_10px_24px_color-mix(in_srgb,var(--navy-950)_6%,transparent)]">
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
                className={cn(
                  'min-h-11 rounded-2xl text-sm font-bold transition',
                  account.language === value
                    ? 'border border-orange-500 bg-orange-500/10 text-navy-900'
                    : 'border border-border bg-card-muted text-muted-foreground',
                )}
                onClick={() => updateAccount({ language: value })}
                disabled={value === 'pidgin'}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-border/60 bg-card p-4 shadow-[0_10px_24px_color-mix(in_srgb,var(--navy-950)_6%,transparent)]">
          <h2 className="text-sm font-bold text-foreground">Your plan</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            See remaining requests, vendors and messages in plain language.
          </p>
          <div className="mt-4">
            <Button href="/app/plan" className="w-full min-h-11">
              Open plan
            </Button>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-border/60 bg-card p-4 shadow-[0_10px_24px_color-mix(in_srgb,var(--navy-950)_6%,transparent)]">
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

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition',
        checked ? 'bg-orange-500' : 'bg-border',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 size-6 rounded-full bg-surface shadow transition',
          checked ? 'left-[1.35rem]' : 'left-0.5',
        )}
      />
    </button>
  );
}

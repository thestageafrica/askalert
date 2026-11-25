'use client';

import { useEffect, useState } from 'react';
import { Button, Input, cn } from '@askalert/ui';
import { AppHeader } from './app-header';
import { useAuth } from '../../lib/auth/auth-provider';
import { useMode } from '../../lib/auth/mode-provider';
import { useMockStore } from '../../lib/app/mock-store';
import { useNotificationsStore } from '../../lib/app/notifications-store';
import {
  getPushPermissionState,
  pushStateLabel,
  subscribeToPush,
  type PushPermissionState,
} from '../../lib/app/push-client';

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'plan', label: 'Plan' },
  { id: 'settings', label: 'Settings' },
] as const;

type AccountTab = (typeof TABS)[number]['id'];

export function AccountView() {
  const { account, updateAccount } = useMockStore();
  const { unreadCount } = useNotificationsStore();
  const { profile, user, requestDeletion, signOut, supabaseConfigured } = useAuth();
  const { vendorCta, switchTo } = useMode();
  const [tab, setTab] = useState<AccountTab>('profile');
  const [pushState, setPushState] = useState<PushPermissionState>('default');
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

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
      setPushMessage('Notifications are on for this device. Keep the app closed for the push test.');
      return;
    }
    setPushState(result.state);
    if (result.error) {
      setPushMessage(result.error);
      return;
    }
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
      <div className="lg:hidden">
        <AppHeader title="Account" subtitle="Your number, alerts and privacy." />
      </div>
      <div className="hidden px-0 pb-4 pt-2 lg:block">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your number, alerts and privacy.</p>
      </div>

      <div
        role="tablist"
        aria-label="Account sections"
        className="sticky top-0 z-10 -mx-4 flex gap-1 overflow-x-auto border-b border-border/70 bg-surface-subtle/95 px-4 py-2 backdrop-blur lg:static lg:mx-0 lg:rounded-[1.25rem] lg:border lg:border-border/60 lg:bg-card lg:px-2 lg:py-2 lg:shadow-sm"
      >
        {TABS.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`account-tab-${item.id}`}
              className={cn(
                'min-h-11 shrink-0 rounded-2xl px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
                selected
                  ? 'bg-orange-500 text-navy-900'
                  : 'text-muted-foreground hover:bg-card-muted hover:text-foreground',
              )}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-4 px-4 pt-4 lg:px-0" role="tabpanel" aria-labelledby={`account-tab-${tab}`}>
        {tab === 'profile' ? (
          <section className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-card shadow-[0_10px_24px_color-mix(in_srgb,var(--navy-950)_6%,transparent)]">
            <div className="border-b border-border/70 bg-gradient-to-r from-navy-950 to-navy-900 px-4 py-4 text-surface">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">Profile</p>
              <p className="mt-1 text-lg font-extrabold">
                {profile?.displayName || user?.email || account.phone}
              </p>
              <p className="mt-0.5 text-xs text-surface/65">
                {profile?.phoneE164
                  ? profile.phoneVerifiedAt
                    ? 'WhatsApp verified'
                    : 'Verify your WhatsApp number · pending'
                  : 'WhatsApp · Lagos Nigeria demo account'}
              </p>
            </div>
            <div className="space-y-3 p-4">
              <Input
                label="WhatsApp number"
                value={profile?.phoneE164 || account.phone}
                onChange={(event) => updateAccount({ phone: event.target.value })}
                disabled={Boolean(profile?.phoneE164)}
                hint={
                  profile?.phoneE164 && !profile.phoneVerifiedAt
                    ? 'Verification unlocks when the WhatsApp adapter is live.'
                    : undefined
                }
              />
              {supabaseConfigured ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-11"
                    onClick={() => switchTo('vendor')}
                  >
                    {vendorCta.label}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11"
                    onClick={() => void signOut(true)}
                  >
                    Sign out everywhere
                  </Button>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {tab === 'notifications' ? (
          <>
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
                disabled={
                  pushBusy || pushState === 'unsupported' || pushState === 'blocked'
                }
                onClick={() => void enablePush()}
              >
                {pushBusy
                  ? 'Enabling…'
                  : pushState === 'enabled'
                    ? 'Register this device again'
                    : 'Turn on notifications'}
              </Button>
              {pushState === 'enabled' ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Permission is on. Tap again to save this phone for closed-app push.
                </p>
              ) : null}
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
          </>
        ) : null}

        {tab === 'plan' ? (
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
        ) : null}

        {tab === 'settings' ? (
          <>
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
              <h2 className="text-sm font-bold text-foreground">Data and privacy</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Vendors only see your contact after you book. Account deletion is a soft request first —
                we keep what we need for disputes and the law, then remove the rest.
              </p>
              {deleteMessage ? (
                <p className="mt-2 text-sm font-medium text-foreground">{deleteMessage}</p>
              ) : null}
              <div className="mt-4 flex flex-col gap-2">
                {supabaseConfigured ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-11"
                    onClick={() => {
                      void requestDeletion().then((result) => {
                        setDeleteMessage(
                          result.error ??
                            'Deletion requested. We will process it and email you when it is done.',
                        );
                      });
                    }}
                  >
                    Request account deletion
                  </Button>
                ) : null}
                <Button href="/privacy" variant="secondary">
                  Privacy policy
                </Button>
                <Button href="/terms" variant="ghost">
                  Terms
                </Button>
              </div>
            </section>
          </>
        ) : null}
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

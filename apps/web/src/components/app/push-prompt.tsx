'use client';

import { useEffect, useState } from 'react';
import { Button, Sheet } from '@askalert/ui';
import {
  getPushPermissionState,
  pushStateLabel,
  subscribeToPush,
  type PushPermissionState,
} from '../../lib/app/push-client';

const DISMISS_KEY = 'askalert.pushPromptDismissed';
const FIRST_REQUEST_EVENT = 'askalert:first-request-created';

export function notifyFirstRequestCreated() {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(FIRST_REQUEST_EVENT));
}

export function PushPrompt() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<PushPermissionState>('default');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setState(getPushPermissionState());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const maybeOpen = () => {
      if (window.localStorage.getItem(DISMISS_KEY) === '1') {
        return;
      }
      const current = getPushPermissionState();
      setState(current);
      if (current === 'enabled' || current === 'blocked') {
        return;
      }
      setOpen(true);
    };

    // Only after the user creates a request — never on first load.
    window.addEventListener(FIRST_REQUEST_EVENT, maybeOpen);
    return () => window.removeEventListener(FIRST_REQUEST_EVENT, maybeOpen);
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, '1');
    setOpen(false);
  };

  const enable = async () => {
    setBusy(true);
    const result = await subscribeToPush();
    setBusy(false);
    if (result.ok) {
      setState('enabled');
      dismiss();
      return;
    }
    setState(result.state);
    if (result.error) {
      window.alert(result.error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen} title="Turn on notifications?">
      <p className="text-sm text-muted-foreground">
        Get a gentle ping when quotes are ready. We never put names, prices or phone numbers in
        the notification text.
      </p>
      {state === 'ios_needs_homescreen' ? (
        <p className="mt-3 text-sm font-medium text-navy-950">
          On iPhone, add AskAlert to your Home Screen, open it from that icon, then enable
          notifications.
        </p>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">Status: {pushStateLabel(state)}</p>
      <div className="mt-5 flex flex-col gap-2">
        {state !== 'ios_needs_homescreen' && state !== 'unsupported' ? (
          <Button type="button" className="min-h-11 w-full" disabled={busy} onClick={() => void enable()}>
            {busy ? 'Enabling…' : 'Turn on notifications'}
          </Button>
        ) : null}
        <Button type="button" variant="secondary" className="min-h-11 w-full" onClick={dismiss}>
          Not now
        </Button>
      </div>
    </Sheet>
  );
}

'use client';

import { Button, Sheet } from '@askalert/ui';
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

const VISITED_KEY = 'askalert.pwa.visited';
const DISMISSED_KEY = 'askalert.pwa.installDismissed';
const BOOKING_EVENT = 'askalert:show-install-prompt';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIosSafari() {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  const otherBrowser = /CriOS|Chrome|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit && !otherBrowser;
}

function isStandaloneDisplay() {
  if (typeof window === 'undefined') {
    return false;
  }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

/** Call after a successful booking to surface the install UI (never auto-shown on first visit). */
export function showInstallPromptAfterBooking() {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(BOOKING_EVENT));
}

export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [openAndroid, setOpenAndroid] = useState(false);
  const [openIos, setOpenIos] = useState(false);
  const [returningVisitor, setReturningVisitor] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const visited = window.localStorage.getItem(VISITED_KEY) === '1';
    if (!visited) {
      window.localStorage.setItem(VISITED_KEY, '1');
      setReturningVisitor(false);
      return;
    }
    setReturningVisitor(true);
  }, []);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const tryOpen = useCallback(
    (force = false) => {
      if (isStandaloneDisplay()) {
        return;
      }
      if (window.localStorage.getItem(DISMISSED_KEY) === '1') {
        return;
      }
      // Never auto-open on the very first visit; booking (force) is allowed.
      if (!force && !returningVisitor) {
        return;
      }
      if (isIosSafari()) {
        setOpenIos(true);
        return;
      }
      if (deferredPrompt) {
        setOpenAndroid(true);
      }
    },
    [deferredPrompt, returningVisitor],
  );

  useEffect(() => {
    const onBooking = () => tryOpen(true);
    window.addEventListener(BOOKING_EVENT, onBooking);
    return () => window.removeEventListener(BOOKING_EVENT, onBooking);
  }, [tryOpen]);

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, '1');
    setOpenAndroid(false);
    setOpenIos(false);
  };

  const installAndroid = async () => {
    if (!deferredPrompt) {
      return;
    }
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setOpenAndroid(false);
    window.localStorage.setItem(DISMISSED_KEY, '1');
  };

  return (
    <>
      {children}

      <Sheet open={openAndroid} onOpenChange={setOpenAndroid} title="Install AskAlert">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Add AskAlert to your home screen for a faster, app-like experience — even on a flaky
          connection.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button onClick={installAndroid}>Install AskAlert</Button>
          <Button variant="ghost" onClick={dismiss}>
            Not now
          </Button>
        </div>
      </Sheet>

      <Sheet open={openIos} onOpenChange={setOpenIos} title="Add AskAlert to Home Screen">
        <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
          <li>
            Tap <span className="font-semibold">Share</span> in Safari.
          </li>
          <li>
            Tap <span className="font-semibold">Add to Home Screen</span>.
          </li>
          <li>
            Tap <span className="font-semibold">Add</span> to finish.
          </li>
        </ol>
        <div className="mt-5">
          <Button variant="ghost" onClick={dismiss}>
            Got it
          </Button>
        </div>
      </Sheet>
    </>
  );
}

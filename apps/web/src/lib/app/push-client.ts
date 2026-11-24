'use client';

export type PushPermissionState =
  | 'unsupported'
  | 'blocked'
  | 'default'
  | 'enabled'
  | 'ios_needs_homescreen';

function isIosSafari(): boolean {
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

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function getPushPermissionState(): PushPermissionState {
  if (typeof window === 'undefined') {
    return 'unsupported';
  }
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    if (isIosSafari() && !isStandaloneDisplay()) {
      return 'ios_needs_homescreen';
    }
    return 'unsupported';
  }
  if (isIosSafari() && !isStandaloneDisplay()) {
    return 'ios_needs_homescreen';
  }
  if (Notification.permission === 'denied') {
    return 'blocked';
  }
  if (Notification.permission === 'granted') {
    return 'enabled';
  }
  return 'default';
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export async function subscribeToPush(): Promise<
  | { ok: true; subscription: PushSubscriptionJSON }
  | { ok: false; state: PushPermissionState; error?: string }
> {
  const state = getPushPermissionState();
  if (state === 'unsupported' || state === 'ios_needs_homescreen' || state === 'blocked') {
    return { ok: false, state };
  }

  const permission =
    Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, state: permission === 'denied' ? 'blocked' : 'default' };
  }

  const registration = await navigator.serviceWorker.ready;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    // Demo path: permission granted without a server key yet.
    return {
      ok: true,
      subscription: {
        endpoint: `https://local.askalert.demo/push/${Date.now()}`,
        keys: { p256dh: 'demo', auth: 'demo' },
      },
    };
  }

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    }));

  return { ok: true, subscription: subscription.toJSON() };
}

export function pushStateLabel(state: PushPermissionState): string {
  switch (state) {
    case 'enabled':
      return 'Enabled';
    case 'blocked':
      return 'Blocked in browser settings';
    case 'unsupported':
      return 'Not supported on this browser';
    case 'ios_needs_homescreen':
      return 'Add to Home Screen first';
    default:
      return 'Off';
  }
}

'use client';

import { webBrowserClient, webSupabaseEnabled } from '../supabase-browser';

export type PushPermissionState =
  | 'unsupported'
  | 'blocked'
  | 'default'
  | 'enabled'
  | 'ios_needs_homescreen';

const DEMO_USER_ID = 'demo-buyer';

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
    return {
      ok: false,
      state: 'unsupported',
      error: 'Push public key is missing on this build.',
    };
  }

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    }));

  const json = subscription.toJSON();
  const saved = await savePushSubscription(json);
  if (!saved.ok) {
    return { ok: false, state: 'default', error: saved.error };
  }

  return { ok: true, subscription: json };
}

async function savePushSubscription(
  subscription: PushSubscriptionJSON,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return { ok: false, error: 'Incomplete push subscription from the browser.' };
  }

  if (!webSupabaseEnabled()) {
    // Local mock mode: keep permission on, but server push cannot target this device.
    return { ok: true };
  }

  const client = webBrowserClient();
  if (!client) {
    return { ok: false, error: 'Supabase is not configured in this build.' };
  }

  const row = {
    user_id: DEMO_USER_ID,
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    device_label: navigator.userAgent.slice(0, 120),
  };

  const { error } = await client.from('push_subscriptions').upsert(row, {
    onConflict: 'user_id,endpoint',
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
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

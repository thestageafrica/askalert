/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();

type PushData = {
  title?: string;
  body?: string;
  url?: string;
  notificationId?: string;
};

self.addEventListener('push', (event) => {
  let data: PushData = {};
  try {
    data = event.data ? (event.data.json() as PushData) : {};
  } catch {
    data = { body: event.data?.text() };
  }

  const title = data.title?.trim() || 'AskAlert';
  const body = data.body?.trim() || 'You have a new update';
  const url = data.url?.startsWith('/') ? data.url : '/app/notifications/';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url, notificationId: data.notificationId },
      badge: '/icons/icon-192.png',
      icon: '/icons/icon-192.png',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl =
    typeof event.notification.data?.url === 'string'
      ? event.notification.data.url
      : '/app/notifications/';
  const target = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of windows) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            await (client as WindowClient).navigate(target);
          }
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});

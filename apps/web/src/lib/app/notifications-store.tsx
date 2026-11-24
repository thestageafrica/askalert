'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  buildPushPayload,
  type NotificationEventType,
} from '@askalert/channels';

export type AppNotification = {
  id: string;
  eventType: NotificationEventType;
  title: string;
  body: string;
  url: string;
  createdAt: string;
  readAt?: string;
};

type NotificationsStore = {
  items: AppNotification[];
  unreadCount: number;
  addNotification: (eventType: NotificationEventType, url?: string) => AppNotification;
  markRead: (id: string) => void;
  markAllRead: () => void;
};

const NotificationsContext = createContext<NotificationsStore | null>(null);

const seed: AppNotification[] = [
  {
    id: 'n_seed_quote',
    eventType: 'quotes_ready',
    title: 'AskAlert',
    body: 'You have a new quote',
    url: '/app/request/req_shortlet_01/',
    createdAt: new Date().toISOString(),
  },
];

export function NotificationsStoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<AppNotification[]>(seed);

  const addNotification = useCallback((eventType: NotificationEventType, url = '/app/') => {
    const payload = buildPushPayload({ eventType, url });
    const item: AppNotification = {
      id: `n_${Date.now()}`,
      eventType,
      title: payload.title,
      body: payload.body,
      url: payload.url,
      createdAt: new Date().toISOString(),
    };
    setItems((current) => [item, ...current]);
    return item;
  }, []);

  useEffect(() => {
    const onNotify = (event: Event) => {
      const detail = (event as CustomEvent<{ eventType?: NotificationEventType; url?: string }>)
        .detail;
      if (!detail?.eventType) {
        return;
      }
      addNotification(detail.eventType, detail.url);
    };
    window.addEventListener('askalert:notification', onNotify);
    return () => window.removeEventListener('askalert:notification', onNotify);
  }, [addNotification]);

  const markRead = useCallback((id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id && !item.readAt ? { ...item, readAt: new Date().toISOString() } : item,
      ),
    );
  }, []);

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    setItems((current) =>
      current.map((item) => (item.readAt ? item : { ...item, readAt: now })),
    );
  }, []);

  const unreadCount = items.filter((item) => !item.readAt).length;

  const value = useMemo(
    () => ({ items, unreadCount, addNotification, markRead, markAllRead }),
    [items, unreadCount, addNotification, markRead, markAllRead],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotificationsStore(): NotificationsStore {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotificationsStore must be used within NotificationsStoreProvider');
  }
  return ctx;
}

import { z } from 'zod';

export const notificationEventTypeSchema = z.enum([
  'quotes_ready',
  'vendor_replied',
  'booking_confirmed',
  'payment_issue',
  'reminder',
  'tip',
]);

export type NotificationEventType = z.infer<typeof notificationEventTypeSchema>;

export const notificationChannelSchema = z.enum(['in_app', 'push', 'email', 'whatsapp', 'sms']);
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;

export type QuietHours = {
  /** Local hour 0–23 inclusive start (default 21). */
  startHour: number;
  /** Local hour 0–23 exclusive end (default 7). */
  endHour: number;
};

export type NotificationPreferences = {
  channelsByEvent: Partial<Record<NotificationEventType, NotificationChannel[]>>;
  quietHours: QuietHours;
};

export const DEFAULT_QUIET_HOURS: QuietHours = {
  startHour: 21,
  endHour: 7,
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  channelsByEvent: {
    quotes_ready: ['in_app', 'push', 'email'],
    vendor_replied: ['in_app', 'push'],
    booking_confirmed: ['in_app', 'push', 'email'],
    payment_issue: ['in_app', 'push', 'email'],
    reminder: ['in_app'],
    tip: ['in_app'],
  },
  quietHours: DEFAULT_QUIET_HOURS,
};

export type PushSubscriptionKeys = {
  p256dh: string;
  auth: string;
};

export type PushSubscriptionRecord = {
  userId: string;
  endpoint: string;
  keys: PushSubscriptionKeys;
  deviceLabel?: string;
};

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
  notificationId?: string;
};

export type PushSendResult = {
  ok: boolean;
  statusCode?: number;
  /** True when the endpoint should be removed (404/410). */
  gone?: boolean;
  error?: string;
};

export type PushProvider = {
  readonly name: string;
  buildPayload: (input: {
    eventType: NotificationEventType;
    url: string;
    notificationId?: string;
  }) => PushPayload;
  send: (
    subscription: PushSubscriptionRecord,
    payload: PushPayload,
  ) => Promise<PushSendResult>;
};

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  eventType: NotificationEventType;
};

export type EmailSendResult = {
  ok: boolean;
  providerId?: string;
  error?: string;
};

/** Free-tier friendly email port (Resend recommended). */
export type EmailProvider = {
  readonly name: string;
  send: (message: EmailMessage) => Promise<EmailSendResult>;
};

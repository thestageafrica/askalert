import { z } from 'zod';

export const notificationEventTypeSchema = z.enum([
  'quotes_ready',
  'vendor_replied',
  'lead_alert',
  'booking_confirmed',
  'payment_issue',
  'reminder',
  'tip',
]);

export type NotificationEventType = z.infer<typeof notificationEventTypeSchema>;

export const notificationPrioritySchema = z.enum(['critical', 'high', 'normal', 'low']);
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>;

export const notificationChannelSchema = z.enum([
  'in_app',
  'push',
  'email',
  'whatsapp',
  'sms',
]);

export type NotificationChannel = z.infer<typeof notificationChannelSchema>;

export type QuietHours = {
  startHour: number;
  endHour: number;
};

export type NotificationPreferences = {
  channelsByEvent: Partial<Record<NotificationEventType, NotificationChannel[]>>;
  quietHours: QuietHours;
  /** When false, SMS is never used even for critical events. */
  smsAllowed?: boolean;
};

export const DEFAULT_QUIET_HOURS: QuietHours = {
  startHour: 21,
  endHour: 7,
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  channelsByEvent: {
    quotes_ready: ['in_app', 'push', 'email'],
    vendor_replied: ['in_app', 'push'],
    lead_alert: ['in_app', 'push', 'email'],
    booking_confirmed: ['in_app', 'push', 'email'],
    payment_issue: ['in_app', 'push', 'email', 'sms'],
    reminder: ['in_app'],
    tip: ['in_app'],
  },
  quietHours: DEFAULT_QUIET_HOURS,
  smsAllowed: false,
};

/** Cheapest → most expensive. */
export const CHANNEL_COST_ORDER: NotificationChannel[] = [
  'in_app',
  'push',
  'email',
  'whatsapp',
  'sms',
];

export type NotificationEvent = {
  id: string;
  type: NotificationEventType;
  userId: string;
  unread?: boolean;
  /** Minutes since the event was created (for escalation). */
  ageMinutes?: number;
};

export type ChannelDecision = {
  channel: NotificationChannel;
  outcome: 'send_now' | 'escalate_later' | 'skip';
  reason: string;
  afterMinutes?: number;
};

export type DeliveryPlan = {
  eventId: string;
  eventType: NotificationEventType;
  priority: NotificationPriority;
  sendNow: NotificationChannel[];
  escalateLater: Array<{ channel: NotificationChannel; afterMinutes: number; reason: string }>;
  decisions: ChannelDecision[];
  /** Plain-language summary for admin. */
  summary: string;
  usageToRecord: Array<'push' | 'email' | 'wa_service' | 'sms'>;
};

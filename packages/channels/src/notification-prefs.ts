import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationChannel,
  type NotificationEventType,
  type NotificationPreferences,
  type QuietHours,
} from './push-types';

export function isWithinQuietHours(
  quietHours: QuietHours,
  now: Date = new Date(),
): boolean {
  const hour = now.getHours();
  const { startHour, endHour } = quietHours;
  if (startHour === endHour) {
    return false;
  }
  // Overnight window e.g. 21 → 7
  if (startHour > endHour) {
    return hour >= startHour || hour < endHour;
  }
  return hour >= startHour && hour < endHour;
}

export function channelsAllowedForEvent(
  prefs: NotificationPreferences,
  eventType: NotificationEventType,
  options: { now?: Date; allowPushDuringQuietHours?: boolean } = {},
): NotificationChannel[] {
  const configured =
    prefs.channelsByEvent[eventType] ??
    DEFAULT_NOTIFICATION_PREFERENCES.channelsByEvent[eventType] ??
    ['in_app'];
  const quiet = isWithinQuietHours(prefs.quietHours, options.now ?? new Date());
  if (!quiet || options.allowPushDuringQuietHours) {
    return [...configured];
  }
  // During quiet hours keep in-app only; defer push/email/whatsapp/sms.
  return configured.filter((channel) => channel === 'in_app');
}

export function shouldCleanupSubscription(statusCode: number | undefined): boolean {
  return statusCode === 404 || statusCode === 410;
}

export function mergePreferences(
  partial: Partial<NotificationPreferences>,
): NotificationPreferences {
  return {
    channelsByEvent: {
      ...DEFAULT_NOTIFICATION_PREFERENCES.channelsByEvent,
      ...partial.channelsByEvent,
    },
    quietHours: {
      ...DEFAULT_NOTIFICATION_PREFERENCES.quietHours,
      ...partial.quietHours,
    },
  };
}

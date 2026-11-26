import { checkEntitlement } from './entitlements';
import {
  CHANNEL_COST_ORDER,
  DEFAULT_NOTIFICATION_PREFERENCES,
  type ChannelDecision,
  type DeliveryPlan,
  type NotificationChannel,
  type NotificationEvent,
  type NotificationEventType,
  type NotificationPreferences,
  type NotificationPriority,
  type QuietHours,
} from './notification-types';
import type { UserPlanState } from './types';

const PRIORITY_BY_EVENT: Record<NotificationEventType, NotificationPriority> = {
  booking_confirmed: 'critical',
  payment_issue: 'critical',
  quotes_ready: 'high',
  vendor_replied: 'high',
  lead_alert: 'high',
  reminder: 'normal',
  tip: 'low',
};

/** Minutes to wait before escalating to the next paid channel. */
const ESCALATION_DELAY_MINUTES: Record<NotificationPriority, number> = {
  critical: 5,
  high: 30,
  normal: 120,
  low: 24 * 60,
};

export function getNotificationPriority(type: NotificationEventType): NotificationPriority {
  return PRIORITY_BY_EVENT[type];
}

export function isWithinQuietHours(quietHours: QuietHours, now = new Date()): boolean {
  const hour = now.getHours();
  const { startHour, endHour } = quietHours;
  if (startHour === endHour) {
    return false;
  }
  if (startHour > endHour) {
    return hour >= startHour || hour < endHour;
  }
  return hour >= startHour && hour < endHour;
}

export type RouteNotificationContext = {
  preferences?: NotificationPreferences;
  planState: UserPlanState;
  now?: Date;
  /** When true, event is still unread and may escalate. Default true. */
  stillUnread?: boolean;
  smsAllowedOverride?: boolean;
};

function preferredChannels(
  prefs: NotificationPreferences,
  eventType: NotificationEventType,
): NotificationChannel[] {
  return (
    prefs.channelsByEvent[eventType] ??
    DEFAULT_NOTIFICATION_PREFERENCES.channelsByEvent[eventType] ??
    ['in_app']
  );
}

function channelAllowedByPrefs(
  channel: NotificationChannel,
  preferred: NotificationChannel[],
): boolean {
  return preferred.includes(channel);
}

/**
 * Pure notification router. Chooses cheaper channels first and plans escalations
 * if the event stays unread.
 */
export function routeNotification(
  event: NotificationEvent,
  _user: { userId: string },
  context: RouteNotificationContext,
): DeliveryPlan {
  const now = context.now ?? new Date();
  const prefs = context.preferences ?? DEFAULT_NOTIFICATION_PREFERENCES;
  const priority = getNotificationPriority(event.type);
  const preferred = preferredChannels(prefs, event.type);
  const quiet = isWithinQuietHours(prefs.quietHours, now);
  const stillUnread = context.stillUnread ?? event.unread ?? true;
  const ageMinutes = event.ageMinutes ?? 0;
  const smsAllowed = context.smsAllowedOverride ?? prefs.smsAllowed ?? false;
  const escalationDelay = ESCALATION_DELAY_MINUTES[priority];

  const decisions: ChannelDecision[] = [];
  const sendNow: NotificationChannel[] = [];
  const escalateLater: DeliveryPlan['escalateLater'] = [];
  const usageToRecord: DeliveryPlan['usageToRecord'] = [];

  for (const channel of CHANNEL_COST_ORDER) {
    if (channel !== 'in_app' && !channelAllowedByPrefs(channel, preferred)) {
      decisions.push({
        channel,
        outcome: 'skip',
        reason: `Skipped ${channel}: not enabled for ${event.type.replace(/_/g, ' ')}.`,
      });
      continue;
    }

    if (channel === 'in_app') {
      decisions.push({
        channel,
        outcome: 'send_now',
        reason: 'In-app is free and always used first.',
      });
      sendNow.push('in_app');
      continue;
    }

    if (channel === 'sms') {
      if (priority !== 'critical') {
        decisions.push({
          channel,
          outcome: 'skip',
          reason: 'SMS is only for critical events.',
        });
        continue;
      }
      if (!smsAllowed) {
        decisions.push({
          channel,
          outcome: 'skip',
          reason: 'SMS is turned off in user preferences.',
        });
        continue;
      }
    }

    if (channel === 'whatsapp') {
      const wa = checkEntitlement(context.planState, 'send_whatsapp', { now });
      if (wa.outcome === 'block') {
        decisions.push({
          channel,
          outcome: 'skip',
          reason: wa.reason,
        });
        continue;
      }
    }

    if (quiet && priority !== 'critical') {
      decisions.push({
        channel,
        outcome: 'escalate_later',
        reason: `Quiet hours (${prefs.quietHours.startHour}:00–${prefs.quietHours.endHour}:00). Hold ${channel} until morning.`,
        afterMinutes: minutesUntilQuietEnds(prefs.quietHours, now),
      });
      escalateLater.push({
        channel,
        afterMinutes: minutesUntilQuietEnds(prefs.quietHours, now),
        reason: `After quiet hours, send ${channel}.`,
      });
      continue;
    }

    if (!channelAllowedByPrefs(channel, preferred)) {
      decisions.push({
        channel,
        outcome: 'skip',
        reason: `Skipped ${channel}: not in preferences for this event.`,
      });
      continue;
    }

    // Cheaper channels first: push/email go now; WhatsApp/SMS escalate if still unread.
    const isExpensive = channel === 'whatsapp' || channel === 'sms';
    if (isExpensive) {
      if (!stillUnread) {
        decisions.push({
          channel,
          outcome: 'skip',
          reason: `Skipped ${channel}: event already read.`,
        });
        continue;
      }
      if (ageMinutes >= escalationDelay) {
        decisions.push({
          channel,
          outcome: 'send_now',
          reason: `Escalate to ${channel}: still unread after ${escalationDelay} minutes.`,
        });
        sendNow.push(channel);
        usageToRecord.push(channel === 'whatsapp' ? 'wa_service' : 'sms');
      } else {
        const wait = Math.max(0, escalationDelay - ageMinutes);
        decisions.push({
          channel,
          outcome: 'escalate_later',
          reason: `Hold ${channel} for ${wait} more minutes unless the user reads the alert.`,
          afterMinutes: wait,
        });
        escalateLater.push({
          channel,
          afterMinutes: wait,
          reason: `If still unread, send ${channel}.`,
        });
      }
      continue;
    }

    // push / email — send now (respecting quiet hours handled above)
    decisions.push({
      channel,
      outcome: 'send_now',
      reason: `Send ${channel} now (cheap channel after in-app).`,
    });
    sendNow.push(channel);
    if (channel === 'push') {
      usageToRecord.push('push');
    }
    if (channel === 'email') {
      usageToRecord.push('email');
    }
  }

  const summary = buildSummary(event.type, priority, sendNow, escalateLater, quiet);

  return {
    eventId: event.id,
    eventType: event.type,
    priority,
    sendNow,
    escalateLater,
    decisions,
    summary,
    usageToRecord,
  };
}

function minutesUntilQuietEnds(quietHours: QuietHours, now: Date): number {
  if (!isWithinQuietHours(quietHours, now)) {
    return 0;
  }
  const end = new Date(now);
  end.setMinutes(0, 0, 0);
  end.setHours(quietHours.endHour);
  if (end.getTime() <= now.getTime()) {
    end.setDate(end.getDate() + 1);
  }
  return Math.max(1, Math.ceil((end.getTime() - now.getTime()) / 60_000));
}

function buildSummary(
  type: NotificationEventType,
  priority: NotificationPriority,
  sendNow: NotificationChannel[],
  escalateLater: DeliveryPlan['escalateLater'],
  quiet: boolean,
): string {
  const label = type.replace(/_/g, ' ');
  const nowList = sendNow.length ? sendNow.join(', ') : 'none';
  const later = escalateLater.length
    ? escalateLater.map((item) => `${item.channel} in ${item.afterMinutes}m`).join('; ')
    : 'none';
  const quietNote = quiet ? ' Quiet hours are active.' : '';
  return `${priority} “${label}”: send now via ${nowList}. Escalate later: ${later}.${quietNote}`;
}

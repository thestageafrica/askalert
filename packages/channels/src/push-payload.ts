import type { NotificationEventType, PushPayload } from './push-types';

/**
 * Generic copy only — never names, prices, phones or addresses.
 */
const BODIES: Record<NotificationEventType, { title: string; body: string }> = {
  quotes_ready: {
    title: 'AskAlert',
    body: 'You have a new quote',
  },
  vendor_replied: {
    title: 'AskAlert',
    body: 'You have a new message',
  },
  booking_confirmed: {
    title: 'AskAlert',
    body: 'Your booking is confirmed',
  },
  payment_issue: {
    title: 'AskAlert',
    body: 'There is an update on your payment',
  },
  reminder: {
    title: 'AskAlert',
    body: 'You have a reminder',
  },
  tip: {
    title: 'AskAlert',
    body: 'You have a tip from AskAlert',
  },
};

export function buildPushPayload(input: {
  eventType: NotificationEventType;
  url: string;
  notificationId?: string;
}): PushPayload {
  const copy = BODIES[input.eventType];
  return {
    title: copy.title,
    body: copy.body,
    url: input.url,
    tag: input.eventType,
    notificationId: input.notificationId,
  };
}

/** Reject payloads that accidentally include sensitive details. */
export function assertGenericPushCopy(payload: PushPayload): void {
  const haystack = `${payload.title} ${payload.body}`.toLowerCase();
  const forbidden = [
    /₦/,
    /naira/,
    /\+?234/,
    /0[789][01]\d{8}/,
    /@/,
    /lekki|ikoyi|ajah|oniru|victoria island/i,
    /\d{1,3}(?:,\d{3})+/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(haystack)) {
      throw new Error('Push copy must stay generic (no names, prices, phones or places).');
    }
  }
}

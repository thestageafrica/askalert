import { assertGenericPushCopy, buildPushPayload } from './push-payload';
import type {
  PushPayload,
  PushProvider,
  PushSendResult,
  PushSubscriptionRecord,
} from './push-types';

/**
 * Client/server helper for VAPID web push without Firebase.
 * Actual HTTP delivery runs in the send-push Edge Function (web-push npm).
 * This provider builds safe payloads and records local/mock send outcomes.
 */
export class VapidPushProvider implements PushProvider {
  readonly name = 'vapid';

  buildPayload(input: {
    eventType: Parameters<PushProvider['buildPayload']>[0]['eventType'];
    url: string;
    notificationId?: string;
  }): PushPayload {
    const payload = buildPushPayload(input);
    assertGenericPushCopy(payload);
    return payload;
  }

  /**
   * Local/mock send — production delivery is Edge Function `send-push`.
   * Returns `gone` for 404/410 so callers can delete the row.
   */
  async send(
    subscription: PushSubscriptionRecord,
    payload: PushPayload,
    options?: { statusCode?: number },
  ): Promise<PushSendResult> {
    assertGenericPushCopy(payload);
    if (!subscription.endpoint.startsWith('https://')) {
      return { ok: false, error: 'Invalid push endpoint.' };
    }
    const statusCode = options?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      return { ok: false, statusCode, gone: true, error: 'Subscription gone.' };
    }
    if (statusCode && statusCode >= 400) {
      return { ok: false, statusCode, error: `Push failed (${statusCode}).` };
    }
    return { ok: true, statusCode: statusCode ?? 201 };
  }
}

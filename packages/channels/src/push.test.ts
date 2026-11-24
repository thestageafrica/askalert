import { describe, expect, it } from 'vitest';
import { importantEventNeedsEmail, ResendEmailProvider } from './email-provider';
import {
  channelsAllowedForEvent,
  isWithinQuietHours,
  shouldCleanupSubscription,
} from './notification-prefs';
import { assertGenericPushCopy, buildPushPayload } from './push-payload';
import { DEFAULT_NOTIFICATION_PREFERENCES } from './push-types';
import { VapidPushProvider } from './vapid-push-provider';

describe('push payload', () => {
  it('builds generic quote copy', () => {
    const payload = buildPushPayload({
      eventType: 'quotes_ready',
      url: '/app/notifications/',
      notificationId: 'n1',
    });
    expect(payload.body).toBe('You have a new quote');
    expect(() => assertGenericPushCopy(payload)).not.toThrow();
  });

  it('rejects prices in push copy', () => {
    expect(() =>
      assertGenericPushCopy({
        title: 'AskAlert',
        body: 'Lagos Nest quoted ₦128,500',
        url: '/app/',
      }),
    ).toThrow(/generic/i);
  });
});

describe('subscription cleanup', () => {
  it('removes 404 and 410 endpoints', () => {
    expect(shouldCleanupSubscription(404)).toBe(true);
    expect(shouldCleanupSubscription(410)).toBe(true);
    expect(shouldCleanupSubscription(500)).toBe(false);
    expect(shouldCleanupSubscription(201)).toBe(false);
  });

  it('VapidPushProvider marks gone subscriptions', async () => {
    const provider = new VapidPushProvider();
    const payload = provider.buildPayload({
      eventType: 'booking_confirmed',
      url: '/app/requests/',
    });
    const result = await provider.send(
      {
        userId: 'u1',
        endpoint: 'https://push.example/sub',
        keys: { p256dh: 'x', auth: 'y' },
      },
      payload,
      { statusCode: 410 },
    );
    expect(result.gone).toBe(true);
    expect(result.ok).toBe(false);
  });
});

describe('notification preferences and quiet hours', () => {
  it('detects overnight quiet hours (21:00–07:00)', () => {
    expect(
      isWithinQuietHours(
        DEFAULT_NOTIFICATION_PREFERENCES.quietHours,
        new Date('2026-11-24T22:30:00'),
      ),
    ).toBe(true);
    expect(
      isWithinQuietHours(
        DEFAULT_NOTIFICATION_PREFERENCES.quietHours,
        new Date('2026-11-24T06:30:00'),
      ),
    ).toBe(true);
    expect(
      isWithinQuietHours(
        DEFAULT_NOTIFICATION_PREFERENCES.quietHours,
        new Date('2026-11-24T10:00:00'),
      ),
    ).toBe(false);
  });

  it('keeps only in-app during quiet hours', () => {
    const channels = channelsAllowedForEvent(
      DEFAULT_NOTIFICATION_PREFERENCES,
      'quotes_ready',
      { now: new Date('2026-11-24T22:00:00') },
    );
    expect(channels).toEqual(['in_app']);
  });

  it('allows push outside quiet hours', () => {
    const channels = channelsAllowedForEvent(
      DEFAULT_NOTIFICATION_PREFERENCES,
      'quotes_ready',
      { now: new Date('2026-11-24T12:00:00') },
    );
    expect(channels).toContain('push');
    expect(channels).toContain('email');
  });
});

describe('email fallback', () => {
  it('flags important events for email', () => {
    expect(importantEventNeedsEmail('quotes_ready')).toBe(true);
    expect(importantEventNeedsEmail('booking_confirmed')).toBe(true);
    expect(importantEventNeedsEmail('tip')).toBe(false);
  });

  it('Resend stub sends without network when key missing', async () => {
    const provider = new ResendEmailProvider();
    const result = await provider.send({
      to: 'buyer@example.com',
      subject: 'AskAlert update',
      text: 'You have a new quote',
      eventType: 'quotes_ready',
    });
    expect(result.ok).toBe(true);
    expect(result.providerId).toMatch(/mock_resend/);
  });
});

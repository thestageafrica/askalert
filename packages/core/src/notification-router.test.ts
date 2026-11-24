import { describe, expect, it } from 'vitest';
import { createFreeSubscription, completeMockPurchase } from './subscription';
import {
  getNotificationPriority,
  isWithinQuietHours,
  routeNotification,
} from './notification-router';
import { DEFAULT_NOTIFICATION_PREFERENCES } from './notification-types';

const noon = new Date('2026-11-24T12:00:00');
const late = new Date('2026-11-24T22:30:00');

describe('notification priority', () => {
  it('maps event types to priorities', () => {
    expect(getNotificationPriority('payment_issue')).toBe('critical');
    expect(getNotificationPriority('quotes_ready')).toBe('high');
    expect(getNotificationPriority('reminder')).toBe('normal');
    expect(getNotificationPriority('tip')).toBe('low');
  });
});

describe('routeNotification', () => {
  it('sends in-app and push first for quotes ready outside quiet hours', () => {
    const state = createFreeSubscription({
      userId: 'u1',
      audience: 'buyer',
      now: noon,
    });
    const plan = routeNotification(
      { id: 'e1', type: 'quotes_ready', userId: 'u1' },
      { userId: 'u1' },
      { planState: state, now: noon },
    );
    expect(plan.priority).toBe('high');
    expect(plan.sendNow).toContain('in_app');
    expect(plan.sendNow).toContain('push');
    expect(plan.sendNow).toContain('email');
    expect(plan.usageToRecord).toEqual(expect.arrayContaining(['push', 'email']));
    expect(plan.summary.toLowerCase()).toMatch(/quotes ready/);
  });

  it('defers push and email during quiet hours for non-critical events', () => {
    const state = createFreeSubscription({
      userId: 'u1',
      audience: 'buyer',
      now: late,
    });
    const plan = routeNotification(
      { id: 'e2', type: 'quotes_ready', userId: 'u1' },
      { userId: 'u1' },
      { planState: state, now: late },
    );
    expect(plan.sendNow).toEqual(['in_app']);
    expect(plan.escalateLater.some((item) => item.channel === 'push')).toBe(true);
    expect(plan.summary).toMatch(/Quiet hours/i);
  });

  it('still allows critical push during quiet hours', () => {
    const state = createFreeSubscription({
      userId: 'u1',
      audience: 'buyer',
      now: late,
    });
    const plan = routeNotification(
      { id: 'e3', type: 'payment_issue', userId: 'u1' },
      { userId: 'u1' },
      {
        planState: state,
        now: late,
        preferences: {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          channelsByEvent: {
            ...DEFAULT_NOTIFICATION_PREFERENCES.channelsByEvent,
            payment_issue: ['in_app', 'push', 'email'],
          },
        },
      },
    );
    expect(plan.sendNow).toContain('push');
    expect(isWithinQuietHours(DEFAULT_NOTIFICATION_PREFERENCES.quietHours, late)).toBe(true);
  });

  it('skips WhatsApp on buyer free and escalates only after delay on Starter', () => {
    const free = createFreeSubscription({ userId: 'u1', audience: 'buyer', now: noon });
    const freePlan = routeNotification(
      { id: 'e4', type: 'booking_confirmed', userId: 'u1', ageMinutes: 10 },
      { userId: 'u1' },
      {
        planState: free,
        now: noon,
        preferences: {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          channelsByEvent: {
            booking_confirmed: ['in_app', 'push', 'email', 'whatsapp'],
          },
        },
      },
    );
    expect(freePlan.decisions.find((d) => d.channel === 'whatsapp')?.outcome).toBe('skip');

    const { state: starter } = completeMockPurchase({
      state: free,
      kind: 'starter_pass',
      now: noon,
    });
    const early = routeNotification(
      { id: 'e5', type: 'booking_confirmed', userId: 'u1', ageMinutes: 1 },
      { userId: 'u1' },
      {
        planState: starter,
        now: noon,
        preferences: {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          channelsByEvent: {
            booking_confirmed: ['in_app', 'push', 'email', 'whatsapp'],
          },
        },
      },
    );
    expect(early.escalateLater.some((item) => item.channel === 'whatsapp')).toBe(true);

    const lateEscalate = routeNotification(
      { id: 'e6', type: 'booking_confirmed', userId: 'u1', ageMinutes: 10 },
      { userId: 'u1' },
      {
        planState: starter,
        now: noon,
        preferences: {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          channelsByEvent: {
            booking_confirmed: ['in_app', 'push', 'email', 'whatsapp'],
          },
        },
      },
    );
    expect(lateEscalate.sendNow).toContain('whatsapp');
  });

  it('skips SMS unless critical and allowed', () => {
    const state = createFreeSubscription({ userId: 'u1', audience: 'buyer', now: noon });
    const blocked = routeNotification(
      { id: 'e7', type: 'payment_issue', userId: 'u1', ageMinutes: 10 },
      { userId: 'u1' },
      {
        planState: state,
        now: noon,
        preferences: {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          smsAllowed: false,
          channelsByEvent: {
            payment_issue: ['in_app', 'push', 'sms'],
          },
        },
      },
    );
    expect(blocked.decisions.find((d) => d.channel === 'sms')?.outcome).toBe('skip');

    const allowed = routeNotification(
      { id: 'e8', type: 'payment_issue', userId: 'u1', ageMinutes: 10 },
      { userId: 'u1' },
      {
        planState: state,
        now: noon,
        preferences: {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          smsAllowed: true,
          channelsByEvent: {
            payment_issue: ['in_app', 'push', 'sms'],
          },
        },
      },
    );
    expect(allowed.sendNow).toContain('sms');
  });

  it('does not escalate expensive channels when already read', () => {
    const { state } = completeMockPurchase({
      state: createFreeSubscription({ userId: 'u1', audience: 'buyer', now: noon }),
      kind: 'starter_pass',
      now: noon,
    });
    const plan = routeNotification(
      {
        id: 'e9',
        type: 'booking_confirmed',
        userId: 'u1',
        ageMinutes: 30,
        unread: false,
      },
      { userId: 'u1' },
      {
        planState: state,
        now: noon,
        stillUnread: false,
        preferences: {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          channelsByEvent: {
            booking_confirmed: ['in_app', 'push', 'whatsapp'],
          },
        },
      },
    );
    expect(plan.sendNow).not.toContain('whatsapp');
  });
});

describe('quiet hours helper', () => {
  it('detects overnight window', () => {
    expect(isWithinQuietHours({ startHour: 21, endHour: 7 }, late)).toBe(true);
    expect(isWithinQuietHours({ startHour: 21, endHour: 7 }, noon)).toBe(false);
  });
});

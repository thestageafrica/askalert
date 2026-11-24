import { describe, expect, it } from 'vitest';
import { DEFAULT_UNIT_COSTS } from './cost';
import { applyEarnedCredits, getUsageSummary, recordUsage } from './usage';
import { createFreeSubscription } from './subscription';
import { checkEntitlement } from './entitlements';

const now = new Date('2026-11-24T12:00:00.000Z');

describe('recordUsage and credits', () => {
  it('records usage immutably and estimates cost from settings', () => {
    const state = createFreeSubscription({ userId: 'u1', audience: 'buyer', now });
    const first = recordUsage({
      state,
      type: 'request',
      settings: DEFAULT_UNIT_COSTS,
      now,
    });
    expect(first.state.usage.requests).toBe(1);
    expect(state.usage.requests).toBe(0);

    const second = recordUsage({
      state: first.state,
      type: 'ai_suggestion',
      settings: DEFAULT_UNIT_COSTS,
      now,
    });
    expect(second.event.estCostMinor).toBe(200);
    expect(second.state.usage.aiSuggestions).toBe(1);
  });

  it('supports concurrent-style updates from the same snapshot without double-count confusion', () => {
    const state = createFreeSubscription({ userId: 'u1', audience: 'buyer', now });
    const a = recordUsage({ state, type: 'relay_message', settings: DEFAULT_UNIT_COSTS, now });
    const b = recordUsage({ state, type: 'relay_message', settings: DEFAULT_UNIT_COSTS, now });
    // Each branch sees +1 from the same base; a reducer must merge carefully.
    expect(a.state.usage.relayedMessages).toBe(1);
    expect(b.state.usage.relayedMessages).toBe(1);
    const merged = {
      ...a.state,
      usage: {
        ...a.state.usage,
        relayedMessages: a.state.usage.relayedMessages + b.state.usage.relayedMessages,
      },
    };
    expect(merged.usage.relayedMessages).toBe(2);
  });

  it('applies earned lead alert credits for vendors', () => {
    let state = createFreeSubscription({ userId: 'v1', audience: 'vendor', now });
    state = applyEarnedCredits(state, 1);
    expect(state.bonusLeadAlerts).toBe(10);
    // Used 20 of base 20 → would block without bonus; with bonus limit=30
    state = {
      ...state,
      usage: { ...state.usage, leadAlerts: 20 },
    };
    const decision = checkEntitlement(state, 'send_whatsapp', { now });
    expect(decision.outcome).toBe('allow');
  });

  it('summarises estimated cost from events', () => {
    const state = createFreeSubscription({ userId: 'u1', audience: 'buyer', now });
    const { event } = recordUsage({
      state,
      type: 'wa_service',
      units: 2,
      settings: DEFAULT_UNIT_COSTS,
      now,
    });
    const summary = getUsageSummary([event]);
    expect(summary.estimatedCostMinor).toBe(700);
  });
});

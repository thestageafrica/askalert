import { describe, expect, it } from 'vitest';
import { createFreeSubscription, withUsageAt } from './subscription';
import { planVendorLeadDelivery, scoreVendorResponsiveness } from './vendor-leads';

const now = new Date('2026-11-24T12:00:00.000Z');

describe('scoreVendorResponsiveness', () => {
  it('scores response rate and median reply time over the last 10 leads', () => {
    const score = scoreVendorResponsiveness([
      {
        id: '1',
        sentAt: '2026-11-01T10:00:00.000Z',
        outcome: 'responded',
        replyLatencyMinutes: 10,
      },
      {
        id: '2',
        sentAt: '2026-11-02T10:00:00.000Z',
        outcome: 'responded',
        replyLatencyMinutes: 20,
      },
      {
        id: '3',
        sentAt: '2026-11-03T10:00:00.000Z',
        outcome: 'ignored',
      },
    ]);
    expect(score.sampleSize).toBe(3);
    expect(score.responseRate).toBeCloseTo(2 / 3);
    expect(score.medianReplyMinutes).toBe(15);
    expect(score.plainSummary).toMatch(/Responded to 2 of last 3/);
  });

  it('counts ignored streak from the newest settled leads', () => {
    const score = scoreVendorResponsiveness([
      { id: '1', sentAt: 'a', outcome: 'responded', replyLatencyMinutes: 5 },
      { id: '2', sentAt: 'b', outcome: 'ignored' },
      { id: '3', sentAt: 'c', outcome: 'ignored' },
      { id: '4', sentAt: 'd', outcome: 'ignored' },
    ]);
    expect(score.ignoredStreak).toBe(3);
  });
});

describe('planVendorLeadDelivery', () => {
  it('sends realtime when the vendor is responsive', () => {
    const state = createFreeSubscription({ userId: 'v1', audience: 'vendor', now });
    const plan = planVendorLeadDelivery({
      planState: state,
      recentLeads: [
        { id: '1', sentAt: 'a', outcome: 'responded', replyLatencyMinutes: 8 },
      ],
      pendingLeads: [{ leadId: 'L1', title: 'Shortlet ask' }],
      now,
    });
    expect(plan.mode).toBe('realtime');
    expect(plan.sendNow).toBe(true);
    expect(plan.batch).toHaveLength(1);
  });

  it('switches to digest plus push after 3 ignored leads', () => {
    const state = createFreeSubscription({ userId: 'v1', audience: 'vendor', now });
    const plan = planVendorLeadDelivery({
      planState: state,
      recentLeads: [
        { id: '1', sentAt: 'a', outcome: 'ignored' },
        { id: '2', sentAt: 'b', outcome: 'ignored' },
        { id: '3', sentAt: 'c', outcome: 'ignored' },
      ],
      pendingLeads: [
        { leadId: 'L1', title: 'A' },
        { leadId: 'L2', title: 'B' },
      ],
      now,
    });
    expect(plan.mode).toBe('push_digest');
    expect(plan.useDigest).toBe(true);
    expect(plan.usePush).toBe(true);
    expect(plan.batch.length).toBeGreaterThan(0);
  });

  it('batches several pending leads into one digest', () => {
    const state = createFreeSubscription({ userId: 'v1', audience: 'vendor', now });
    const plan = planVendorLeadDelivery({
      planState: state,
      recentLeads: [
        { id: '1', sentAt: 'a', outcome: 'responded', replyLatencyMinutes: 12 },
      ],
      pendingLeads: [
        { leadId: 'L1', title: 'A' },
        { leadId: 'L2', title: 'B' },
        { leadId: 'L3', title: 'C' },
      ],
      now,
    });
    expect(plan.mode).toBe('digest');
    expect(plan.useDigest).toBe(true);
    expect(plan.batch).toHaveLength(3);
  });

  it('blocks when monthly lead allowance is exhausted', () => {
    const state = withUsageAt(
      createFreeSubscription({ userId: 'v1', audience: 'vendor', now }),
      { leadAlerts: 20 },
    );
    const plan = planVendorLeadDelivery({
      planState: state,
      recentLeads: [],
      pendingLeads: [{ leadId: 'L1', title: 'A' }],
      now,
    });
    expect(plan.mode).toBe('blocked');
    expect(plan.sendNow).toBe(false);
    expect(plan.plainSummary).toMatch(/allowance/i);
  });

  it('blocks when per-request message budget is used', () => {
    const state = createFreeSubscription({ userId: 'v1', audience: 'vendor', now });
    const plan = planVendorLeadDelivery({
      planState: state,
      recentLeads: [],
      pendingLeads: [{ leadId: 'L1', title: 'A' }],
      requestMessageCount: 3,
      requestMessageBudget: 3,
      now,
    });
    expect(plan.mode).toBe('blocked');
    expect(plan.reasons.join(' ')).toMatch(/budget/i);
  });
});

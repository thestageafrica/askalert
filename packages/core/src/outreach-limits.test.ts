import { describe, expect, it } from 'vitest';
import {
  instantQuoteFromRateCard,
  markNonResponderStatuses,
  pickNextOutreachTargets,
  shouldNudgeCandidate,
  type MissionCandidateRow,
} from './outreach-limits';

const baseRow = (status: MissionCandidateRow['status']): MissionCandidateRow => ({
  id: 'c1',
  vendorProfileId: 'v1',
  vendorUserId: 'u1',
  status,
  contactedAt: '2026-11-01T10:00:00.000Z',
  nudgedAt: null,
  respondedAt: null,
});

describe('outreach limits', () => {
  it('respects per-mission contact cap', () => {
    const result = pickNextOutreachTargets(
      {
        missionId: 'm1',
        requestId: 'r1',
        candidates: [baseRow('contacted')],
        contactsSent: 2,
        topN: 2,
        responseDeadlineAt: '2026-11-02T00:00:00.000Z',
      },
      ['v2', 'v3'],
    );
    expect(result.allowed).toEqual([]);
    expect(result.blockedReasons[0]).toMatch(/limit/i);
  });

  it('nudges once after delay', () => {
    const row = baseRow('contacted');
    expect(
      shouldNudgeCandidate(
        row,
        '2026-11-02T00:00:00.000Z',
        60,
        new Date('2026-11-01T10:30:00.000Z'),
      ),
    ).toBe(false);
    expect(
      shouldNudgeCandidate(
        row,
        '2026-11-02T00:00:00.000Z',
        60,
        new Date('2026-11-01T11:05:00.000Z'),
      ),
    ).toBe(true);
    expect(
      shouldNudgeCandidate(
        { ...row, nudgedAt: '2026-11-01T11:05:00.000Z' },
        '2026-11-02T00:00:00.000Z',
        60,
        new Date('2026-11-01T12:00:00.000Z'),
      ),
    ).toBe(false);
  });

  it('marks non-responders after deadline', () => {
    const { updates } = markNonResponderStatuses(
      [baseRow('contacted'), { ...baseRow('responded'), status: 'responded', id: 'c2' }],
      '2026-11-01T12:00:00.000Z',
      new Date('2026-11-01T13:00:00.000Z'),
    );
    expect(updates).toHaveLength(1);
    expect(updates[0]?.nextStatus).toBe('ignored');
  });
});

describe('instant quote', () => {
  it('returns a rate-card quote when the request fits', () => {
    const quote = instantQuoteFromRateCard({
      pricingMode: 'rate_card',
      request: {
        categorySlug: 'shortlets',
        areaSlug: 'lekki',
        budgetMinMinor: 100_000,
        budgetMaxMinor: 500_000,
      },
      rateCard: {
        categorySlug: 'shortlets',
        startingPriceMinor: 250_000,
        minPriceMinor: 200_000,
        maxPriceMinor: 800_000,
      },
    });
    expect(quote?.amountMinor).toBe(250_000);
    expect(quote?.currency).toBe('NGN');
  });
});
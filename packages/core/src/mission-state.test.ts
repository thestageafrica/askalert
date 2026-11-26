import { describe, expect, it } from 'vitest';
import {
  buildMissionDeadlines,
  canTransitionMission,
  nextStatusAfterTick,
  shouldExpireMission,
  transitionMission,
  type MissionDeadlines,
} from './mission-state';

const deadlines: MissionDeadlines = {
  responseDeadlineAt: '2026-12-01T12:00:00.000Z',
  collectDeadlineAt: '2026-12-01T14:00:00.000Z',
  expiresAt: '2026-12-02T00:00:00.000Z',
};

describe('mission transitions', () => {
  it('allows the happy path chain', () => {
    expect(canTransitionMission('DRAFT', 'CLARIFYING')).toBe(true);
    expect(canTransitionMission('CLARIFYING', 'SEARCHING')).toBe(true);
    expect(canTransitionMission('SEARCHING', 'OUTREACH')).toBe(true);
    expect(canTransitionMission('AWAITING_USER', 'BOOKED')).toBe(true);
  });

  it('blocks illegal jumps', () => {
    expect(canTransitionMission('DRAFT', 'BOOKED')).toBe(false);
    expect(canTransitionMission('BOOKED', 'SEARCHING')).toBe(false);
  });

  it('is idempotent for the same status', () => {
    const result = transitionMission({
      currentStatus: 'OUTREACH',
      targetStatus: 'OUTREACH',
      deadlines,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.idempotent).toBe(true);
    }
  });

  it('honours idempotency keys', () => {
    const result = transitionMission({
      currentStatus: 'COLLECTING',
      targetStatus: 'RANKING',
      deadlines,
      idempotencyKey: 'tick-1',
      lastAppliedIdempotencyKey: 'tick-1',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.idempotent).toBe(true);
      expect(result.status).toBe('COLLECTING');
    }
  });
});

describe('expiry', () => {
  it('detects expiry after expiresAt', () => {
    const now = new Date('2026-12-03T00:00:00.000Z');
    expect(shouldExpireMission('COLLECTING', deadlines, now)).toBe(true);
    expect(shouldExpireMission('BOOKED', deadlines, now)).toBe(false);
  });

  it('builds deadlines from category response window', () => {
    const now = new Date('2026-11-01T10:00:00.000Z');
    const built = buildMissionDeadlines({
      responseDeadlineMinutes: 120,
      now,
    });
    expect(Date.parse(built.responseDeadlineAt!)).toBe(now.getTime() + 120 * 60_000);
  });
});

describe('mission tick', () => {
  it('moves SEARCHING to OUTREACH when enough vendors match', () => {
    const next = nextStatusAfterTick('SEARCHING', {
      matchedCount: 3,
      minimumRequired: 2,
      offersCount: 0,
      outreachComplete: false,
      rankingReady: false,
      deadlines,
      now: new Date('2026-11-01T10:00:00.000Z'),
    });
    expect(next).toBe('OUTREACH');
  });

  it('expires when past deadline', () => {
    const next = nextStatusAfterTick('OUTREACH', {
      matchedCount: 2,
      minimumRequired: 2,
      offersCount: 0,
      outreachComplete: false,
      rankingReady: false,
      deadlines,
      now: new Date('2026-12-03T00:00:00.000Z'),
    });
    expect(next).toBe('EXPIRED');
  });
});
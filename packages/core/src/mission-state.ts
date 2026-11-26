import { z } from 'zod';

export const missionStatusSchema = z.enum([
  'DRAFT',
  'CLARIFYING',
  'SEARCHING',
  'OUTREACH',
  'COLLECTING',
  'RANKING',
  'AWAITING_USER',
  'BOOKED',
  'EXPIRED',
  'CANCELLED',
]);

export type MissionStatus = z.infer<typeof missionStatusSchema>;

const TERMINAL: ReadonlySet<MissionStatus> = new Set([
  'BOOKED',
  'EXPIRED',
  'CANCELLED',
]);

/** Allowed transitions: from -> set of targets (excluding idempotent same-state). */
export const MISSION_TRANSITIONS: Record<MissionStatus, readonly MissionStatus[]> = {
  DRAFT: ['CLARIFYING', 'CANCELLED'],
  CLARIFYING: ['SEARCHING', 'CANCELLED', 'EXPIRED'],
  SEARCHING: ['OUTREACH', 'CANCELLED', 'EXPIRED'],
  OUTREACH: ['COLLECTING', 'CANCELLED', 'EXPIRED'],
  COLLECTING: ['RANKING', 'AWAITING_USER', 'CANCELLED', 'EXPIRED'],
  RANKING: ['AWAITING_USER', 'CANCELLED', 'EXPIRED'],
  AWAITING_USER: ['BOOKED', 'CANCELLED', 'EXPIRED'],
  BOOKED: [],
  EXPIRED: [],
  CANCELLED: [],
};

export type MissionDeadlines = {
  /** When outreach responses are due. */
  responseDeadlineAt: string | null;
  /** When quote collection ends and ranking may start. */
  collectDeadlineAt: string | null;
  /** Hard mission expiry (no further progress). */
  expiresAt: string | null;
};

export type TransitionMissionInput = {
  currentStatus: MissionStatus;
  targetStatus: MissionStatus;
  deadlines: MissionDeadlines;
  now?: Date;
  /** When set, a repeat call with the same key is treated as success. */
  idempotencyKey?: string | null;
  lastAppliedIdempotencyKey?: string | null;
};

export type TransitionMissionResult =
  | {
      ok: true;
      status: MissionStatus;
      idempotent: boolean;
      reason: string;
    }
  | {
      ok: false;
      status: MissionStatus;
      reason: string;
    };

export function isTerminalMissionStatus(status: MissionStatus): boolean {
  return TERMINAL.has(status);
}

export function canTransitionMission(from: MissionStatus, to: MissionStatus): boolean {
  if (from === to) {
    return true;
  }
  if (isTerminalMissionStatus(from)) {
    return false;
  }
  return MISSION_TRANSITIONS[from].includes(to);
}

export function transitionMission(input: TransitionMissionInput): TransitionMissionResult {
  const now = input.now ?? new Date();
  if (
    input.idempotencyKey &&
    input.lastAppliedIdempotencyKey &&
    input.idempotencyKey === input.lastAppliedIdempotencyKey
  ) {
    return {
      ok: true,
      status: input.currentStatus,
      idempotent: true,
      reason: 'Already applied for this idempotency key.',
    };
  }

  if (input.currentStatus === input.targetStatus) {
    return {
      ok: true,
      status: input.currentStatus,
      idempotent: true,
      reason: 'Mission already in target status.',
    };
  }

  if (isTerminalMissionStatus(input.currentStatus)) {
    return {
      ok: false,
      status: input.currentStatus,
      reason: `Cannot leave terminal status ${input.currentStatus}.`,
    };
  }

  if (input.targetStatus === 'EXPIRED' || shouldExpireMission(input.currentStatus, input.deadlines, now)) {
    if (input.targetStatus !== 'EXPIRED' && shouldExpireMission(input.currentStatus, input.deadlines, now)) {
      return {
        ok: false,
        status: input.currentStatus,
        reason: 'Mission is past expiry; transition to EXPIRED first.',
      };
    }
  }

  if (!canTransitionMission(input.currentStatus, input.targetStatus)) {
    return {
      ok: false,
      status: input.currentStatus,
      reason: `Transition ${input.currentStatus} → ${input.targetStatus} is not allowed.`,
    };
  }

  return {
    ok: true,
    status: input.targetStatus,
    idempotent: false,
    reason: `Moved to ${input.targetStatus}.`,
  };
}

export function shouldExpireMission(
  status: MissionStatus,
  deadlines: MissionDeadlines,
  now: Date = new Date(),
): boolean {
  if (isTerminalMissionStatus(status)) {
    return false;
  }
  if (!deadlines.expiresAt) {
    return false;
  }
  return now.getTime() > Date.parse(deadlines.expiresAt);
}

export function nextStatusAfterTick(
  status: MissionStatus,
  context: {
    matchedCount: number;
    minimumRequired: number;
    offersCount: number;
    outreachComplete: boolean;
    rankingReady: boolean;
    deadlines: MissionDeadlines;
    now?: Date;
  },
): MissionStatus | null {
  const now = context.now ?? new Date();
  if (shouldExpireMission(status, context.deadlines, now)) {
    return 'EXPIRED';
  }

  switch (status) {
    case 'DRAFT':
      return 'CLARIFYING';
    case 'CLARIFYING':
      return 'SEARCHING';
    case 'SEARCHING':
      return context.matchedCount >= context.minimumRequired ? 'OUTREACH' : 'AWAITING_USER';
    case 'OUTREACH':
      return context.outreachComplete ? 'COLLECTING' : null;
    case 'COLLECTING':
      if (context.offersCount > 0 && context.rankingReady) {
        return 'RANKING';
      }
      if (deadlinePassed(context.deadlines.collectDeadlineAt, now)) {
        return context.offersCount > 0 ? 'RANKING' : 'AWAITING_USER';
      }
      return null;
    case 'RANKING':
      return 'AWAITING_USER';
    default:
      return null;
  }
}

function deadlinePassed(iso: string | null, now: Date): boolean {
  if (!iso) {
    return false;
  }
  return now.getTime() >= Date.parse(iso);
}

export function buildMissionDeadlines(input: {
  responseDeadlineMinutes: number;
  collectWindowMinutes?: number;
  missionTtlMinutes?: number;
  now?: Date;
}): MissionDeadlines {
  const now = input.now ?? new Date();
  const responseMs = input.responseDeadlineMinutes * 60_000;
  const collectMs = (input.collectWindowMinutes ?? input.responseDeadlineMinutes) * 60_000;
  const ttlMs = (input.missionTtlMinutes ?? input.responseDeadlineMinutes * 3) * 60_000;
  return {
    responseDeadlineAt: new Date(now.getTime() + responseMs).toISOString(),
    collectDeadlineAt: new Date(now.getTime() + collectMs).toISOString(),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
  };
}
import { checkEntitlement } from './entitlements';
import type { UserPlanState } from './types';

export type VendorLeadOutcome = 'responded' | 'ignored' | 'pending';

export type VendorLeadRecord = {
  id: string;
  sentAt: string;
  outcome: VendorLeadOutcome;
  /** Minutes from send to reply when outcome is responded. */
  replyLatencyMinutes?: number;
};

export type VendorResponsivenessScore = {
  sampleSize: number;
  responseRate: number;
  medianReplyMinutes: number | null;
  ignoredStreak: number;
  score: number;
  plainSummary: string;
};

export type VendorLeadMode = 'realtime' | 'digest' | 'push_digest' | 'blocked';

export type LeadBatchItem = {
  leadId: string;
  title: string;
};

export type VendorLeadDeliveryPlan = {
  mode: VendorLeadMode;
  sendNow: boolean;
  useDigest: boolean;
  usePush: boolean;
  batch: LeadBatchItem[];
  reasons: string[];
  plainSummary: string;
  remainingLeadAllowance: number;
};

const DEFAULT_REQUEST_MESSAGE_BUDGET = 3;

export function scoreVendorResponsiveness(
  leads: VendorLeadRecord[],
): VendorResponsivenessScore {
  const sample = leads.slice(-10);
  const settled = sample.filter((lead) => lead.outcome !== 'pending');
  const responded = settled.filter((lead) => lead.outcome === 'responded');
  const responseRate = settled.length === 0 ? 1 : responded.length / settled.length;

  const latencies = responded
    .map((lead) => lead.replyLatencyMinutes)
    .filter((value): value is number => typeof value === 'number' && value >= 0)
    .sort((a, b) => a - b);
  const medianReplyMinutes =
    latencies.length === 0 ? null : median(latencies);

  let ignoredStreak = 0;
  for (let i = sample.length - 1; i >= 0; i -= 1) {
    const lead = sample[i];
    if (!lead || lead.outcome === 'pending') {
      continue;
    }
    if (lead.outcome === 'ignored') {
      ignoredStreak += 1;
      continue;
    }
    break;
  }

  // 0–100 score: response rate weighted with reply speed bonus.
  const speedBonus =
    medianReplyMinutes == null
      ? 0
      : medianReplyMinutes <= 15
        ? 20
        : medianReplyMinutes <= 60
          ? 10
          : 0;
  const score = Math.max(
    0,
    Math.min(100, Math.round(responseRate * 80 + speedBonus - ignoredStreak * 5)),
  );

  const plainSummary =
    settled.length === 0
      ? 'No settled leads yet — treat as fully responsive.'
      : `Responded to ${responded.length} of last ${settled.length} leads` +
        (medianReplyMinutes == null
          ? '.'
          : ` (median reply ${medianReplyMinutes} min).`) +
        (ignoredStreak >= 3
          ? ` Ignored ${ignoredStreak} in a row — digest mode.`
          : '');

  return {
    sampleSize: sample.length,
    responseRate,
    medianReplyMinutes,
    ignoredStreak,
    score,
    plainSummary,
  };
}

export type PlanVendorLeadInput = {
  planState: UserPlanState;
  recentLeads: VendorLeadRecord[];
  pendingLeads: LeadBatchItem[];
  /** Messages already sent for this request. */
  requestMessageCount?: number;
  requestMessageBudget?: number;
  now?: Date;
};

/**
 * Decide how to deliver vendor leads: realtime, batched digest, or blocked.
 */
export function planVendorLeadDelivery(input: PlanVendorLeadInput): VendorLeadDeliveryPlan {
  const now = input.now ?? new Date();
  const budget = input.requestMessageBudget ?? DEFAULT_REQUEST_MESSAGE_BUDGET;
  const usedOnRequest = input.requestMessageCount ?? 0;
  const score = scoreVendorResponsiveness(input.recentLeads);
  const reasons: string[] = [score.plainSummary];

  const entitlement = checkEntitlement(input.planState, 'send_whatsapp', { now });
  const remaining =
    entitlement.outcome === 'block'
      ? 0
      : (entitlement.remaining ?? 0);

  if (entitlement.outcome === 'block') {
    return {
      mode: 'blocked',
      sendNow: false,
      useDigest: false,
      usePush: false,
      batch: [],
      reasons: [...reasons, entitlement.reason, entitlement.nextStep],
      plainSummary: 'Blocked: monthly lead allowance is used up.',
      remainingLeadAllowance: 0,
    };
  }

  if (usedOnRequest >= budget) {
    return {
      mode: 'blocked',
      sendNow: false,
      useDigest: false,
      usePush: false,
      batch: [],
      reasons: [
        ...reasons,
        `Per-request message budget reached (${usedOnRequest}/${budget}).`,
      ],
      plainSummary: 'Blocked: this request already used its message budget.',
      remainingLeadAllowance: remaining,
    };
  }

  const pending = input.pendingLeads;
  if (pending.length === 0) {
    return {
      mode: 'realtime',
      sendNow: false,
      useDigest: false,
      usePush: false,
      batch: [],
      reasons: [...reasons, 'No pending leads to send.'],
      plainSummary: 'Nothing to send.',
      remainingLeadAllowance: remaining,
    };
  }

  // Ignore 3 in a row → digest + push only until they respond.
  if (score.ignoredStreak >= 3) {
    const batch = pending.slice(0, Math.min(pending.length, remaining, budget - usedOnRequest));
    reasons.push(
      'Vendor ignored 3 leads in a row — switch to digest plus push until they reply.',
    );
    return {
      mode: 'push_digest',
      sendNow: batch.length > 0,
      useDigest: true,
      usePush: true,
      batch,
      reasons,
      plainSummary:
        batch.length > 1
          ? `Batch ${batch.length} leads into one digest and notify by push.`
          : 'Send a quiet digest with push, not a full realtime alert.',
      remainingLeadAllowance: remaining,
    };
  }

  // Several pending leads → one digest message (cheaper / less noisy).
  if (pending.length >= 3) {
    const batch = pending.slice(0, Math.min(pending.length, remaining, budget - usedOnRequest));
    reasons.push('Several leads waiting — batch into one digest.');
    return {
      mode: 'digest',
      sendNow: batch.length > 0,
      useDigest: true,
      usePush: false,
      batch,
      reasons,
      plainSummary: `Batch ${batch.length} leads into one digest message.`,
      remainingLeadAllowance: remaining,
    };
  }

  const batch = pending.slice(0, Math.min(1, remaining, budget - usedOnRequest));
  reasons.push('Vendor is responsive — send the next lead in realtime.');
  return {
    mode: 'realtime',
    sendNow: batch.length > 0,
    useDigest: false,
    usePush: false,
    batch,
    reasons,
    plainSummary: 'Send the next lead now in realtime.',
    remainingLeadAllowance: remaining,
  };
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
  }
  return sorted[mid] ?? 0;
}

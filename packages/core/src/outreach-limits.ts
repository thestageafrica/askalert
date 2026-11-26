import { z } from 'zod';
import { routeNotification, type RouteNotificationContext } from './notification-router';
import type { NotificationEvent } from './notification-types';
import { planVendorLeadDelivery, type VendorLeadRecord } from './vendor-leads';
import type { BuyerMatchRequest, VendorRateCardSlice } from './matching';

export const missionCandidateStatusSchema = z.enum([
  'selected',
  'contacted',
  'nudged',
  'responded',
  'ignored',
  'declined',
]);
export type MissionCandidateStatus = z.infer<typeof missionCandidateStatusSchema>;

export const DEFAULT_NUDGE_DELAY_MINUTES = 60;

export type MissionCandidateRow = {
  id: string;
  vendorProfileId: string;
  vendorUserId: string;
  status: MissionCandidateStatus;
  contactedAt: string | null;
  nudgedAt: string | null;
  respondedAt: string | null;
};

export type OutreachMissionContext = {
  missionId: string;
  requestId: string;
  candidates: MissionCandidateRow[];
  /** Vendors already contacted on this mission (counts). */
  contactsSent: number;
  topN: number;
  responseDeadlineAt: string | null;
  now?: Date;
};

export function canContactMoreVendors(ctx: OutreachMissionContext): boolean {
  return ctx.contactsSent < ctx.topN;
}

export function vendorAlreadyContactedOnMission(
  ctx: OutreachMissionContext,
  vendorProfileId: string,
): boolean {
  return ctx.candidates.some(
    (row) =>
      row.vendorProfileId === vendorProfileId &&
      (row.status === 'contacted' ||
        row.status === 'nudged' ||
        row.status === 'responded' ||
        row.status === 'ignored'),
  );
}

export function pickNextOutreachTargets(
  ctx: OutreachMissionContext,
  selectedIds: string[],
): { allowed: string[]; blockedReasons: string[] } {
  const blockedReasons: string[] = [];
  if (!canContactMoreVendors(ctx)) {
    blockedReasons.push('Per-mission contact limit reached.');
    return { allowed: [], blockedReasons };
  }

  const remainingSlots = ctx.topN - ctx.contactsSent;
  const allowed: string[] = [];

  for (const vendorProfileId of selectedIds) {
    if (allowed.length >= remainingSlots) {
      break;
    }
    if (vendorAlreadyContactedOnMission(ctx, vendorProfileId)) {
      blockedReasons.push(`Vendor ${vendorProfileId} already contacted on this mission.`);
      continue;
    }
    allowed.push(vendorProfileId);
  }

  return { allowed, blockedReasons };
}

export function shouldNudgeCandidate(
  candidate: MissionCandidateRow,
  responseDeadlineAt: string | null,
  nudgeDelayMinutes: number = DEFAULT_NUDGE_DELAY_MINUTES,
  now: Date = new Date(),
): boolean {
  if (candidate.status !== 'contacted' || !candidate.contactedAt) {
    return false;
  }
  if (candidate.nudgedAt) {
    return false;
  }
  const contactedAt = Date.parse(candidate.contactedAt);
  const delayMs = nudgeDelayMinutes * 60_000;
  if (now.getTime() - contactedAt < delayMs) {
    return false;
  }
  if (responseDeadlineAt && now.getTime() >= Date.parse(responseDeadlineAt)) {
    return false;
  }
  return true;
}

export function markNonResponderStatuses(
  candidates: MissionCandidateRow[],
  responseDeadlineAt: string | null,
  now: Date = new Date(),
): { updates: Array<{ id: string; nextStatus: MissionCandidateStatus }>; reasons: string[] } {
  if (!responseDeadlineAt || now.getTime() < Date.parse(responseDeadlineAt)) {
    return { updates: [], reasons: [] };
  }
  const updates: Array<{ id: string; nextStatus: MissionCandidateStatus }> = [];
  const reasons: string[] = [];
  for (const row of candidates) {
    if (row.status === 'contacted' || row.status === 'nudged') {
      updates.push({ id: row.id, nextStatus: 'ignored' });
      reasons.push(`Vendor ${row.vendorProfileId} marked ignored after deadline.`);
    }
  }
  return { updates, reasons };
}

export function isOutreachComplete(
  candidates: MissionCandidateRow[],
  topN: number,
): boolean {
  const settled = candidates.filter((row) =>
    ['contacted', 'nudged', 'responded', 'ignored', 'declined'].includes(row.status),
  );
  return settled.length >= Math.min(topN, candidates.length) && candidates.length > 0;
}

export type InstantQuoteInput = {
  request: BuyerMatchRequest;
  rateCard: VendorRateCardSlice;
  pricingMode: 'fixed' | 'range' | 'quote' | 'rate_card';
  currency?: 'NGN';
};

export type InstantQuoteOffer = {
  amountMinor: number;
  currency: 'NGN';
  message: string;
  fromRateCard: true;
};

export function instantQuoteFromRateCard(
  input: InstantQuoteInput,
): InstantQuoteOffer | null {
  if (input.pricingMode !== 'rate_card' && input.pricingMode !== 'fixed') {
    return null;
  }
  if (input.rateCard.categorySlug !== input.request.categorySlug) {
    return null;
  }
  const buyerMin = input.request.budgetMinMinor ?? input.rateCard.minPriceMinor;
  const buyerMax = input.request.budgetMaxMinor ?? input.rateCard.maxPriceMinor;
  if (
    input.rateCard.maxPriceMinor < buyerMin ||
    input.rateCard.minPriceMinor > buyerMax
  ) {
    return null;
  }
  const amountMinor = clampToBudget(input.rateCard.startingPriceMinor, buyerMin, buyerMax);
  const currency = input.currency ?? 'NGN';
  return {
    amountMinor,
    currency,
    message: 'Instant quote from your rate card.',
    fromRateCard: true,
  };
}

function clampToBudget(price: number, min: number, max: number): number {
  if (price < min) {
    return min;
  }
  if (price > max) {
    return max;
  }
  return price;
}

export type LeadAlertPlanInput = {
  vendorUserId: string;
  missionId: string;
  leadTitle: string;
  recentLeads: VendorLeadRecord[];
  routeContext: RouteNotificationContext;
};

/** Pure helper: notification routing + vendor lead delivery for one in-app lead. */
export function planInAppLeadAlert(input: LeadAlertPlanInput) {
  const event: NotificationEvent = {
    id: `lead:${input.missionId}:${input.vendorUserId}`,
    type: 'lead_alert',
    userId: input.vendorUserId,
  };
  const delivery = routeNotification(event, { userId: input.vendorUserId }, input.routeContext);
  const leadPlan = planVendorLeadDelivery({
    planState: input.routeContext.planState,
    recentLeads: input.recentLeads,
    pendingLeads: [{ leadId: event.id, title: input.leadTitle }],
    now: input.routeContext.now,
  });
  return { delivery, leadPlan };
}
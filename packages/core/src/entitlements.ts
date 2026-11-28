import { getPlanById } from './plans';
import type {
  EntitlementAction,
  EntitlementDecision,
  PlanDefinition,
  UserPlanState,
} from './types';

export type EntitlementContext = {
  /** Vendors already contacted / about to contact on this request. */
  vendorsOnRequest?: number;
  /** Service coverage rows already selected (before adding another). */
  serviceAreaCount?: number;
  now?: Date;
};

function ratioUsed(used: number, limit: number): number {
  if (limit <= 0) {
    return used > 0 ? 1 : 0;
  }
  return used / limit;
}

function decideAgainstLimit(options: {
  used: number;
  limit: number;
  units: number;
  blockReason: string;
  warnReason: string;
  nextStep: string;
}): EntitlementDecision {
  const { used, limit, units, blockReason, warnReason, nextStep } = options;
  const after = used + units;
  if (after > limit) {
    return {
      outcome: 'block',
      remaining: Math.max(0, limit - used),
      limit,
      reason: blockReason,
      nextStep,
    };
  }
  const usedRatio = ratioUsed(after, limit);
  if (usedRatio >= 0.8) {
    return {
      outcome: 'warn_at_80',
      remaining: Math.max(0, limit - after),
      limit,
      reason: warnReason,
      nextStep,
    };
  }
  return {
    outcome: 'allow',
    remaining: Math.max(0, limit - after),
    limit,
  };
}

export function isSubscriptionActive(state: UserPlanState, now = new Date()): boolean {
  if (state.status !== 'active') {
    return false;
  }
  const ends = Date.parse(state.endsAt);
  if (Number.isNaN(ends)) {
    return false;
  }
  return ends > now.getTime();
}

export function getActivePlan(state: UserPlanState, now = new Date()): PlanDefinition | null {
  if (!isSubscriptionActive(state, now)) {
    return null;
  }
  return getPlanById(state.planId) ?? null;
}

/**
 * Pure entitlement check. Call before every costly action.
 */
export function checkEntitlement(
  state: UserPlanState,
  action: EntitlementAction,
  context: EntitlementContext = {},
): EntitlementDecision {
  const now = context.now ?? new Date();
  const plan = getActivePlan(state, now);
  if (!plan) {
    return {
      outcome: 'block',
      remaining: 0,
      limit: 0,
      reason: 'Your plan period has ended.',
      nextStep: 'Renew Free or get Starter to keep asking.',
    };
  }

  const limits = plan.limits;
  const topUp = plan.audience === 'buyer' ? 'Top up or get Starter.' : 'Wait for next month or earn more lead alerts.';

  switch (action) {
    case 'start_request': {
      const limit = limits.requestsPerMonth ?? 0;
      return decideAgainstLimit({
        used: state.usage.requests,
        limit,
        units: 1,
        blockReason: 'You have used all requests for this month.',
        warnReason: 'You are close to your monthly request limit.',
        nextStep: topUp,
      });
    }
    case 'contact_vendors': {
      const limit = limits.vendorsPerRequest ?? 0;
      const vendors = context.vendorsOnRequest ?? state.usage.vendorContacts;
      return decideAgainstLimit({
        used: vendors,
        limit,
        units: 1,
        blockReason: 'This request already has the maximum number of vendors.',
        warnReason: 'You are near the vendor limit for this request.',
        nextStep: 'Upgrade to Starter for more vendors per ask.',
      });
    }
    case 'relay_message': {
      const limit = limits.relayedMessages ?? limits.chatMessages ?? 0;
      const used =
        plan.audience === 'vendor' ? state.usage.chatMessages : state.usage.relayedMessages;
      return decideAgainstLimit({
        used,
        limit,
        units: 1,
        blockReason: 'You have used all chat messages for this month.',
        warnReason: 'You are close to your chat message limit.',
        nextStep: topUp,
      });
    }
    case 'ai_suggestion': {
      const limit = limits.aiSuggestions ?? 0;
      return decideAgainstLimit({
        used: state.usage.aiSuggestions,
        limit,
        units: 1,
        blockReason: 'You have used all AI suggestions for this month.',
        warnReason: 'You are close to your AI suggestion limit.',
        nextStep: topUp,
      });
    }
    case 'send_whatsapp': {
      if (!limits.whatsappEnabled) {
        return {
          outcome: 'block',
          remaining: 0,
          limit: 0,
          reason: 'WhatsApp chat is not included on your plan.',
          nextStep: 'Get Starter to message on WhatsApp.',
        };
      }
      if (plan.audience === 'vendor') {
        const limit = (limits.leadAlertsPerMonth ?? 0) + state.bonusLeadAlerts;
        return decideAgainstLimit({
          used: state.usage.leadAlerts,
          limit,
          units: 1,
          blockReason: 'You have used all lead alerts for this month.',
          warnReason: 'You are close to your lead alert limit.',
          nextStep: 'Complete a platform-paid booking to earn more alerts.',
        });
      }
      return { outcome: 'allow' };
    }
    case 'select_service_area': {
      const limit = limits.maxCoverageLocations ?? limits.maxServiceAreas ?? 3;
      const used = context.serviceAreaCount ?? 0;
      return decideAgainstLimit({
        used,
        limit,
        units: 1,
        blockReason: 'Your plan only allows this many service locations.',
        warnReason: 'You are near your service location limit.',
        nextStep:
          plan.audience === 'vendor'
            ? 'Upgrade to Vendor Pro for more coverage areas.'
            : topUp,
      });
    }
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

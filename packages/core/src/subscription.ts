import { defaultPlanForAudience, getPlanBySlug } from './plans';
import { emptyUsage, type PlanAudience, type UserPlanState } from './types';

export function createFreeSubscription(options: {
  userId: string;
  audience: PlanAudience;
  now?: Date;
}): UserPlanState {
  const now = options.now ?? new Date();
  const plan = defaultPlanForAudience(options.audience);
  const ends = new Date(now.getTime());
  ends.setUTCDate(ends.getUTCDate() + plan.periodDays);
  return {
    userId: options.userId,
    audience: options.audience,
    planId: plan.id,
    planVersion: 1,
    status: 'active',
    startsAt: now.toISOString(),
    endsAt: ends.toISOString(),
    usage: emptyUsage(),
    bonusLeadAlerts: 0,
  };
}

/** Mock purchase completion (Paystack wired later). */
export function completeMockPurchase(options: {
  state: UserPlanState;
  kind: 'starter_pass' | 'credit_pack';
  creditPackMinor?: number;
  now?: Date;
}): UserPlanState {
  const now = options.now ?? new Date();
  if (options.kind === 'credit_pack') {
    // Credits are tracked separately in wallets; keep plan state unchanged here.
    return { ...options.state };
  }
  const starter = getPlanBySlug('buyer_starter');
  if (!starter) {
    throw new Error('buyer_starter plan missing from catalogue');
  }
  const ends = new Date(now.getTime());
  ends.setUTCDate(ends.getUTCDate() + starter.periodDays);
  return {
    ...options.state,
    audience: 'buyer',
    planId: starter.id,
    planVersion: options.state.planVersion + 1,
    status: 'active',
    startsAt: now.toISOString(),
    endsAt: ends.toISOString(),
    usage: emptyUsage(),
  };
}

export function withUsageAt(state: UserPlanState, patch: Partial<UserPlanState['usage']>): UserPlanState {
  return {
    ...state,
    usage: { ...state.usage, ...patch },
  };
}

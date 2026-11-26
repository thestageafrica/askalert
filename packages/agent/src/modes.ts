import type { PlanDefinition } from '@askalert/core';
import type { AgentCategoryHints, AgentMode } from './types';

export type ModeGateResult =
  | { ok: true; mode: AgentMode }
  | { ok: false; mode: AgentMode; reason: string; fallback: AgentMode };

/**
 * Autopilot requires Starter (or a plan that opts in) and a category with rounds.
 * Match never uses agent chat tools beyond search/rank.
 */
export function resolveAgentMode(input: {
  requested: AgentMode;
  plan: PlanDefinition | null;
  category: AgentCategoryHints;
}): ModeGateResult {
  const requested = input.requested;

  if (requested === 'match') {
    return { ok: true, mode: 'match' };
  }

  if (!input.plan || input.plan.audience !== 'buyer') {
    return {
      ok: false,
      mode: requested,
      reason: 'Sign in with a buyer plan to use Assist or Autopilot.',
      fallback: 'match',
    };
  }

  if (requested === 'assist') {
    const limit = input.plan.limits.aiSuggestions ?? 0;
    if (limit <= 0) {
      return {
        ok: false,
        mode: 'assist',
        reason: 'Your plan has no AI suggestion allowance.',
        fallback: 'match',
      };
    }
    return { ok: true, mode: 'assist' };
  }

  // autopilot
  const planAllows = Boolean(input.plan.features.autopilotEnabled);
  if (!planAllows) {
    return {
      ok: false,
      mode: 'autopilot',
      reason: 'Autopilot is available on Starter. Using Assist instead when AI is allowed.',
      fallback: (input.plan.limits.aiSuggestions ?? 0) > 0 ? 'assist' : 'match',
    };
  }

  if (input.category.autopilot_max_rounds <= 0 || input.category.negotiation === 'none') {
    return {
      ok: false,
      mode: 'autopilot',
      reason: 'This category does not allow Autopilot negotiation.',
      fallback: 'assist',
    };
  }

  return { ok: true, mode: 'autopilot' };
}

export function toolsAllowedForMode(mode: AgentMode): ReadonlyArray<string> {
  switch (mode) {
    case 'match':
      return ['ask_clarifying_question', 'search_vendors', 'rank_and_explain', 'notify_user'];
    case 'assist':
      return [
        'ask_clarifying_question',
        'search_vendors',
        'parse_quote',
        'counter_offer',
        'rank_and_explain',
        'request_approval',
        'notify_user',
      ];
    case 'autopilot':
      return [
        'ask_clarifying_question',
        'search_vendors',
        'parse_quote',
        'counter_offer',
        'rank_and_explain',
        'request_approval',
        'notify_user',
      ];
  }
}

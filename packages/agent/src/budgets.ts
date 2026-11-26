import {
  checkEntitlement,
  estimateCost,
  type EntitlementDecision,
  type UnitCostSettings,
  type UserPlanState,
} from '@askalert/core';
import type { AgentModelTier } from './types';

export type AgentBudgetGate =
  | { ok: true; decision: EntitlementDecision; modelTier: AgentModelTier }
  | {
      ok: false;
      decision: EntitlementDecision;
      stopMessage: string;
    };

export function gateAgentTurn(input: {
  planState: UserPlanState;
  modelTier: AgentModelTier;
}): AgentBudgetGate {
  const decision = checkEntitlement(input.planState, 'ai_suggestion');
  if (decision.outcome === 'block') {
    return {
      ok: false,
      decision,
      stopMessage:
        decision.reason ??
        'You have used your AI suggestion allowance for this period. Upgrade or wait for the next period.',
    };
  }
  return { ok: true, decision, modelTier: input.modelTier };
}

export function estimateAgentUsageCost(input: {
  modelTier: AgentModelTier;
  inputTokens: number;
  outputTokens: number;
  unitCosts?: UnitCostSettings;
}): { estimatedMinor: number; eventType: 'ai_tokens' | 'ai_suggestion' } {
  // Rough token event plus one suggestion unit for the turn.
  const tokenUnits = Math.max(1, Math.ceil((input.inputTokens + input.outputTokens) / 1000));
  const tokenCost = estimateCost(
    { type: 'ai_tokens', units: tokenUnits },
    input.unitCosts,
  );
  const suggestionCost = estimateCost({ type: 'ai_suggestion', units: 1 }, input.unitCosts);
  return {
    estimatedMinor: tokenCost + suggestionCost,
    eventType: 'ai_suggestion',
  };
}

export function pickModelTier(step: 'routine' | 'hard_negotiation' | 'ranking'): AgentModelTier {
  if (step === 'hard_negotiation' || step === 'ranking') {
    return 'hard';
  }
  return 'routine';
}

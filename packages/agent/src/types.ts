import { z } from 'zod';

export const agentModeSchema = z.enum(['match', 'assist', 'autopilot']);
export type AgentMode = z.infer<typeof agentModeSchema>;

export const agentAutonomySchema = z.enum(['none', 'assist', 'autopilot']);
export type AgentAutonomy = z.infer<typeof agentAutonomySchema>;

export const agentToolNameSchema = z.enum([
  'ask_clarifying_question',
  'search_vendors',
  'parse_quote',
  'counter_offer',
  'rank_and_explain',
  'request_approval',
  'notify_user',
]);
export type AgentToolName = z.infer<typeof agentToolNameSchema>;

export type AgentCategoryHints = {
  slug: string;
  name: string;
  extra_rules: string[];
  negotiation_hints: string[];
  autopilot_max_rounds: number;
  negotiation: 'none' | 'assisted' | 'auto';
};

export type BuyerSecrets = {
  /** Never sent to vendor-facing prompts or tools that talk to vendors. */
  budgetMaxMinor: number | null;
  budgetMinMinor?: number | null;
  displayName?: string;
  phone?: string;
  exactAddress?: string;
};

export type PublicBuyerBrief = {
  categorySlug: string;
  areaSlug: string | null;
  summary: string;
  /** Soft range only — never the hard ceiling. */
  publicBudgetHint: string | null;
  neededBy: string | null;
};

export type AgentMessage = {
  role: 'user' | 'assistant' | 'vendor' | 'system';
  content: string;
};

export type AgentModelTier = 'routine' | 'hard';

export type AgentModelConfig = {
  routineModel: string;
  hardModel: string;
};

export const DEFAULT_AGENT_MODEL_CONFIG: AgentModelConfig = {
  routineModel: 'claude-haiku-4-5-20251001',
  hardModel: 'claude-sonnet-4-5-20250929',
};

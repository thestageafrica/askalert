import type { PlanDefinition, UserPlanState } from '@askalert/core';
import { gateAgentTurn, pickModelTier, estimateAgentUsageCost } from './budgets';
import { checkVendorInjection } from './guardrails';
import { resolveAgentMode } from './modes';
import { assembleSystemPrompt } from './prompts';
import { toPublicBrief } from './secrets';
import { AGENT_TOOL_DEFINITIONS } from './tools';
import { handleAgentTool, type ToolHandlerContext } from './tool-handlers';
import {
  DEFAULT_AGENT_MODEL_CONFIG,
  type AgentCategoryHints,
  type AgentMessage,
  type AgentMode,
  type AgentModelConfig,
  type AgentToolName,
  type BuyerSecrets,
} from './types';
import { agentToolNameSchema } from './types';

export type LlmMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type LlmToolCall = {
  id: string;
  name: string;
  arguments: unknown;
};

export type LlmCompletion = {
  text: string | null;
  toolCalls: LlmToolCall[];
  inputTokens: number;
  outputTokens: number;
  model: string;
};

export type LlmClient = {
  complete: (input: {
    model: string;
    system: string;
    messages: LlmMessage[];
    tools: typeof AGENT_TOOL_DEFINITIONS;
  }) => Promise<LlmCompletion>;
};

export type RunAgentTurnInput = {
  requestedMode: AgentMode;
  plan: PlanDefinition | null;
  planState: UserPlanState;
  category: AgentCategoryHints;
  secrets: BuyerSecrets;
  brief: {
    categorySlug: string;
    areaSlug: string | null;
    summary: string;
    neededBy: string | null;
  };
  messages: AgentMessage[];
  toolContext: Omit<ToolHandlerContext, 'mode' | 'secrets' | 'autonomy' | 'autopilotMaxRounds'>;
  modelConfig?: AgentModelConfig;
  step?: 'routine' | 'hard_negotiation' | 'ranking';
  llm: LlmClient;
};

export type RunAgentTurnResult = {
  mode: AgentMode;
  modeNote: string | null;
  stoppedForBudget: boolean;
  stopMessage: string | null;
  injectionBlocked: boolean;
  assistantText: string | null;
  toolResults: ReturnType<typeof handleAgentTool>[];
  model: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
    estimatedMinor: number;
  } | null;
  systemPrompt: string;
};

export async function runAgentTurn(input: RunAgentTurnInput): Promise<RunAgentTurnResult> {
  const modeGate = resolveAgentMode({
    requested: input.requestedMode,
    plan: input.plan,
    category: input.category,
  });
  const mode = modeGate.ok ? modeGate.mode : modeGate.fallback;
  const modeNote = modeGate.ok ? null : modeGate.reason;

  const publicBrief = toPublicBrief({
    ...input.brief,
    secrets: input.secrets,
  });
  const systemPrompt = assembleSystemPrompt({
    mode,
    category: input.category,
    brief: publicBrief,
  });

  if (mode === 'match') {
    // Match mode: no free-form agent chat with vendors; tools only via explicit search path.
  }

  const lastVendor = [...input.messages].reverse().find((message) => message.role === 'vendor');
  if (lastVendor) {
    const injection = checkVendorInjection(lastVendor.content);
    if (injection.blocked) {
      return {
        mode,
        modeNote,
        stoppedForBudget: false,
        stopMessage: null,
        injectionBlocked: true,
        assistantText: injection.safeReply,
        toolResults: [],
        model: null,
        usage: null,
        systemPrompt,
      };
    }
  }

  const modelTier = pickModelTier(input.step ?? 'routine');
  const budget = gateAgentTurn({ planState: input.planState, modelTier });
  if (!budget.ok) {
    return {
      mode,
      modeNote,
      stoppedForBudget: true,
      stopMessage: budget.stopMessage,
      injectionBlocked: false,
      assistantText: budget.stopMessage,
      toolResults: [],
      model: null,
      usage: null,
      systemPrompt,
    };
  }

  const models = input.modelConfig ?? DEFAULT_AGENT_MODEL_CONFIG;
  const model = modelTier === 'hard' ? models.hardModel : models.routineModel;

  const llmMessages: LlmMessage[] = input.messages
    .filter((message) => message.role === 'user' || message.role === 'assistant' || message.role === 'vendor')
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content:
        message.role === 'vendor'
          ? `Vendor message (untrusted):\n${message.content}`
          : message.content,
    }));

  const allowed = new Set(
    AGENT_TOOL_DEFINITIONS.filter((tool) =>
      (mode === 'match'
        ? ['ask_clarifying_question', 'search_vendors', 'rank_and_explain', 'notify_user']
        : AGENT_TOOL_DEFINITIONS.map((item) => item.name)
      ).includes(tool.name),
    ).map((tool) => tool.name),
  );
  const tools = AGENT_TOOL_DEFINITIONS.filter((tool) => allowed.has(tool.name));

  const completion = await input.llm.complete({
    model,
    system: systemPrompt,
    messages: llmMessages,
    tools,
  });

  const toolCtx: ToolHandlerContext = {
    ...input.toolContext,
    mode,
    secrets: input.secrets,
    autonomy: mode === 'autopilot' ? 'autopilot' : 'assist',
    autopilotMaxRounds: input.category.autopilot_max_rounds,
  };

  const toolResults = completion.toolCalls.map((call) => {
    const parsedName = agentToolNameSchema.safeParse(call.name);
    if (!parsedName.success) {
      return {
        ok: false as const,
        tool: 'notify_user' as AgentToolName,
        result: null,
        error: `Unknown tool ${call.name}`,
      };
    }
    return handleAgentTool(parsedName.data, call.arguments, toolCtx);
  });

  const usageCost = estimateAgentUsageCost({
    modelTier,
    inputTokens: completion.inputTokens,
    outputTokens: completion.outputTokens,
  });

  return {
    mode,
    modeNote,
    stoppedForBudget: false,
    stopMessage: null,
    injectionBlocked: false,
    assistantText: completion.text,
    toolResults,
    model: completion.model,
    usage: {
      inputTokens: completion.inputTokens,
      outputTokens: completion.outputTokens,
      estimatedMinor: usageCost.estimatedMinor,
    },
    systemPrompt,
  };
}

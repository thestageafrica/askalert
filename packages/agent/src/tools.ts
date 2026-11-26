import { z } from 'zod';
import type { AgentToolName } from './types';

export const askClarifyingQuestionArgsSchema = z.object({
  question: z.string().min(1).max(280),
  reason: z.string().min(1).max(200).optional(),
});

export const searchVendorsArgsSchema = z.object({
  categorySlug: z.string().min(1),
  areaSlug: z.string().nullable().optional(),
  capacity: z.number().positive().nullable().optional(),
  neededBy: z.string().nullable().optional(),
  /** Soft public band only — handlers must ignore hard ceilings here. */
  publicBudgetHint: z.string().nullable().optional(),
});

export const parseQuoteArgsSchema = z.object({
  vendorMessage: z.string().min(1),
  currency: z.literal('NGN').default('NGN'),
});

export const counterOfferArgsSchema = z.object({
  vendorProfileId: z.string().min(1),
  proposedAmountMinor: z.number().int().positive(),
  message: z.string().min(1).max(500),
  round: z.number().int().nonnegative(),
});

export const rankAndExplainArgsSchema = z.object({
  offerIds: z.array(z.string().min(1)).min(1).max(20),
});

export const requestApprovalArgsSchema = z.object({
  action: z.enum(['send_vendor_message', 'accept_offer', 'place_booking']),
  summary: z.string().min(1).max(400),
  draftMessage: z.string().max(1000).optional(),
  offerId: z.string().optional(),
  amountMinor: z.number().int().positive().optional(),
});

export const notifyUserArgsSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
  priority: z.enum(['normal', 'high']).default('normal'),
});

export type ToolDefinition = {
  name: AgentToolName;
  description: string;
  inputSchema: Record<string, unknown>;
};

/** Anthropic-compatible tool definitions. */
export const AGENT_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'ask_clarifying_question',
    description: 'Ask the buyer one short clarifying question before searching or negotiating.',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['question'],
    },
  },
  {
    name: 'search_vendors',
    description: 'Search and rank vendors for this request using hard filters and category weights.',
    inputSchema: {
      type: 'object',
      properties: {
        categorySlug: { type: 'string' },
        areaSlug: { type: ['string', 'null'] },
        capacity: { type: ['number', 'null'] },
        neededBy: { type: ['string', 'null'] },
        publicBudgetHint: { type: ['string', 'null'] },
      },
      required: ['categorySlug'],
    },
  },
  {
    name: 'parse_quote',
    description: 'Parse a vendor message into structured quote JSON with a confidence score.',
    inputSchema: {
      type: 'object',
      properties: {
        vendorMessage: { type: 'string' },
        currency: { type: 'string', enum: ['NGN'] },
      },
      required: ['vendorMessage'],
    },
  },
  {
    name: 'counter_offer',
    description:
      'Propose a counter-offer. Backend checks ceiling, autonomy, and round limit before anything is sent.',
    inputSchema: {
      type: 'object',
      properties: {
        vendorProfileId: { type: 'string' },
        proposedAmountMinor: { type: 'integer' },
        message: { type: 'string' },
        round: { type: 'integer' },
      },
      required: ['vendorProfileId', 'proposedAmountMinor', 'message', 'round'],
    },
  },
  {
    name: 'rank_and_explain',
    description: 'Rank collected offers and return a one-line reason for each.',
    inputSchema: {
      type: 'object',
      properties: {
        offerIds: { type: 'array', items: { type: 'string' } },
      },
      required: ['offerIds'],
    },
  },
  {
    name: 'request_approval',
    description: 'Ask the buyer to approve a draft message, offer acceptance, or booking.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['send_vendor_message', 'accept_offer', 'place_booking'],
        },
        summary: { type: 'string' },
        draftMessage: { type: 'string' },
        offerId: { type: 'string' },
        amountMinor: { type: 'integer' },
      },
      required: ['action', 'summary'],
    },
  },
  {
    name: 'notify_user',
    description: 'Send a short in-app notification to the buyer.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
        priority: { type: 'string', enum: ['normal', 'high'] },
      },
      required: ['title', 'body'],
    },
  },
];

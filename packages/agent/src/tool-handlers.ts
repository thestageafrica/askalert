import {
  matchVendors,
  rankOffers,
  type BuyerMatchRequest,
  type CategoryMatchingConfig,
  type VendorMatchProfile,
  type VendorOfferInput,
} from '@askalert/core';
import {
  askClarifyingQuestionArgsSchema,
  counterOfferArgsSchema,
  notifyUserArgsSchema,
  parseQuoteArgsSchema,
  rankAndExplainArgsSchema,
  requestApprovalArgsSchema,
  searchVendorsArgsSchema,
} from './tools';
import type { AgentMode, AgentToolName, BuyerSecrets } from './types';
import { checkOutboundLeak, checkVendorInjection } from './guardrails';
import { stripSecretsFromVendorPrompt } from './secrets';
import { toolsAllowedForMode } from './modes';

export type ToolHandlerContext = {
  mode: AgentMode;
  secrets: BuyerSecrets;
  autonomy: 'assist' | 'autopilot';
  autopilotMaxRounds: number;
  vendorsPerRequest: number;
  category: CategoryMatchingConfig;
  vendors: VendorMatchProfile[];
  offers: VendorOfferInput[];
  rankingBudgetMinMinor?: number | null;
  rankingBudgetMaxMinor?: number | null;
};

export type ToolHandlerResult = {
  ok: boolean;
  tool: AgentToolName;
  result: unknown;
  error?: string;
};

export function handleAgentTool(
  name: AgentToolName,
  rawArgs: unknown,
  ctx: ToolHandlerContext,
): ToolHandlerResult {
  if (!toolsAllowedForMode(ctx.mode).includes(name)) {
    return {
      ok: false,
      tool: name,
      result: null,
      error: `Tool ${name} is not available in ${ctx.mode} mode.`,
    };
  }

  switch (name) {
    case 'ask_clarifying_question': {
      const args = askClarifyingQuestionArgsSchema.parse(rawArgs);
      return { ok: true, tool: name, result: args };
    }
    case 'search_vendors': {
      const parsed = searchVendorsArgsSchema.parse(rawArgs);
      const request: BuyerMatchRequest = {
        categorySlug: parsed.categorySlug || ctx.category.slug,
        areaSlug: parsed.areaSlug ?? '',
        capacity: parsed.capacity ?? null,
        serviceDate: parsed.neededBy ?? null,
        budgetMinMinor: ctx.rankingBudgetMinMinor ?? null,
        budgetMaxMinor: softCapForMatching(ctx.secrets.budgetMaxMinor),
        minVerificationTier: null,
      };

      const matched = matchVendors({
        vendors: ctx.vendors,
        request,
        category: ctx.category,
        vendorsPerRequest: ctx.vendorsPerRequest,
      });
      return {
        ok: true,
        tool: name,
        result: {
          topN: matched.topN,
          unmetDemand: matched.unmetDemand,
          vendors: matched.ranked.map((row) => ({
            vendorProfileId: row.vendor.vendorProfileId,
            score: row.score.total,
            breakdown: row.score,
          })),
        },
      };
    }
    case 'parse_quote': {
      const args = parseQuoteArgsSchema.parse(rawArgs);
      const injection = checkVendorInjection(args.vendorMessage);
      if (injection.blocked) {
        return {
          ok: false,
          tool: name,
          result: {
            ignored: true,
            reason: injection.reason,
            safeReply: injection.safeReply,
          },
          error: injection.reason ?? 'blocked',
        };
      }
      return { ok: true, tool: name, result: parseVendorQuote(args.vendorMessage) };
    }
    case 'counter_offer': {
      const args = counterOfferArgsSchema.parse(rawArgs);
      const ceiling = ctx.secrets.budgetMaxMinor;
      if (ceiling != null && args.proposedAmountMinor > ceiling) {
        return {
          ok: false,
          tool: name,
          result: null,
          error: 'Counter-offer is above the buyer’s private limit. Not sent.',
        };
      }
      if (ctx.autonomy === 'autopilot' && args.round >= ctx.autopilotMaxRounds) {
        return {
          ok: false,
          tool: name,
          result: null,
          error: 'Autopilot round limit reached. Ask the buyer for approval to continue.',
        };
      }
      const scrubbed = stripSecretsFromVendorPrompt(args.message, ctx.secrets);
      if (ctx.autonomy === 'assist') {
        return {
          ok: true,
          tool: name,
          result: {
            requiresApproval: true,
            ...args,
            message: scrubbed.text,
          },
        };
      }
      const leak = checkOutboundLeak(scrubbed.text, ceiling != null ? [ceiling] : []);
      if (leak.blocked) {
        return { ok: false, tool: name, result: null, error: leak.reason ?? 'leak' };
      }
      return {
        ok: true,
        tool: name,
        result: {
          requiresApproval: false,
          ...args,
          message: scrubbed.text,
        },
      };
    }
    case 'rank_and_explain': {
      const args = rankAndExplainArgsSchema.parse(rawArgs);
      const selected = ctx.offers.filter((offer) => args.offerIds.includes(offer.id));
      const ranked = rankOffers(selected, {
        budgetMinMinor: ctx.rankingBudgetMinMinor ?? null,
        budgetMaxMinor: softCapForMatching(ctx.secrets.budgetMaxMinor),
      });
      return {
        ok: true,
        tool: name,
        result: ranked.map((row) => ({
          offerId: row.offer.id,
          amountMinor: row.offer.amountMinor,
          reason: row.reason,
          rankScore: row.rankScore,
        })),
      };
    }
    case 'request_approval': {
      const args = requestApprovalArgsSchema.parse(rawArgs);
      if (args.draftMessage) {
        args.draftMessage = stripSecretsFromVendorPrompt(args.draftMessage, ctx.secrets).text;
      }
      return { ok: true, tool: name, result: { pendingBuyerApproval: true, ...args } };
    }
    case 'notify_user': {
      const args = notifyUserArgsSchema.parse(rawArgs);
      return { ok: true, tool: name, result: args };
    }
  }
}

function softCapForMatching(ceiling: number | null): number | null {
  if (ceiling == null) return null;
  return Math.round(ceiling * 0.9);
}

export function parseVendorQuote(vendorMessage: string): {
  amountMinor: number | null;
  currency: 'NGN';
  notes: string;
  confidence: number;
} {
  const cleaned = vendorMessage.replace(/,/g, '');
  const nairaMatch =
    cleaned.match(/₦\s*(\d+(?:\.\d+)?)\s*(k|m)?/i) ??
    cleaned.match(/\b(?:ngn|naira)?\s*(\d+(?:\.\d+)?)\s*(k|m)?\b/i);
  if (!nairaMatch) {
    return {
      amountMinor: null,
      currency: 'NGN',
      notes: vendorMessage.slice(0, 240),
      confidence: 0.25,
    };
  }
  const raw = Number(nairaMatch[1]);
  const suffix = (nairaMatch[2] ?? '').toLowerCase();
  let naira = raw;
  if (suffix === 'k') naira = raw * 1_000;
  if (suffix === 'm') naira = raw * 1_000_000;
  const amountMinor = Math.round(naira * 100);
  const confidence = /₦|naira|ngn/i.test(vendorMessage) ? 0.86 : 0.62;
  return {
    amountMinor,
    currency: 'NGN',
    notes: vendorMessage.slice(0, 240),
    confidence,
  };
}

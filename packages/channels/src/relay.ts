import {
  checkEntitlement,
  type EntitlementDecision,
  type UserPlanState,
} from '@askalert/core';
import { maskContactDetails } from './mask-contact';
import type { ChannelAdapter, OutboundMessage, SendContext, SendResult } from './types';

export type RelayInput = {
  state: UserPlanState;
  adapter: ChannelAdapter;
  message: OutboundMessage;
  context: SendContext;
};

export type RelayResult = {
  decision: EntitlementDecision;
  blocked: boolean;
  masked: boolean;
  reasons: string[];
  message: OutboundMessage;
  send?: SendResult;
};

/**
 * Every outbound relayed message must pass entitlement, then masking, then the adapter.
 */
export async function relayMessage(input: RelayInput): Promise<RelayResult> {
  let decision: EntitlementDecision = { outcome: 'allow' };

  if (input.context.relayed) {
    decision = checkEntitlement(input.state, 'relay_message');
    if (decision.outcome === 'block') {
      return {
        decision,
        blocked: true,
        masked: false,
        reasons: [],
        message: input.message,
      };
    }
  }

  if (input.context.channel === 'whatsapp') {
    decision = checkEntitlement(input.state, 'send_whatsapp');
    if (decision.outcome === 'block') {
      return {
        decision,
        blocked: true,
        masked: false,
        reasons: [],
        message: input.message,
      };
    }
  }

  const mask = maskContactDetails(input.message.body);
  const message: OutboundMessage = {
    ...input.message,
    body: mask.text,
    filtered: mask.masked || Boolean(input.message.filtered),
  };

  if (!input.adapter.supportsRelay && input.context.relayed) {
    return {
      decision,
      blocked: true,
      masked: mask.masked,
      reasons: mask.reasons,
      message,
      send: {
        ok: false,
        channel: input.context.channel,
        error: `${input.adapter.name} does not support relay.`,
      },
    };
  }

  const send = await input.adapter.send(message, input.context);
  return {
    decision,
    blocked: false,
    masked: mask.masked,
    reasons: mask.reasons,
    message,
    send,
  };
}

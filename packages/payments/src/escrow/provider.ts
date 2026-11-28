import type { EscrowCapabilities } from './capabilities';
import type {
  CreateEscrowInput,
  DisputeEvidence,
  EscrowRecord,
  FundingInstructions,
  ParsedWebhook,
  WebhookVerificationResult,
} from './types';

/**
 * Provider-agnostic escrow contract.
 * AskAlert never holds customer funds — adapters talk to licensed partners (or the sandbox mock).
 */
export type EscrowProvider = {
  readonly key: string;
  readonly sandbox: boolean;

  capabilities(): EscrowCapabilities;
  createEscrow(input: CreateEscrowInput): Promise<EscrowRecord>;
  getFundingInstructions(escrowId: string): Promise<FundingInstructions>;
  /** Apply a funded notification from the partner (or simulate funding in sandbox). */
  onFunded(escrowId: string, providerEventId: string): Promise<EscrowRecord>;
  releaseMilestone(escrowId: string, milestoneId: string): Promise<EscrowRecord>;
  releaseAll(escrowId: string): Promise<EscrowRecord>;
  refund(escrowId: string, amountMinor: number, reason: string): Promise<EscrowRecord>;
  /** Pause pending milestones (claims). Prefer this over openDispute when the claim system owns evidence. */
  pause(escrowId: string, reason: string): Promise<EscrowRecord>;
  resume(escrowId: string): Promise<EscrowRecord>;
  openDispute(escrowId: string, evidence: DisputeEvidence): Promise<EscrowRecord>;
  getStatus(escrowId: string): Promise<EscrowRecord>;
  verifyWebhookSignature(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookVerificationResult>;
  parseWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<ParsedWebhook>;
};

export function assertCapability(
  provider: EscrowProvider,
  capability: keyof EscrowCapabilities,
): void {
  const caps = provider.capabilities();
  const value = caps[capability];
  const allowed = typeof value === 'boolean' ? value : Array.isArray(value) ? value.length > 0 : true;
  if (!allowed) {
    throw new Error(
      `Provider ${provider.key} does not support capability '${capability}'. Choose another mode or provider.`,
    );
  }
}

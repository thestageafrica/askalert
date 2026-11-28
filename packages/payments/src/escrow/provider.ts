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

  createEscrow(input: CreateEscrowInput): Promise<EscrowRecord>;
  getFundingInstructions(escrowId: string): Promise<FundingInstructions>;
  /** Apply a funded notification from the partner (or simulate funding in sandbox). */
  onFunded(escrowId: string, providerEventId: string): Promise<EscrowRecord>;
  releaseMilestone(escrowId: string, milestoneId: string): Promise<EscrowRecord>;
  releaseAll(escrowId: string): Promise<EscrowRecord>;
  refund(escrowId: string, amountMinor: number, reason: string): Promise<EscrowRecord>;
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

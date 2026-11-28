import { MOCK_ESCROW_CAPABILITIES, type EscrowCapabilities } from './capabilities';
import type { EscrowProvider } from './provider';
import type {
  CreateEscrowInput,
  DisputeEvidence,
  EscrowRecord,
  FundingInstructions,
  ParsedWebhook,
  WebhookVerificationResult,
} from './types';

export type PartnerEscrowProviderOptions = {
  apiKey?: string;
  webhookSecret?: string;
  baseUrl?: string;
};

/**
 * Skeleton for a licensed escrow partner adapter.
 * Wire real HTTP calls only after the partner contract and API docs are available.
 */
export class PartnerEscrowProvider implements EscrowProvider {
  readonly key = 'partner';
  readonly sandbox: boolean;

  private readonly apiKey: string | undefined;
  private readonly webhookSecret: string | undefined;
  private readonly baseUrl: string | undefined;

  constructor(options: PartnerEscrowProviderOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.ESCROW_PARTNER_API_KEY;
    this.webhookSecret = options.webhookSecret ?? process.env.ESCROW_PARTNER_WEBHOOK_SECRET;
    this.baseUrl = options.baseUrl ?? process.env.ESCROW_PARTNER_BASE_URL;
    this.sandbox = (process.env.ESCROW_LIVE ?? '').toLowerCase() !== 'true';
  }

  private notImplemented(method: string): never {
    // TODO(partner): implement against the chosen licensed institution's API.
    // Do not guess endpoints or fields — paste the partner docs before filling this in.
    throw new Error(
      `PartnerEscrowProvider.${method} is not implemented yet. ` +
        `Set ESCROW_PARTNER_API_KEY / ESCROW_PARTNER_WEBHOOK_SECRET and paste the partner API docs before enabling ESCROW_PROVIDER=partner.`,
    );
  }

  capabilities(): EscrowCapabilities {
    return {
      ...MOCK_ESCROW_CAPABILITIES,
      nativeHold: false,
      payInMethods: ['partner'],
    };
  }

  async createEscrow(_input: CreateEscrowInput): Promise<EscrowRecord> {
    this.notImplemented('createEscrow');
  }

  async getFundingInstructions(_escrowId: string): Promise<FundingInstructions> {
    this.notImplemented('getFundingInstructions');
  }

  async onFunded(_escrowId: string, _providerEventId: string): Promise<EscrowRecord> {
    this.notImplemented('onFunded');
  }

  async releaseMilestone(_escrowId: string, _milestoneId: string): Promise<EscrowRecord> {
    this.notImplemented('releaseMilestone');
  }

  async releaseAll(_escrowId: string): Promise<EscrowRecord> {
    this.notImplemented('releaseAll');
  }

  async refund(
    _escrowId: string,
    _amountMinor: number,
    _reason: string,
  ): Promise<EscrowRecord> {
    this.notImplemented('refund');
  }

  async pause(_escrowId: string, _reason: string): Promise<EscrowRecord> {
    this.notImplemented('pause');
  }

  async resume(_escrowId: string): Promise<EscrowRecord> {
    this.notImplemented('resume');
  }

  async openDispute(_escrowId: string, _evidence: DisputeEvidence): Promise<EscrowRecord> {
    this.notImplemented('openDispute');
  }

  async getStatus(_escrowId: string): Promise<EscrowRecord> {
    this.notImplemented('getStatus');
  }

  async verifyWebhookSignature(
    _rawBody: string,
    _headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookVerificationResult> {
    if (!this.webhookSecret) {
      return { ok: false, reason: 'ESCROW_PARTNER_WEBHOOK_SECRET is not configured.' };
    }
    // TODO(partner): verify signature exactly as the partner documentation describes.
    this.notImplemented('verifyWebhookSignature');
  }

  async parseWebhook(
    _rawBody: string,
    _headers: Record<string, string | string[] | undefined>,
  ): Promise<ParsedWebhook> {
    this.notImplemented('parseWebhook');
  }
}

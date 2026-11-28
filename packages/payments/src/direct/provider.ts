import type {
  BalanceRow,
  CreateSubaccountInput,
  CreateSubaccountResult,
  FxQuote,
  FxQuoteRequest,
  FxTradeResult,
  InitiateCheckoutInput,
  InitiateCheckoutResult,
  RefundInput,
  RefundResult,
  ResolveAccountInput,
  ResolveAccountResult,
  TransferInput,
  TransferResult,
  VerifiedTransaction,
} from './types';

/**
 * Direct (non-escrow) payment provider.
 * Flutterwave is the first implementation; Starter pass and credit packs use this path.
 */
export type DirectPaymentProvider = {
  readonly key: string;
  readonly sandbox: boolean;

  initiateCheckout(input: InitiateCheckoutInput): Promise<InitiateCheckoutResult>;
  /**
   * ALWAYS verify with the provider before marking anything paid.
   * Checks status, tx_ref, currency and amount against expectations.
   */
  verifyTransaction(options: {
    providerTxnId: string;
    expectedTxRef: string;
    expectedAmountMinor: number;
    expectedCurrency: 'NGN' | 'USD';
  }): Promise<VerifiedTransaction>;

  refund(input: RefundInput): Promise<RefundResult>;
  createVendorSubaccount(input: CreateSubaccountInput): Promise<CreateSubaccountResult>;
  resolveBankAccount(input: ResolveAccountInput): Promise<ResolveAccountResult>;
  transfer(input: TransferInput): Promise<TransferResult>;
  getBalances(): Promise<BalanceRow[]>;
  getBalance(currency: 'NGN' | 'USD'): Promise<BalanceRow>;
  requestFxQuote(input: FxQuoteRequest): Promise<FxQuote>;
  executeFxTrade(quoteId: string, narration?: string): Promise<FxTradeResult>;
};

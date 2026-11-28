import { z } from 'zod';

export const paymentCurrencySchema = z.enum(['NGN', 'USD']);
export type PaymentCurrency = z.infer<typeof paymentCurrencySchema>;

export type MoneyAmount = {
  amountMinor: number;
  currency: PaymentCurrency;
};

export type CheckoutCustomer = {
  email: string;
  name?: string;
  phoneNumber?: string;
};

export type SplitSubaccount = {
  /** Flutterwave collection subaccount id (e.g. RS_…). */
  subaccountId: string;
  /** Optional flat transaction fee override in minor units. */
  transactionChargeMinor?: number;
};

export type InitiateCheckoutInput = {
  amount: MoneyAmount;
  txRef: string;
  redirectUrl: string;
  customer: CheckoutCustomer;
  /** Vendor share via collection subaccounts; AskAlert keeps the remainder. */
  subaccounts?: SplitSubaccount[];
  meta?: Record<string, string>;
  paymentOptions?: string;
  idempotencyKey?: string;
};

export type InitiateCheckoutResult = {
  txRef: string;
  checkoutUrl: string;
  sandbox: boolean;
  provider: 'flutterwave';
  rawStatus: string;
};

export type VerifiedTransaction = {
  providerTxnId: string;
  txRef: string;
  flwRef: string | null;
  status: 'successful' | 'failed' | 'pending' | 'unknown';
  amount: MoneyAmount;
  chargedAmount: MoneyAmount;
  customerEmail: string | null;
  paymentType: string | null;
  verified: boolean;
  reason?: string;
};

export type RefundInput = {
  providerTxnId: string;
  amountMinor?: number;
  currency: PaymentCurrency;
  comments?: string;
  idempotencyKey?: string;
};

export type RefundResult = {
  refundId: string;
  status: string;
  amountRefundedMinor: number;
  currency: PaymentCurrency;
};

export type CreateSubaccountInput = {
  accountBank: string;
  accountNumber: string;
  businessName: string;
  country: string;
  businessMobile: string;
  businessEmail?: string;
  businessContact?: string;
  /** Decimal share for Flutterwave (0.5 = 50%). */
  splitValue: number;
  splitType?: 'percentage' | 'flat';
};

export type CreateSubaccountResult = {
  subaccountId: string;
  accountName: string | null;
  bankName: string | null;
  /** Masked account number for display — never log the full number. */
  accountNumberMasked: string;
};

export type ResolveAccountInput = {
  accountBank: string;
  accountNumber: string;
};

export type ResolveAccountResult = {
  accountName: string;
  accountNumberMasked: string;
};

export type TransferInput = {
  accountBank: string;
  accountNumber: string;
  amount: MoneyAmount;
  narration?: string;
  reference: string;
  beneficiaryName?: string;
  debitCurrency?: PaymentCurrency;
  idempotencyKey?: string;
};

export type TransferResult = {
  transferId: string;
  reference: string;
  status: string;
  amount: MoneyAmount;
};

export type BalanceRow = {
  currency: PaymentCurrency | string;
  availableMinor: number;
  ledgerMinor: number;
};

export type FxQuoteRequest = {
  baseCurrency: PaymentCurrency;
  targetCurrency: PaymentCurrency;
  /** Amount of base currency in minor units. */
  quantityMinor: number;
  reference?: string;
};

export type FxQuote = {
  quoteId: string;
  status: string;
  rate: number | null;
  approvedQuantityMinor: number | null;
  totalValueMinor: number | null;
  expiry: string | null;
};

export type FxTradeResult = {
  tradeId: string;
  status: string;
  quoteId: string;
};

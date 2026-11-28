import type { DirectPaymentProvider } from '../../direct/provider';
import type {
  BalanceRow,
  CreateSubaccountInput,
  CreateSubaccountResult,
  FxQuote,
  FxQuoteRequest,
  FxTradeResult,
  InitiateCheckoutInput,
  InitiateCheckoutResult,
  PaymentCurrency,
  RefundInput,
  RefundResult,
  ResolveAccountInput,
  ResolveAccountResult,
  TransferInput,
  TransferResult,
  VerifiedTransaction,
} from '../../direct/types';
import { FlutterwaveClient } from './client';
import {
  flutterwaveMajorToMinor,
  maskAccountNumber,
  minorToFlutterwaveMajor,
} from './money';

type PaymentInitData = { link: string };
type VerifyData = {
  id: number;
  tx_ref: string;
  flw_ref?: string;
  status: string;
  amount: number;
  currency: string;
  charged_amount?: number;
  customer?: { email?: string };
  payment_type?: string;
};
type RefundData = {
  id: number;
  amount_refunded: number;
  status: string;
};
type SubaccountData = {
  subaccount_id: string;
  full_name?: string;
  bank_name?: string;
  account_number?: string;
};
type ResolveData = { account_name: string; account_number: string };
type TransferData = {
  id: number;
  reference?: string;
  status: string;
  amount: number;
  currency: string;
};
type BalanceData = {
  currency: string;
  available_balance: number;
  ledger_balance: number;
};
type RfqData = {
  id: string | number;
  status: string;
  quote?: {
    best_available_rate?: number;
    approved_quantity?: number;
    total_value?: number;
    expiry?: string;
  };
};
type TradeData = { id: string | number; status: string; quote_id?: string };

/**
 * Flutterwave direct payments (v3).
 * Docs: POST /payments, GET /transactions/{id}/verify, POST /transactions/{id}/refund,
 * POST /subaccounts, POST /accounts/resolve, POST /transfers, GET /balances, POST /rfq, POST /trades.
 */
export class FlutterwaveDirectProvider implements DirectPaymentProvider {
  readonly key = 'flutterwave';
  readonly sandbox: boolean;
  private readonly client: FlutterwaveClient;
  private readonly usdEnabled: boolean;

  constructor(
    client: FlutterwaveClient,
    options: { usdEnabled?: boolean } = {},
  ) {
    this.client = client;
    this.sandbox = client.sandbox;
    this.usdEnabled = options.usdEnabled ?? false;
  }

  private assertCurrency(currency: PaymentCurrency): void {
    if (currency === 'USD' && !this.usdEnabled) {
      throw new Error(
        'USD is not enabled for this Flutterwave account. Set FLW_USD_ENABLED=true after Flutterwave enables it.',
      );
    }
  }

  async initiateCheckout(input: InitiateCheckoutInput): Promise<InitiateCheckoutResult> {
    this.assertCurrency(input.amount.currency);
    if (!Number.isInteger(input.amount.amountMinor) || input.amount.amountMinor <= 0) {
      throw new Error('Checkout amount must be a positive integer in minor units.');
    }

    const body: Record<string, unknown> = {
      amount: minorToFlutterwaveMajor(input.amount.amountMinor, input.amount.currency),
      tx_ref: input.txRef,
      currency: input.amount.currency,
      redirect_url: input.redirectUrl,
      customer: {
        email: input.customer.email,
        name: input.customer.name,
        phone_number: input.customer.phoneNumber,
      },
      meta: input.meta,
      payment_options: input.paymentOptions,
    };

    if (input.subaccounts?.length) {
      body.subaccounts = input.subaccounts.map((item) => {
        const row: Record<string, unknown> = { id: item.subaccountId };
        if (item.transactionChargeMinor != null) {
          row.transaction_charge = minorToFlutterwaveMajor(
            item.transactionChargeMinor,
            input.amount.currency,
          );
        }
        return row;
      });
    }

    const response = await this.client.request<PaymentInitData>('POST', '/payments', {
      body,
      idempotencyKey: input.idempotencyKey ?? input.txRef,
    });

    if (!response.data?.link) {
      throw new Error('Flutterwave checkout did not return a payment link.');
    }

    return {
      txRef: input.txRef,
      checkoutUrl: response.data.link,
      sandbox: this.sandbox,
      provider: 'flutterwave',
      rawStatus: response.status,
    };
  }

  async verifyTransaction(options: {
    providerTxnId: string;
    expectedTxRef: string;
    expectedAmountMinor: number;
    expectedCurrency: PaymentCurrency;
  }): Promise<VerifiedTransaction> {
    this.assertCurrency(options.expectedCurrency);
    const response = await this.client.request<VerifyData>(
      'GET',
      `/transactions/${encodeURIComponent(options.providerTxnId)}/verify`,
    );
    const tx = response.data;
    const currency = (tx.currency ?? options.expectedCurrency) as PaymentCurrency;
    const amountMinor = flutterwaveMajorToMinor(Number(tx.amount), currency);
    const chargedMinor = flutterwaveMajorToMinor(
      Number(tx.charged_amount ?? tx.amount),
      currency,
    );

    const statusRaw = String(tx.status ?? '').toLowerCase();
    const status: VerifiedTransaction['status'] =
      statusRaw === 'successful'
        ? 'successful'
        : statusRaw === 'failed'
          ? 'failed'
          : statusRaw === 'pending'
            ? 'pending'
            : 'unknown';

    const verified =
      status === 'successful' &&
      tx.tx_ref === options.expectedTxRef &&
      currency === options.expectedCurrency &&
      amountMinor >= options.expectedAmountMinor;

    return {
      providerTxnId: String(tx.id),
      txRef: tx.tx_ref,
      flwRef: tx.flw_ref ?? null,
      status,
      amount: { amountMinor, currency },
      chargedAmount: { amountMinor: chargedMinor, currency },
      customerEmail: tx.customer?.email ?? null,
      paymentType: tx.payment_type ?? null,
      verified,
      reason: verified
        ? undefined
        : `Verification failed (status=${status}, tx_ref match=${tx.tx_ref === options.expectedTxRef}, currency=${currency}, amountMinor=${amountMinor}).`,
    };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    this.assertCurrency(input.currency);
    const body: Record<string, unknown> = {
      comments: input.comments,
    };
    if (input.amountMinor != null) {
      body.amount = minorToFlutterwaveMajor(input.amountMinor, input.currency);
    }

    const response = await this.client.request<RefundData>(
      'POST',
      `/transactions/${encodeURIComponent(input.providerTxnId)}/refund`,
      {
        body,
        idempotencyKey: input.idempotencyKey,
      },
    );

    return {
      refundId: String(response.data.id),
      status: response.data.status,
      amountRefundedMinor: flutterwaveMajorToMinor(
        Number(response.data.amount_refunded),
        input.currency,
      ),
      currency: input.currency,
    };
  }

  async createVendorSubaccount(
    input: CreateSubaccountInput,
  ): Promise<CreateSubaccountResult> {
    const response = await this.client.request<SubaccountData>('POST', '/subaccounts', {
      body: {
        account_bank: input.accountBank,
        account_number: input.accountNumber,
        business_name: input.businessName,
        country: input.country,
        split_value: input.splitValue,
        split_type: input.splitType ?? 'percentage',
        business_mobile: input.businessMobile,
        business_email: input.businessEmail,
        business_contact: input.businessContact,
      },
    });

    return {
      subaccountId: response.data.subaccount_id,
      accountName: response.data.full_name ?? null,
      bankName: response.data.bank_name ?? null,
      accountNumberMasked: maskAccountNumber(
        response.data.account_number ?? input.accountNumber,
      ),
    };
  }

  async resolveBankAccount(input: ResolveAccountInput): Promise<ResolveAccountResult> {
    const response = await this.client.request<ResolveData>('POST', '/accounts/resolve', {
      body: {
        account_bank: input.accountBank,
        account_number: input.accountNumber,
      },
    });
    return {
      accountName: response.data.account_name,
      accountNumberMasked: maskAccountNumber(
        response.data.account_number ?? input.accountNumber,
      ),
    };
  }

  async transfer(input: TransferInput): Promise<TransferResult> {
    this.assertCurrency(input.amount.currency);
    const response = await this.client.request<TransferData>('POST', '/transfers', {
      body: {
        account_bank: input.accountBank,
        account_number: input.accountNumber,
        amount: minorToFlutterwaveMajor(input.amount.amountMinor, input.amount.currency),
        currency: input.amount.currency,
        narration: input.narration,
        reference: input.reference,
        beneficiary_name: input.beneficiaryName,
        debit_currency: input.debitCurrency,
      },
      idempotencyKey: input.idempotencyKey ?? input.reference,
    });

    return {
      transferId: String(response.data.id),
      reference: response.data.reference ?? input.reference,
      status: response.data.status,
      amount: {
        amountMinor: flutterwaveMajorToMinor(
          Number(response.data.amount),
          (response.data.currency as PaymentCurrency) || input.amount.currency,
        ),
        currency: input.amount.currency,
      },
    };
  }

  async getBalances(): Promise<BalanceRow[]> {
    const response = await this.client.request<BalanceData[]>('GET', '/balances');
    const rows = Array.isArray(response.data) ? response.data : [];
    return rows.map((row) => ({
      currency: row.currency,
      availableMinor: flutterwaveMajorToMinor(
        Number(row.available_balance),
        (row.currency as PaymentCurrency) || 'NGN',
      ),
      ledgerMinor: flutterwaveMajorToMinor(
        Number(row.ledger_balance),
        (row.currency as PaymentCurrency) || 'NGN',
      ),
    }));
  }

  async getBalance(currency: PaymentCurrency): Promise<BalanceRow> {
    this.assertCurrency(currency);
    const response = await this.client.request<BalanceData>(
      'GET',
      `/balances/${encodeURIComponent(currency)}`,
    );
    return {
      currency,
      availableMinor: flutterwaveMajorToMinor(Number(response.data.available_balance), currency),
      ledgerMinor: flutterwaveMajorToMinor(Number(response.data.ledger_balance), currency),
    };
  }

  async requestFxQuote(input: FxQuoteRequest): Promise<FxQuote> {
    this.assertCurrency(input.baseCurrency);
    this.assertCurrency(input.targetCurrency);
    const response = await this.client.request<RfqData>('POST', '/rfq', {
      body: {
        base_currency: input.baseCurrency,
        target_currency: input.targetCurrency,
        quantity: minorToFlutterwaveMajor(input.quantityMinor, input.baseCurrency),
        reference: input.reference,
      },
    });
    const quote = response.data.quote;
    return {
      quoteId: String(response.data.id),
      status: response.data.status,
      rate: quote?.best_available_rate ?? null,
      approvedQuantityMinor:
        quote?.approved_quantity != null
          ? flutterwaveMajorToMinor(Number(quote.approved_quantity), input.baseCurrency)
          : null,
      totalValueMinor:
        quote?.total_value != null
          ? flutterwaveMajorToMinor(Number(quote.total_value), input.targetCurrency)
          : null,
      expiry: quote?.expiry ?? null,
    };
  }

  async executeFxTrade(quoteId: string, narration?: string): Promise<FxTradeResult> {
    const response = await this.client.request<TradeData>('POST', '/trades', {
      body: {
        quote_id: quoteId,
        narration,
      },
    });
    return {
      tradeId: String(response.data.id),
      status: response.data.status,
      quoteId: String(response.data.quote_id ?? quoteId),
    };
  }
}

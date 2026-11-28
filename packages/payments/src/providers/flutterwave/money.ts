import type { PaymentCurrency } from '../../direct/types';

/**
 * Flutterwave v3 amounts are major units (naira / dollars), not kobo/cents.
 * Convert only at the adapter boundary — AskAlert stores integers in minor units.
 */
export function minorToFlutterwaveMajor(amountMinor: number, currency: PaymentCurrency): number {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) {
    throw new Error('amountMinor must be a non-negative integer.');
  }
  if (currency === 'NGN' || currency === 'USD') {
    return amountMinor / 100;
  }
  throw new Error(`Unsupported currency: ${currency}`);
}

export function flutterwaveMajorToMinor(
  amountMajor: number,
  currency: PaymentCurrency,
): number {
  if (!Number.isFinite(amountMajor)) {
    throw new Error('Flutterwave amount must be a finite number.');
  }
  if (currency === 'NGN' || currency === 'USD') {
    return Math.round(amountMajor * 100);
  }
  throw new Error(`Unsupported currency: ${currency}`);
}

export function maskAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, '');
  if (digits.length <= 4) {
    return '****';
  }
  return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

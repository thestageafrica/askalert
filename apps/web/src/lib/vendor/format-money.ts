/** Format integer kobo as Naira using en-NG locale rules. */
export function formatKoboNGN(amountMinor: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}
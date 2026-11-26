/** Format kobo as Naira for admin UI. */
export function formatNairaFromKobo(minor: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

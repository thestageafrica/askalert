export type Money = {
  amountKobo: number;
  currency: 'NGN';
};

function groupThousands(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format Naira for display.
 * Uses the en-NG digit grouping style (comma thousands, 2 decimal places).
 * Implemented with integer math so formatting never depends on float money
 * storage and stays reliable across Node ICU builds.
 */
export function formatNaira(money: Money): string {
  if (!Number.isInteger(money.amountKobo)) {
    throw new Error('Money amounts must be integers in kobo.');
  }

  const negative = money.amountKobo < 0;
  const absolute = Math.abs(money.amountKobo);
  const major = Math.trunc(absolute / 100);
  const minor = absolute % 100;
  const formatted = `${groupThousands(major)}.${minor.toString().padStart(2, '0')}`;

  // Match Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }) shape.
  return `${negative ? '-' : ''}₦${formatted}`;
}

export function createMoney(amountKobo: number, currency: Money['currency'] = 'NGN'): Money {
  if (!Number.isInteger(amountKobo)) {
    throw new Error('Money amounts must be integers in kobo.');
  }

  return { amountKobo, currency };
}

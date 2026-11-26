import type { RateBand } from './schemas';

export type RateCardValidationOptions = {
  minValue?: number;
  maxValue?: number;
  minChargeMinor?: number;
};

export type RateCardValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

const LARGE_JUMP_RATIO = 0.35;

function sortBands(bands: readonly RateBand[]): RateBand[] {
  return [...bands].sort((a, b) => a.dimMin - b.dimMin || a.dimMax - b.dimMax);
}

function effectiveUnitPrice(band: RateBand): number {
  if (band.basis === 'per_unit') {
    return band.priceMinor;
  }
  const span = band.dimMax - band.dimMin + 1;
  return Math.round(band.priceMinor / span);
}

export function validateRateCard(
  bands: readonly RateBand[],
  opts?: RateCardValidationOptions,
): RateCardValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (bands.length === 0) {
    errors.push('Rate card must include at least one band.');
    return { ok: false, errors, warnings };
  }

  const sorted = sortBands(bands);

  for (const band of sorted) {
    if (band.currency !== 'NGN') {
      errors.push(`Band ${band.dimMin}-${band.dimMax} must use NGN.`);
    }
    if (!Number.isInteger(band.priceMinor) || band.priceMinor <= 0) {
      errors.push(`Band ${band.dimMin}-${band.dimMax} needs a positive whole-kobo price.`);
    }
    if (band.dimMin > band.dimMax) {
      errors.push(`Band ${band.dimMin}-${band.dimMax}: minimum must not exceed maximum.`);
    }
    if (opts?.minValue !== undefined && band.dimMin < opts.minValue) {
      errors.push(
        `Band starts at ${band.dimMin}, below service minimum ${opts.minValue}.`,
      );
    }
    if (opts?.maxValue !== undefined && band.dimMax > opts.maxValue) {
      errors.push(`Band ends at ${band.dimMax}, above service maximum ${opts.maxValue}.`);
    }
  }

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const current = sorted[i]!;
    const next = sorted[i + 1]!;
    if (current.dimMax >= next.dimMin) {
      errors.push(
        `Bands overlap: ${current.dimMin}-${current.dimMax} and ${next.dimMin}-${next.dimMax}.`,
      );
    }
    if (next.dimMin < current.dimMax) {
      errors.push(
        `Bands are not ascending: ${current.dimMin}-${current.dimMax} then ${next.dimMin}-${next.dimMax}.`,
      );
    }
    if (next.dimMin > current.dimMax + 1) {
      warnings.push(
        `Gap between ${current.dimMin}-${current.dimMax} and ${next.dimMin}-${next.dimMax}.`,
      );
    }

    const currentUnit = effectiveUnitPrice(current);
    const nextUnit = effectiveUnitPrice(next);
    if (currentUnit > 0 && nextUnit > 0) {
      const jump = Math.abs(nextUnit - currentUnit) / currentUnit;
      if (jump >= LARGE_JUMP_RATIO) {
        warnings.push(
          `Large price jump between ${current.dimMin}-${current.dimMax} and ${next.dimMin}-${next.dimMax} (${Math.round(jump * 100)}%).`,
        );
      }
    }
  }

  if (opts?.minChargeMinor !== undefined) {
    if (!Number.isInteger(opts.minChargeMinor) || opts.minChargeMinor <= 0) {
      errors.push('Minimum charge must be a positive whole-kobo amount.');
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}
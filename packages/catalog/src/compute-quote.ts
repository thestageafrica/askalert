import type { Dimension, PricingModel, RateBand, ServiceDefinition } from './schemas';

export type VendorRateRow = RateBand & {
  minChargeMinor?: number;
  sort?: number;
};

export type VendorAddonRow = {
  id: string;
  name: string;
  priceMinor: number;
  basis: 'per_unit' | 'total' | 'flat';
  maxQty?: number;
};

export type VendorServiceQuoteInput = {
  service: Pick<
    ServiceDefinition,
    'slug' | 'pricing_model' | 'dimension' | 'min_value' | 'max_value' | 'packages'
  >;
  rates: readonly VendorRateRow[];
  minChargeMinor?: number;
  addons?: readonly VendorAddonRow[];
};

export type RequestItemQuoteInput = {
  serviceSlug: string;
  quantity: number;
  packageSlug?: string;
  addons?: readonly { addonId: string; qty: number }[];
};

export type QuoteBreakdownLine = {
  label: string;
  amountMinor: number;
};

export type ComputeQuoteResult = {
  amountMinor: number;
  currency: 'NGN';
  breakdown: QuoteBreakdownLine[];
  instantQuote: boolean;
  customQuoteNeeded: boolean;
};

function sortRates(rates: readonly VendorRateRow[]): VendorRateRow[] {
  return [...rates].sort(
    (a, b) => a.dimMin - b.dimMin || a.dimMax - b.dimMax || (a.sort ?? 0) - (b.sort ?? 0),
  );
}

function pickBand(
  rates: readonly VendorRateRow[],
  quantity: number,
): VendorRateRow | undefined {
  const sorted = sortRates(rates);
  return sorted.find((band) => quantity >= band.dimMin && quantity <= band.dimMax);
}

function bandAmount(band: VendorRateRow, quantity: number): number {
  if (band.basis === 'total') {
    return band.priceMinor;
  }
  return band.priceMinor * quantity;
}

function needsCustomQuote(
  service: VendorServiceQuoteInput['service'],
  quantity: number,
  band: VendorRateRow | undefined,
): boolean {
  if (service.pricing_model === 'quote_only') {
    return true;
  }
  if (service.min_value !== undefined && quantity < service.min_value) {
    return true;
  }
  if (service.max_value !== undefined && quantity > service.max_value) {
    return true;
  }
  if (service.pricing_model === 'banded' && !band) {
    return true;
  }
  return false;
}

function computeAddons(
  addons: readonly VendorAddonRow[] | undefined,
  selections: readonly { addonId: string; qty: number }[] | undefined,
  quantity: number,
): { lines: QuoteBreakdownLine[]; total: number } {
  if (!addons?.length || !selections?.length) {
    return { lines: [], total: 0 };
  }
  const byId = new Map(addons.map((addon) => [addon.id, addon]));
  const lines: QuoteBreakdownLine[] = [];
  let total = 0;

  for (const selection of selections) {
    const addon = byId.get(selection.addonId);
    if (!addon) {
      continue;
    }
    const qty =
      addon.maxQty !== undefined ? Math.min(selection.qty, addon.maxQty) : selection.qty;
    if (qty <= 0) {
      continue;
    }
    let amount = addon.priceMinor;
    if (addon.basis === 'per_unit') {
      amount = addon.priceMinor * qty;
    } else if (addon.basis === 'total') {
      amount = addon.priceMinor * qty;
    } else {
      amount = addon.priceMinor * qty;
    }
    total += amount;
    lines.push({ label: `${addon.name} × ${qty}`, amountMinor: amount });
  }

  return { lines, total };
}

export function computeQuote(
  vendorService: VendorServiceQuoteInput,
  requestItem: RequestItemQuoteInput,
): ComputeQuoteResult {
  const breakdown: QuoteBreakdownLine[] = [];
  let subtotal = 0;
  const { service, rates, minChargeMinor, addons } = vendorService;
  const quantity = requestItem.quantity;

  if (service.slug !== requestItem.serviceSlug) {
    return {
      amountMinor: 0,
      currency: 'NGN',
      breakdown: [],
      instantQuote: false,
      customQuoteNeeded: true,
    };
  }

  const band = service.pricing_model === 'banded' ? pickBand(rates, quantity) : undefined;
  const custom = needsCustomQuote(service, quantity, band);

  if (custom) {
    return {
      amountMinor: 0,
      currency: 'NGN',
      breakdown: [{ label: 'Custom quote needed', amountMinor: 0 }],
      instantQuote: false,
      customQuoteNeeded: true,
    };
  }

  switch (service.pricing_model as PricingModel) {
    case 'banded': {
      const selected = band;
      if (!selected) {
        return {
          amountMinor: 0,
          currency: 'NGN',
          breakdown: [],
          instantQuote: false,
          customQuoteNeeded: true,
        };
      }
      subtotal = bandAmount(selected, quantity);
      breakdown.push({
        label: selected.label ?? `${selected.dimMin}-${selected.dimMax}`,
        amountMinor: subtotal,
      });
      break;
    }
    case 'per_unit': {
      const unitRate = rates[0];
      if (!unitRate) {
        return {
          amountMinor: 0,
          currency: 'NGN',
          breakdown: [],
          instantQuote: false,
          customQuoteNeeded: true,
        };
      }
      subtotal = unitRate.priceMinor * quantity;
      breakdown.push({
        label: unitRate.label ?? 'Per unit',
        amountMinor: subtotal,
      });
      break;
    }
    case 'flat': {
      const flat = rates[0];
      if (!flat) {
        return {
          amountMinor: 0,
          currency: 'NGN',
          breakdown: [],
          instantQuote: false,
          customQuoteNeeded: true,
        };
      }
      subtotal = flat.priceMinor;
      breakdown.push({ label: flat.label ?? 'Flat price', amountMinor: subtotal });
      break;
    }
    case 'package': {
      const pkg = service.packages.find((p) => p.slug === requestItem.packageSlug);
      if (!pkg) {
        return {
          amountMinor: 0,
          currency: 'NGN',
          breakdown: [],
          instantQuote: false,
          customQuoteNeeded: true,
        };
      }
      subtotal = pkg.priceMinor;
      breakdown.push({ label: pkg.name, amountMinor: subtotal });
      break;
    }
    default:
      return {
        amountMinor: 0,
        currency: 'NGN',
        breakdown: [],
        instantQuote: false,
        customQuoteNeeded: true,
      };
  }

  const effectiveMin = minChargeMinor ?? band?.minChargeMinor;
  if (effectiveMin !== undefined && subtotal < effectiveMin) {
    const topUp = effectiveMin - subtotal;
    breakdown.push({ label: 'Minimum charge', amountMinor: topUp });
    subtotal = effectiveMin;
  }

  const addonResult = computeAddons(addons, requestItem.addons, quantity);
  for (const line of addonResult.lines) {
    breakdown.push(line);
  }
  subtotal += addonResult.total;

  return {
    amountMinor: subtotal,
    currency: 'NGN',
    breakdown,
    instantQuote: true,
    customQuoteNeeded: false,
  };
}

/** Documented example: catering at N6,000/guest for 100-150 guests, quantity 120. */
export const EXAMPLE_CATERING_RATE_100_150_KOBO_PER_GUEST = 600_000;
export const EXAMPLE_CATERING_120_GUESTS_KOBO = 72_000_000;

export function dimensionLabel(dimension: Dimension): string {
  const labels: Record<Dimension, string> = {
    guests: 'Guests',
    hours: 'Hours',
    nights: 'Nights',
    units: 'Units',
    guards: 'Guards',
    items: 'Items',
    none: 'Quantity',
  };
  return labels[dimension];
}
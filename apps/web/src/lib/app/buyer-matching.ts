import {
  computeQuote,
  type ComputeQuoteResult,
  type ServiceDefinition,
} from '@askalert/catalog';
import { coversLocation, type GeoNode } from '@askalert/geo';
import type { BuyerRequestDraft, BuyerRequestItem } from './buyer-request';

export const MIN_TYPICAL_PRICE_VENDORS = 3;

export type BuyerMatchVendor = {
  vendorId: string;
  alias: string;
  verified: boolean;
  rating: number;
  /** Locations this vendor covers (geo slugs). */
  coverageSlugs: string[];
  /** Types they cover for the category. */
  typeSlugs: string[];
  /** Active services with rate bands. */
  services: Array<{
    serviceSlug: string;
    definition: Pick<
      ServiceDefinition,
      'slug' | 'pricing_model' | 'dimension' | 'min_value' | 'max_value' | 'packages'
    >;
    rates: Array<{
      dimMin: number;
      dimMax: number;
      basis: 'per_unit' | 'total';
      priceMinor: number;
      currency: 'NGN';
    }>;
    blackoutDates?: string[];
  }>;
};

export type MatchedVendorQuote = {
  vendorId: string;
  alias: string;
  verified: boolean;
  rating: number;
  serviceSlug: string;
  quote: ComputeQuoteResult;
  instantQuote: boolean;
};

export type TypicalPriceEstimate = {
  vendorCount: number;
  minMinor: number;
  maxMinor: number;
  currency: 'NGN';
  showEstimate: boolean;
};

export type UnmetDemandLog = {
  id: string;
  categorySlug: string;
  typeSlug: string;
  serviceSlug: string;
  locationSlug: string;
  matchedCount: number;
  requiredCount: number;
  createdAt: string;
};

export type MatchBuyerRequestResult = {
  matches: MatchedVendorQuote[];
  vendorsCovering: number;
  typicalPrice: TypicalPriceEstimate;
  unmetDemand: UnmetDemandLog[];
};

function vendorCoversType(vendor: BuyerMatchVendor, typeSlug: string): boolean {
  return vendor.typeSlugs.includes(typeSlug) || vendor.typeSlugs.includes('all');
}

function vendorCoversGeo(
  vendor: BuyerMatchVendor,
  requestLocationSlug: string,
  nodes: readonly GeoNode[],
): boolean {
  if (!requestLocationSlug) {
    return true;
  }
  return vendor.coverageSlugs.some((slug) =>
    coversLocation(slug, requestLocationSlug, nodes),
  );
}

function isAvailableOnDate(
  service: BuyerMatchVendor['services'][number],
  startDate: string,
): boolean {
  if (!startDate) {
    return true;
  }
  return !(service.blackoutDates ?? []).includes(startDate);
}

export function matchBuyerRequest(options: {
  draft: Pick<
    BuyerRequestDraft,
    'categorySlug' | 'typeSlug' | 'items' | 'locationSlug' | 'startDate'
  >;
  vendors: readonly BuyerMatchVendor[];
  nodes: readonly GeoNode[];
  minVendors?: number;
}): MatchBuyerRequestResult {
  const minVendors = options.minVendors ?? MIN_TYPICAL_PRICE_VENDORS;
  const matches: MatchedVendorQuote[] = [];
  const coveringVendorIds = new Set<string>();
  const unmetDemand: UnmetDemandLog[] = [];

  for (const item of options.draft.items) {
    const itemMatches: MatchedVendorQuote[] = [];

    for (const vendor of options.vendors) {
      if (!vendorCoversType(vendor, options.draft.typeSlug)) {
        continue;
      }
      if (!vendorCoversGeo(vendor, options.draft.locationSlug, options.nodes)) {
        continue;
      }
      const service = vendor.services.find((row) => row.serviceSlug === item.serviceSlug);
      if (!service) {
        continue;
      }
      if (!isAvailableOnDate(service, options.draft.startDate)) {
        continue;
      }

      const quote = computeQuote(
        {
          service: service.definition,
          rates: service.rates,
        },
        { serviceSlug: item.serviceSlug, quantity: item.quantity },
      );

      coveringVendorIds.add(vendor.vendorId);
      itemMatches.push({
        vendorId: vendor.vendorId,
        alias: vendor.alias,
        verified: vendor.verified,
        rating: vendor.rating,
        serviceSlug: item.serviceSlug,
        quote,
        instantQuote: quote.instantQuote,
      });
    }

    matches.push(...itemMatches);

    if (itemMatches.length < minVendors) {
      unmetDemand.push(
        logUnmetDemand({
          categorySlug: options.draft.categorySlug,
          typeSlug: options.draft.typeSlug,
          serviceSlug: item.serviceSlug,
          locationSlug: options.draft.locationSlug,
          matchedCount: itemMatches.length,
          requiredCount: minVendors,
        }),
      );
    }
  }

  const priced = matches.filter((row) => row.quote.amountMinor > 0);
  const amounts = priced.map((row) => row.quote.amountMinor);
  const vendorCount = coveringVendorIds.size;
  const showEstimate = vendorCount >= minVendors && amounts.length > 0;

  return {
    matches,
    vendorsCovering: vendorCount,
    typicalPrice: {
      vendorCount,
      minMinor: amounts.length ? Math.min(...amounts) : 0,
      maxMinor: amounts.length ? Math.max(...amounts) : 0,
      currency: 'NGN',
      showEstimate,
    },
    unmetDemand,
  };
}

const UNMET_STORAGE_KEY = 'askalert.unmet-demand.v1';

export function logUnmetDemand(input: {
  categorySlug: string;
  typeSlug: string;
  serviceSlug: string;
  locationSlug: string;
  matchedCount: number;
  requiredCount: number;
}): UnmetDemandLog {
  const entry: UnmetDemandLog = {
    id: `unmet_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    categorySlug: input.categorySlug,
    typeSlug: input.typeSlug,
    serviceSlug: input.serviceSlug,
    locationSlug: input.locationSlug,
    matchedCount: input.matchedCount,
    requiredCount: input.requiredCount,
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const raw = window.sessionStorage.getItem(UNMET_STORAGE_KEY);
      const list = raw ? (JSON.parse(raw) as UnmetDemandLog[]) : [];
      list.push(entry);
      window.sessionStorage.setItem(UNMET_STORAGE_KEY, JSON.stringify(list.slice(-100)));
    } catch {
      // Ignore storage failures.
    }
  }

  return entry;
}

export function readUnmetDemandLogs(): UnmetDemandLog[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.sessionStorage.getItem(UNMET_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UnmetDemandLog[]) : [];
  } catch {
    return [];
  }
}

/** Demo supply for typical-price preview until live vendor directory is wired. */
export function buildDemoMatchVendors(options: {
  categorySlug: string;
  typeSlug: string;
  items: BuyerRequestItem[];
  services: ServiceDefinition[];
  locationSlug: string;
}): BuyerMatchVendor[] {
  const selected = options.services.filter((service) =>
    options.items.some((item) => item.serviceSlug === service.slug),
  );
  if (selected.length === 0) {
    return [];
  }

  const coverage = options.locationSlug
    ? [options.locationSlug, 'lekki-phase-1', 'lekki', 'victoria-island', 'lagos-all']
    : ['lekki-phase-1', 'lekki', 'victoria-island', 'lagos-all'];

  const aliases = ['Lekki Host A', 'Island Caterer B', 'Verified Pro C', 'Ajah Vendor D'];

  return aliases.slice(0, 4).map((alias, index) => ({
    vendorId: `demo_vendor_${options.categorySlug}_${index + 1}`,
    alias,
    verified: index < 3,
    rating: 4.2 + index * 0.2,
    coverageSlugs: coverage,
    typeSlugs: [options.typeSlug, 'all'],
    services: selected.map((service) => ({
      serviceSlug: service.slug,
      definition: {
        slug: service.slug,
        pricing_model: service.pricing_model,
        dimension: service.dimension,
        min_value: service.min_value,
        max_value: service.max_value,
        packages: service.packages,
      },
      rates:
        service.default_bands.length > 0
          ? service.default_bands.map((band) => ({
              dimMin: band.dimMin,
              dimMax: band.dimMax,
              basis: band.basis,
              priceMinor: Math.round(band.priceMinor * (1 + index * 0.08)),
              currency: 'NGN' as const,
            }))
          : service.pricing_model === 'quote_only'
            ? []
            : [
                {
                  dimMin: service.min_value ?? 1,
                  dimMax: service.max_value ?? 100,
                  basis: 'per_unit' as const,
                  priceMinor: 15_000_00 + index * 2_000_00,
                  currency: 'NGN' as const,
                },
              ],
    })),
  }));
}

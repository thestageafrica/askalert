/**
 * Parse vendor replies such as "6k per head" into rate-card friendly numbers (kobo).
 */
export type ParsedVendorQuote = {
  amountMinor: number | null;
  basis: 'per_unit' | 'total' | 'unknown';
  raw: string;
  ok: boolean;
};

export function parseVendorQuoteReply(text: string): ParsedVendorQuote {
  const raw = text.trim();
  const lower = raw.toLowerCase();

  const perHead =
    lower.match(
      /(\d+(?:[.,]\d+)?)\s*(k|m)?\s*(?:naira|₦)?\s*(?:per\s*(?:head|guest|person|pax)|\/\s*(?:head|guest))/i,
    ) ?? lower.match(/(\d+(?:[.,]\d+)?)\s*(k)\s*per/i);

  if (perHead) {
    const amount = toNaira(perHead[1]!, perHead[2]);
    return {
      amountMinor: amount == null ? null : Math.round(amount * 100),
      basis: 'per_unit',
      raw,
      ok: amount != null,
    };
  }

  const total = lower.match(
    /(?:total|flat|for\s+all)?\s*₦?\s*(\d+(?:[.,]\d+)?)\s*(k|m)?\b/i,
  );
  if (total) {
    const amount = toNaira(total[1]!, total[2]);
    return {
      amountMinor: amount == null ? null : Math.round(amount * 100),
      basis: /per\s*(head|guest|person)/i.test(lower) ? 'per_unit' : 'total',
      raw,
      ok: amount != null,
    };
  }

  return { amountMinor: null, basis: 'unknown', raw, ok: false };
}

function toNaira(value: string, unit?: string): number | null {
  const n = Number(value.replace(/,/g, ''));
  if (!Number.isFinite(n)) {
    return null;
  }
  const u = (unit ?? '').toLowerCase();
  if (u === 'm') {
    return n * 1_000_000;
  }
  if (u === 'k') {
    return n * 1_000;
  }
  return n;
}

export function mapQuoteToBandPatch(parsed: ParsedVendorQuote): {
  priceMinor: number;
  basis: 'per_unit' | 'total';
} | null {
  if (!parsed.ok || parsed.amountMinor == null || parsed.basis === 'unknown') {
    return null;
  }
  return {
    priceMinor: parsed.amountMinor,
    basis: parsed.basis,
  };
}

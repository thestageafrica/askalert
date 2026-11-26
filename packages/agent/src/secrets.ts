import type { BuyerSecrets, PublicBuyerBrief } from './types';

const SECRET_PATTERNS: RegExp[] = [
  /\bceiling\b/i,
  /\bmax(?:imum)?\s*(?:budget|price|₦|naira)/i,
  /\bbudget\s*(?:is|of|:)?\s*₦?\s*\d/i,
  /\b\d{10,14}\b/, // phone-like
  /\b[\w.+-]+@[\w.-]+\.\w+\b/i,
];

export function buildPublicBudgetHint(
  minMinor: number | null | undefined,
  maxMinor: number | null | undefined,
): string | null {
  if (minMinor == null && maxMinor == null) {
    return null;
  }
  // Soft band only — never expose the exact ceiling as “maximum”.
  if (minMinor != null && maxMinor != null) {
    const softMax = Math.round(maxMinor * 0.9);
    return `Around ₦${formatNaira(minMinor)} to ₦${formatNaira(softMax)}`;
  }
  if (minMinor != null) {
    return `From about ₦${formatNaira(minMinor)}`;
  }
  if (maxMinor != null) {
    const softMax = Math.round(maxMinor * 0.9);
    return `Around ₦${formatNaira(softMax)}`;
  }
  return null;
}

function formatNaira(minor: number): string {
  return new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(minor / 100);
}

export function toPublicBrief(input: {
  categorySlug: string;
  areaSlug: string | null;
  summary: string;
  neededBy: string | null;
  secrets: BuyerSecrets;
}): PublicBuyerBrief {
  return {
    categorySlug: input.categorySlug,
    areaSlug: input.areaSlug,
    summary: input.summary,
    neededBy: input.neededBy,
    publicBudgetHint: buildPublicBudgetHint(
      input.secrets.budgetMinMinor,
      input.secrets.budgetMaxMinor,
    ),
  };
}

/** True if text looks like it would leak a secret or was asked to reveal one. */
export function looksLikeSecretLeak(text: string, secrets: BuyerSecrets): boolean {
  if (secrets.budgetMaxMinor != null) {
    const naira = Math.round(secrets.budgetMaxMinor / 100).toString();
    if (text.includes(naira) && /budget|max|ceiling|pay up to|₦/i.test(text)) {
      return true;
    }
  }
  if (secrets.phone && text.includes(secrets.phone)) {
    return true;
  }
  if (secrets.exactAddress && text.toLowerCase().includes(secrets.exactAddress.toLowerCase())) {
    return true;
  }
  return SECRET_PATTERNS.some((pattern) => pattern.test(text) && /ignore|reveal|tell me|budget/i.test(text));
}

export function stripSecretsFromVendorPrompt(
  draft: string,
  secrets: BuyerSecrets,
): { text: string; scrubbed: boolean } {
  let text = draft;
  let scrubbed = false;
  if (secrets.budgetMaxMinor != null) {
    const naira = Math.round(secrets.budgetMaxMinor / 100).toString();
    if (text.includes(naira)) {
      text = text.split(naira).join('[redacted]');
      scrubbed = true;
    }
  }
  if (secrets.phone && text.includes(secrets.phone)) {
    text = text.split(secrets.phone).join('[redacted]');
    scrubbed = true;
  }
  if (secrets.exactAddress) {
    const address = secrets.exactAddress;
    if (text.toLowerCase().includes(address.toLowerCase())) {
      const re = new RegExp(escapeRegExp(address), 'ig');
      text = text.replace(re, '[redacted]');
      scrubbed = true;
    }
  }
  return { text, scrubbed };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

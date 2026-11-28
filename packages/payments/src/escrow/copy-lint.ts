import {
  COMING_SOON_COPY,
  canUseEscrowWording,
  type EscrowRuntimeConfig,
} from './config';

/** Phrases that claim funds are held / protected / released as safekeeping. */
export const ESCROW_BANNED_PATTERNS: RegExp[] = [
  /\bescrow\b/i,
  /\bheld funds?\b/i,
  /\bprotected funds?\b/i,
  /\brelease funds?\b/i,
  /\bsafekeeping\b/i,
  /\baskalert holds\b/i,
  /\bprotected by askalert\b/i,
  /\bhold(?:s|ing)? (?:your |customer )?money\b/i,
  /\bkeep(?:s|ing)? your money safe\b/i,
  /\bhold payment\b/i,
  /\bprotect(?:ed|ing)? (?:your )?payment(?!s are coming soon)\b/i,
];

/** Neutral operational wording that is allowed even while the flag is off. */
const SAFE_LINE_PATTERNS: RegExp[] = [
  new RegExp(`^${COMING_SOON_COPY}$`, 'i'),
  /\bstaged payout\b/i,
  /\bfull payout now\b/i,
  /\blater release\b/i,
  /\bpay now\b/i,
  /\bconfirm later\b/i,
  /\bsandbox\b/i,
  /\breleased to vendor when funding is confirmed\b/i,
  /\breleased after buyer confirmation or auto-release\b/i,
  /\bis released after you confirm the job\b/i,
];

export type CopyLintHit = {
  pattern: string;
  excerpt: string;
};

export type CopyLintResult = {
  ok: boolean;
  hits: CopyLintHit[];
};

function lineIsSafe(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) {
    return true;
  }
  if (SAFE_LINE_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    // Still block hard claims that slip into an otherwise-safe line.
    if (/\bescrow\b/i.test(trimmed) && !/\bsandbox|mock|provider|adapter|interface\b/i.test(trimmed)) {
      return false;
    }
    if (/\baskalert holds\b|\bprotected by askalert\b|\bheld funds?\b|\bprotected funds?\b/i.test(trimmed)) {
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Lint user-facing copy. When escrow wording is not live-approved, banned terms fail.
 */
export function lintEscrowCopy(
  text: string,
  config: EscrowRuntimeConfig,
): CopyLintResult {
  if (canUseEscrowWording(config)) {
    return { ok: true, hits: [] };
  }

  const hits: CopyLintHit[] = [];

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || lineIsSafe(trimmed)) {
      continue;
    }
    for (const pattern of ESCROW_BANNED_PATTERNS) {
      if (pattern.test(trimmed)) {
        hits.push({
          pattern: pattern.source,
          excerpt: trimmed.slice(0, 160),
        });
      }
    }
  }

  return { ok: hits.length === 0, hits };
}

/** Throws when banned escrow wording appears while the feature is not live-approved. */
export function assertEscrowCopyAllowed(text: string, config: EscrowRuntimeConfig): void {
  const result = lintEscrowCopy(text, config);
  if (!result.ok) {
    const detail = result.hits
      .map((hit) => `[${hit.pattern}] ${hit.excerpt}`)
      .join('; ');
    throw new Error(
      `Escrow copy lint failed while escrow wording is not allowed. ${detail}`,
    );
  }
}

const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all |your |the )?(previous |prior )?(rules|instructions|guardrails)/i,
  /disregard (your|the) (system|rules|instructions)/i,
  /forget (your|the) (instructions|rules|guardrails)/i,
  /reveal .{0,40}(budget|ceiling|max(imum)?\s*price|phone|address)/i,
  /tell me .{0,40}(budget|ceiling|max)/i,
  /what is (the )?(customer|buyer)'?s? (max|budget|ceiling)/i,
  /system:\s*reveal/i,
  /exfiltrat/i,
  /jailbreak/i,
  /do not follow askalert/i,
];

export type GuardrailCheck = {
  blocked: boolean;
  reason: string | null;
  safeReply: string | null;
};

export function checkVendorInjection(vendorText: string): GuardrailCheck {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(vendorText)) {
      return {
        blocked: true,
        reason: 'vendor_prompt_injection',
        safeReply:
          'I can’t share private buyer details or change my rules. I can keep helping with quotes for this job.',
      };
    }
  }
  return { blocked: false, reason: null, safeReply: null };
}

export function checkOutboundLeak(text: string, forbiddenAmounts: number[]): GuardrailCheck {
  for (const amountMinor of forbiddenAmounts) {
    if (amountMinor <= 0) continue;
    const naira = Math.round(amountMinor / 100).toString();
    if (text.includes(naira) && /budget|max|ceiling|up to|₦/i.test(text)) {
      return {
        blocked: true,
        reason: 'secret_budget_leak',
        safeReply: 'I almost shared a private limit. I rewrote that without the buyer’s ceiling.',
      };
    }
  }
  return { blocked: false, reason: null, safeReply: null };
}

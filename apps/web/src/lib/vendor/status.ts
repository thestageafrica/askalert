import type { VendorStatus, VerificationTier } from './types';

const TRANSITIONS: Record<VendorStatus, VendorStatus[]> = {
  draft: ['pending_review'],
  pending_review: ['approved', 'rejected'],
  approved: ['suspended'],
  rejected: ['draft', 'pending_review'],
  suspended: ['approved', 'rejected'],
};

export function canTransitionVendorStatus(from: VendorStatus, to: VendorStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function transitionVendorStatus(
  from: VendorStatus,
  to: VendorStatus,
): { ok: true; status: VendorStatus } | { ok: false; error: string } {
  if (!canTransitionVendorStatus(from, to)) {
    return { ok: false, error: `Cannot move from ${from} to ${to}.` };
  }
  return { ok: true, status: to };
}

export function submitForReview(
  status: VendorStatus,
): { ok: true; status: VendorStatus } | { ok: false; error: string } {
  if (status !== 'draft' && status !== 'rejected') {
    return { ok: false, error: 'Only draft or rejected profiles can be submitted.' };
  }
  return transitionVendorStatus(status === 'rejected' ? 'rejected' : 'draft', 'pending_review');
}

/** Phone is always first; higher tiers stack. */
export function unlockVerificationTier(
  current: VerificationTier[],
  next: VerificationTier,
): VerificationTier[] {
  const order: VerificationTier[] = ['phone', 'id', 'business', 'trusted'];
  const nextIndex = order.indexOf(next);
  const required = order.slice(0, nextIndex + 1);
  return Array.from(new Set([...current, ...required]));
}

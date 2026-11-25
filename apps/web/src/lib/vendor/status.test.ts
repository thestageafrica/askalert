import { describe, expect, it } from 'vitest';
import {
  canTransitionVendorStatus,
  submitForReview,
  transitionVendorStatus,
  unlockVerificationTier,
} from './status';

describe('vendor status transitions', () => {
  it('allows draft to pending_review via submit', () => {
    expect(submitForReview('draft')).toEqual({ ok: true, status: 'pending_review' });
  });

  it('blocks invalid transitions', () => {
    expect(canTransitionVendorStatus('draft', 'approved')).toBe(false);
    expect(transitionVendorStatus('approved', 'draft').ok).toBe(false);
  });

  it('allows pending_review to approved or rejected', () => {
    expect(transitionVendorStatus('pending_review', 'approved')).toEqual({
      ok: true,
      status: 'approved',
    });
    expect(transitionVendorStatus('pending_review', 'rejected').ok).toBe(true);
  });

  it('stacks verification tiers', () => {
    expect(unlockVerificationTier(['phone'], 'business')).toEqual([
      'phone',
      'id',
      'business',
    ]);
  });
});

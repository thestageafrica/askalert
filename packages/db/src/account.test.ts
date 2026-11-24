import { describe, expect, it } from 'vitest';
import {
  buildConsentRows,
  canAccessOwnAccountRow,
  canEnterVendorMode,
  hasActiveRole,
  isSelfDeal,
  isSignInRateLimited,
  modeFromPathname,
  requiredConsentsGranted,
  scorePassword,
  vendorModeCta,
} from './account';

describe('account mode and roles', () => {
  it('derives mode from the URL area', () => {
    expect(modeFromPathname('/app/requests/')).toBe('buyer');
    expect(modeFromPathname('/vendor/')).toBe('vendor');
    expect(modeFromPathname('/vendor/onboarding/')).toBe('vendor');
  });

  it('gates vendor mode and CTAs', () => {
    expect(canEnterVendorMode([{ role: 'buyer', status: 'active', verifiedTier: 'none' }])).toBe(
      false,
    );
    expect(
      canEnterVendorMode([{ role: 'vendor', status: 'pending', verifiedTier: 'none' }]),
    ).toBe(true);
    expect(hasActiveRole([{ role: 'buyer', status: 'active', verifiedTier: 'none' }], 'buyer')).toBe(
      true,
    );
    expect(vendorModeCta([{ role: 'buyer', status: 'active', verifiedTier: 'none' }]).kind).toBe(
      'become',
    );
  });

  it('blocks self-dealing', () => {
    expect(isSelfDeal('u1', 'u1')).toBe(true);
    expect(isSelfDeal('u1', 'u2')).toBe(false);
  });
});

describe('consents and passwords', () => {
  it('requires terms and privacy', () => {
    expect(
      requiredConsentsGranted([
        { type: 'terms', granted: true },
        { type: 'privacy', granted: false },
      ]),
    ).toBe(false);
    expect(
      requiredConsentsGranted([
        { type: 'terms', granted: true },
        { type: 'privacy', granted: true },
      ]),
    ).toBe(true);
  });

  it('builds consent rows with versions', () => {
    const rows = buildConsentRows(
      [
        { type: 'terms', granted: true },
        { type: 'marketing', granted: false },
      ],
      new Date('2026-11-24T12:00:00.000Z'),
    );
    expect(rows[0]?.granted_at).toBe('2026-11-24T12:00:00.000Z');
    expect(rows[1]?.granted_at).toBeNull();
  });

  it('scores passwords', () => {
    expect(scorePassword('short').ok).toBe(false);
    expect(scorePassword('LongerPass1').ok).toBe(true);
  });
});

describe('account RLS mirror', () => {
  it('allows only the owner of a live profile', () => {
    expect(canAccessOwnAccountRow('u1', 'u1')).toBe(true);
    expect(canAccessOwnAccountRow('u1', 'u2')).toBe(false);
    expect(canAccessOwnAccountRow('u1', 'u1', '2026-01-01T00:00:00.000Z')).toBe(false);
    expect(canAccessOwnAccountRow(null, 'u1')).toBe(false);
  });

  it('rate-limits sign-in attempts in a window', () => {
    const now = 1_000_000;
    const attempts = Array.from({ length: 8 }, (_, i) => now - i * 1000);
    expect(isSignInRateLimited(attempts, now)).toBe(true);
    expect(isSignInRateLimited(attempts.slice(0, 3), now)).toBe(false);
  });
});

import { z } from 'zod';

export const appModeSchema = z.enum(['buyer', 'vendor']);
export type AppMode = z.infer<typeof appModeSchema>;

export const accountRoleSchema = z.enum([
  'buyer',
  'vendor',
  'admin_super',
  'admin_operations',
  'admin_support',
  'admin_readonly',
]);
export type AccountRole = z.infer<typeof accountRoleSchema>;

export const roleStatusSchema = z.enum(['active', 'pending', 'suspended']);
export type RoleStatus = z.infer<typeof roleStatusSchema>;

export const consentTypeSchema = z.enum([
  'terms',
  'privacy',
  'whatsapp_optin',
  'marketing',
]);
export type ConsentType = z.infer<typeof consentTypeSchema>;

export const CONSENT_VERSIONS = {
  terms: '2026-11-24',
  privacy: '2026-11-24',
  whatsapp_optin: '2026-11-24',
  marketing: '2026-11-24',
} as const;

export type UserRoleRecord = {
  role: AccountRole;
  status: RoleStatus;
  verifiedTier: string;
};

export function modeFromPathname(pathname: string): AppMode {
  if (pathname === '/vendor' || pathname.startsWith('/vendor/')) {
    return 'vendor';
  }
  return 'buyer';
}

export function homePathForMode(mode: AppMode): string {
  return mode === 'vendor' ? '/vendor/' : '/app/';
}

export function hasActiveRole(
  roles: readonly UserRoleRecord[],
  role: AccountRole,
): boolean {
  return roles.some((item) => item.role === role && item.status === 'active');
}

export function canEnterVendorMode(roles: readonly UserRoleRecord[]): boolean {
  return roles.some(
    (item) =>
      item.role === 'vendor' &&
      (item.status === 'active' || item.status === 'pending'),
  );
}

export function vendorModeCta(roles: readonly UserRoleRecord[]): {
  kind: 'enter' | 'become';
  href: string;
  label: string;
} {
  if (canEnterVendorMode(roles)) {
    return { kind: 'enter', href: '/vendor/', label: 'Switch to vendor' };
  }
  return {
    kind: 'become',
    href: '/vendor/onboarding/',
    label: 'Become a vendor',
  };
}

/** Prevent booking, reviewing, or messaging your own vendor identity. */
export function isSelfDeal(viewerUserId: string, vendorUserId: string): boolean {
  return Boolean(viewerUserId) && viewerUserId === vendorUserId;
}

export type ConsentInput = {
  type: ConsentType;
  granted: boolean;
  version?: string;
  source?: string;
};

export function buildConsentRows(
  inputs: readonly ConsentInput[],
  now = new Date(),
): Array<{
  type: ConsentType;
  version: string;
  granted: boolean;
  granted_at: string | null;
  source: string;
}> {
  return inputs.map((input) => ({
    type: input.type,
    version: input.version ?? CONSENT_VERSIONS[input.type],
    granted: input.granted,
    granted_at: input.granted ? now.toISOString() : null,
    source: input.source ?? 'signup',
  }));
}

export function requiredConsentsGranted(inputs: readonly ConsentInput[]): boolean {
  const terms = inputs.find((item) => item.type === 'terms');
  const privacy = inputs.find((item) => item.type === 'privacy');
  return Boolean(terms?.granted && privacy?.granted);
}

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Too weak' | 'Weak' | 'Okay' | 'Strong' | 'Excellent';
  ok: boolean;
  hints: string[];
};

export function scorePassword(password: string): PasswordStrength {
  const hints: string[] = [];
  let score = 0 as PasswordStrength['score'];

  if (password.length >= 8) score = 1;
  else hints.push('Use at least 8 characters.');

  if (password.length >= 12) score = 2;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score = Math.max(score, 2) as PasswordStrength['score'];
  else hints.push('Mix upper and lower case letters.');

  if (/\d/.test(password)) score = Math.max(score, 3) as PasswordStrength['score'];
  else hints.push('Add a number.');

  if (/[^A-Za-z0-9]/.test(password) && password.length >= 12) {
    score = 4;
  } else if (score >= 3 && !/[^A-Za-z0-9]/.test(password)) {
    hints.push('Add a symbol for a stronger password.');
  }

  if (password.length < 8) score = 0;

  const labels: PasswordStrength['label'][] = [
    'Too weak',
    'Weak',
    'Okay',
    'Strong',
    'Excellent',
  ];

  return {
    score,
    label: labels[score]!,
    ok: score >= 2 && password.length >= 8,
    hints: score >= 2 ? hints.slice(0, 1) : hints,
  };
}

/** Simple client-side attempt limiter (Supabase still enforces server-side). */
export function isSignInRateLimited(
  attempts: readonly number[],
  now = Date.now(),
  windowMs = 15 * 60_000,
  maxAttempts = 8,
): boolean {
  const recent = attempts.filter((at) => now - at < windowMs);
  return recent.length >= maxAttempts;
}

export function nextSignInAttempts(
  attempts: readonly number[],
  now = Date.now(),
  windowMs = 15 * 60_000,
): number[] {
  return [...attempts.filter((at) => now - at < windowMs), now];
}

/** Pure policy mirror for account RLS unit tests. */
export function canAccessOwnAccountRow(
  authUserId: string | null,
  rowUserId: string,
  deletedAt: string | null = null,
): boolean {
  if (!authUserId || deletedAt) {
    return false;
  }
  return authUserId === rowUserId;
}

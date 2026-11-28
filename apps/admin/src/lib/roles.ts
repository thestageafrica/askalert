export type { AdminUiRole as AdminRole } from '@askalert/db';
export {
  canApproveVendors,
  canInviteAdmins,
  canManageUsers,
  canReviewVendors,
  canSuspendUsers,
  canViewAuditLog,
} from '@askalert/db';

import type { AdminUiRole } from '@askalert/db';

export const roleLabels: Record<AdminUiRole, string> = {
  super_admin: 'Super admin',
  operations: 'Operations',
  support: 'Support',
  read_only: 'Read-only',
};

export function canEditCategories(role: AdminUiRole): boolean {
  return role === 'super_admin' || role === 'operations';
}

export function canPublishCategories(role: AdminUiRole): boolean {
  return role === 'super_admin';
}

export function canManageSettings(role: AdminUiRole): boolean {
  return role === 'super_admin';
}

export function canEditPlans(role: AdminUiRole): boolean {
  return role === 'super_admin' || role === 'operations';
}

export function canEditUnitCosts(role: AdminUiRole): boolean {
  return role === 'super_admin' || role === 'operations';
}

export function canGrantCredits(role: AdminUiRole): boolean {
  return role === 'super_admin' || role === 'operations';
}

export function canEditPublicPages(role: AdminUiRole): boolean {
  return role === 'super_admin' || role === 'operations';
}

/** Prompt 45: catalog tree editor. */
export function canEditCatalog(role: AdminUiRole): boolean {
  return role === 'super_admin' || role === 'operations';
}

/** Prompt 45: both super_admin and operations may publish catalog. */
export function canPublishCatalog(role: AdminUiRole): boolean {
  return role === 'super_admin' || role === 'operations';
}

/** Prompt 45: geography tree editor. */
export function canEditGeography(role: AdminUiRole): boolean {
  return role === 'super_admin' || role === 'operations';
}

/** Prompt 45: both super_admin and operations may publish geography. */
export function canPublishGeography(role: AdminUiRole): boolean {
  return role === 'super_admin' || role === 'operations';
}

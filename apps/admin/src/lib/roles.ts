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

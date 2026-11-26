import { z } from 'zod';
import type { AccountRole } from './account';

/** UI-facing admin roles (Prompt 27). */
export const adminUiRoleSchema = z.enum([
  'super_admin',
  'operations',
  'support',
  'read_only',
]);
export type AdminUiRole = z.infer<typeof adminUiRoleSchema>;

const UI_TO_DB: Record<AdminUiRole, AccountRole> = {
  super_admin: 'admin_super',
  operations: 'admin_operations',
  support: 'admin_support',
  read_only: 'admin_readonly',
};

const DB_TO_UI: Partial<Record<AccountRole, AdminUiRole>> = {
  admin_super: 'super_admin',
  admin_operations: 'operations',
  admin_support: 'support',
  admin_readonly: 'read_only',
};

export function uiRoleToDb(role: AdminUiRole): AccountRole {
  return UI_TO_DB[role];
}

export function dbRoleToUi(role: AccountRole): AdminUiRole | null {
  return DB_TO_UI[role] ?? null;
}

export function isAdminDbRole(role: AccountRole): boolean {
  return role.startsWith('admin_');
}

/** Highest-privilege admin role wins when multiple are active. */
export function pickPrimaryAdminRole(
  roles: ReadonlyArray<{ role: AccountRole; status: string }>,
): AdminUiRole | null {
  const order: AdminUiRole[] = ['super_admin', 'operations', 'support', 'read_only'];
  const active = new Set(
    roles
      .filter((item) => item.status === 'active')
      .map((item) => dbRoleToUi(item.role))
      .filter((role): role is AdminUiRole => Boolean(role)),
  );
  return order.find((role) => active.has(role)) ?? null;
}

export function canReviewVendors(role: AdminUiRole): boolean {
  return role === 'super_admin' || role === 'operations' || role === 'support';
}

export function canApproveVendors(role: AdminUiRole): boolean {
  return role === 'super_admin' || role === 'operations';
}

export function canManageUsers(role: AdminUiRole): boolean {
  return role === 'super_admin' || role === 'operations';
}

export function canInviteAdmins(role: AdminUiRole): boolean {
  return role === 'super_admin';
}

export function canViewAuditLog(role: AdminUiRole): boolean {
  return (
    role === 'super_admin' ||
    role === 'operations' ||
    role === 'support' ||
    role === 'read_only'
  );
}

export function canSuspendUsers(role: AdminUiRole): boolean {
  return role === 'super_admin' || role === 'operations';
}

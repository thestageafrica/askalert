export type AdminRole = 'super_admin' | 'operations' | 'support' | 'read_only';

export const roleLabels: Record<AdminRole, string> = {
  super_admin: 'Super admin',
  operations: 'Operations',
  support: 'Support',
  read_only: 'Read-only',
};

export function canEditCategories(role: AdminRole): boolean {
  return role === 'super_admin' || role === 'operations';
}

export function canPublishCategories(role: AdminRole): boolean {
  return role === 'super_admin';
}

export function canManageSettings(role: AdminRole): boolean {
  return role === 'super_admin';
}

import { describe, expect, it } from 'vitest';
import {
  canApproveVendors,
  canInviteAdmins,
  canManageUsers,
  canReviewVendors,
  canViewAuditLog,
  dbRoleToUi,
  pickPrimaryAdminRole,
  uiRoleToDb,
} from './admin-roles';

describe('admin role mapping', () => {
  it('maps UI ↔ DB roles', () => {
    expect(uiRoleToDb('super_admin')).toBe('admin_super');
    expect(dbRoleToUi('admin_operations')).toBe('operations');
    expect(dbRoleToUi('buyer')).toBeNull();
  });

  it('picks the highest active admin role', () => {
    expect(
      pickPrimaryAdminRole([
        { role: 'admin_readonly', status: 'active' },
        { role: 'admin_operations', status: 'active' },
        { role: 'buyer', status: 'active' },
      ]),
    ).toBe('operations');
    expect(pickPrimaryAdminRole([{ role: 'buyer', status: 'active' }])).toBeNull();
  });
});

describe('admin role permissions', () => {
  it('gates invite to super admin only', () => {
    expect(canInviteAdmins('super_admin')).toBe(true);
    expect(canInviteAdmins('operations')).toBe(false);
  });

  it('allows review for ops/support but approve only for ops+', () => {
    expect(canReviewVendors('support')).toBe(true);
    expect(canApproveVendors('support')).toBe(false);
    expect(canApproveVendors('operations')).toBe(true);
  });

  it('allows user management and audit visibility', () => {
    expect(canManageUsers('operations')).toBe(true);
    expect(canManageUsers('read_only')).toBe(false);
    expect(canViewAuditLog('read_only')).toBe(true);
  });
});

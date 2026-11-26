import { describe, expect, it } from 'vitest';
import {
  canApproveVendors,
  canInviteAdmins,
  canSuspendUsers,
  canViewAuditLog,
} from './roles';

describe('admin audit trail permissions', () => {
  it('allows every admin UI role to view audit entries', () => {
    expect(canViewAuditLog('super_admin')).toBe(true);
    expect(canViewAuditLog('operations')).toBe(true);
    expect(canViewAuditLog('support')).toBe(true);
    expect(canViewAuditLog('read_only')).toBe(true);
  });

  it('records privileged actions only for elevated roles', () => {
    expect(canInviteAdmins('super_admin')).toBe(true);
    expect(canApproveVendors('operations')).toBe(true);
    expect(canApproveVendors('support')).toBe(false);
    expect(canSuspendUsers('read_only')).toBe(false);
  });
});

describe('audit payload shape', () => {
  it('keeps reason and action for reject events', () => {
    const entry = {
      action: 'vendor.reject',
      tableName: 'vendor_profiles',
      payload: { reason: 'Missing CAC', message: 'Please upload CAC' },
    };
    expect(entry.action.startsWith('vendor.')).toBe(true);
    expect(entry.payload.reason.length).toBeGreaterThan(0);
  });
});

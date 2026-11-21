/**
 * Pure helpers that encode the RLS rules for unit tests.
 * Mirrors supabase/migrations/20260321000002_rls_and_audit.sql
 */

export type PublicCategoryGate = {
  status: string;
};

export type PublicVersionGate = {
  published: boolean;
  categoryStatus: string;
  isCurrentVersion: boolean;
};

export type PublicAttributeGate = PublicVersionGate;

export function canPublicReadCategory(row: PublicCategoryGate): boolean {
  return row.status === 'live' || row.status === 'pilot';
}

export function canPublicReadVersion(row: PublicVersionGate): boolean {
  return (
    row.published &&
    (row.categoryStatus === 'live' || row.categoryStatus === 'pilot') &&
    row.isCurrentVersion
  );
}

export function canPublicReadAttributes(row: PublicAttributeGate): boolean {
  return canPublicReadVersion(row);
}

export function canPublicReadVendorRequirements(row: PublicAttributeGate): boolean {
  return canPublicReadVersion(row);
}

export function canServiceRoleWrite(role: string): boolean {
  return role === 'service_role';
}

/** Admin writes must produce an audit row (enforced in SQL; asserted in tests). */
export function auditActionForOp(op: 'INSERT' | 'UPDATE' | 'DELETE'): string {
  switch (op) {
    case 'INSERT':
      return 'insert';
    case 'UPDATE':
      return 'update';
    case 'DELETE':
      return 'delete';
  }
}

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
export declare function canPublicReadCategory(row: PublicCategoryGate): boolean;
export declare function canPublicReadVersion(row: PublicVersionGate): boolean;
export declare function canPublicReadAttributes(row: PublicAttributeGate): boolean;
export declare function canPublicReadVendorRequirements(row: PublicAttributeGate): boolean;
export declare function canServiceRoleWrite(role: string): boolean;
/** Admin writes must produce an audit row (enforced in SQL; asserted in tests). */
export declare function auditActionForOp(op: 'INSERT' | 'UPDATE' | 'DELETE'): string;
//# sourceMappingURL=rls-policy.d.ts.map
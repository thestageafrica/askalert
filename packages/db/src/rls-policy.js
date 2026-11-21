/**
 * Pure helpers that encode the RLS rules for unit tests.
 * Mirrors supabase/migrations/20260321000002_rls_and_audit.sql
 */
export function canPublicReadCategory(row) {
    return row.status === 'live' || row.status === 'pilot';
}
export function canPublicReadVersion(row) {
    return (row.published &&
        (row.categoryStatus === 'live' || row.categoryStatus === 'pilot') &&
        row.isCurrentVersion);
}
export function canPublicReadAttributes(row) {
    return canPublicReadVersion(row);
}
export function canPublicReadVendorRequirements(row) {
    return canPublicReadVersion(row);
}
export function canServiceRoleWrite(role) {
    return role === 'service_role';
}
/** Admin writes must produce an audit row (enforced in SQL; asserted in tests). */
export function auditActionForOp(op) {
    switch (op) {
        case 'INSERT':
            return 'insert';
        case 'UPDATE':
            return 'update';
        case 'DELETE':
            return 'delete';
    }
}
//# sourceMappingURL=rls-policy.js.map
export type { AskAlertSupabase } from './client';
export {
  createAuthBrowserClient,
  createBrowserClient,
  createServerClient,
  tryCreateAuthBrowserClient,
  tryCreateBrowserClient,
} from './client';
export {
  CONSENT_VERSIONS,
  appModeSchema,
  accountRoleSchema,
  buildConsentRows,
  canAccessOwnAccountRow,
  canEnterVendorMode,
  consentTypeSchema,
  hasActiveRole,
  homePathForMode,
  isSelfDeal,
  isSignInRateLimited,
  modeFromPathname,
  nextSignInAttempts,
  requiredConsentsGranted,
  roleStatusSchema,
  scorePassword,
  vendorModeCta,
  type AccountRole,
  type AppMode,
  type ConsentInput,
  type ConsentType,
  type PasswordStrength,
  type RoleStatus,
  type UserRoleRecord,
} from './account';
export {
  getPublicCategoryBySlug,
  listAreas,
  listManagedCategories,
  listPublicCategories,
  publishCategoryVersion,
  type CategoryWithConfig,
  type PublishInput,
  type PublishResult,
} from './categories';
export { ensureCategoryId, resolveCategoryId } from './resolve-category-id';
export { isSupabaseEnabled, requireSupabaseEnv } from './feature-flag';
export { publicSupabaseEnv } from './public-env';
export {
  assertSharedSecret,
  buildJobPayload,
  collectEventIds,
  ingestEnvelopeSchema,
  timingSafeEqualString,
  type IngestEnvelope,
  type WebhookSource,
} from './webhook-ingest';
export { getLatestDbSizeSnapshot, type DbSizeSnapshot } from './db-metrics';
export {
  auditActionForOp,
  canPublicReadAttributes,
  canPublicReadCategory,
  canPublicReadVendorRequirements,
  canPublicReadVersion,
  canServiceRoleWrite,
} from './rls-policy';
export type {
  AppliesTo,
  AreaRow,
  AttributeType,
  CategoryAttributeRow,
  CategoryRow,
  CategoryStatus,
  CategoryVersionRow,
  Database,
  Json,
} from './types';

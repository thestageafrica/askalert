import { type CategoryConfig, type CategoryStatus } from '@askalert/category-engine';
import type { AskAlertSupabase } from './client';
import { type EnvLike } from './feature-flag';
import type { CategoryAttributeRow, CategoryRow } from './types';
export type CategoryWithConfig = CategoryRow & {
    config: CategoryConfig;
    attributes: CategoryAttributeRow[];
};
/** Public web: Live categories from Supabase, or mock seeds when the flag is off. */
export declare function listPublicCategories(client: AskAlertSupabase | null, env?: EnvLike): Promise<CategoryConfig[]>;
export declare function getPublicCategoryBySlug(slug: string, client: AskAlertSupabase | null, env?: EnvLike): Promise<CategoryConfig | undefined>;
export type PublishInput = {
    categoryId: string;
    config: CategoryConfig;
    note: string;
    nextStatus?: CategoryStatus;
    actor?: string;
};
export type PublishResult = {
    ok: true;
    versionId: string;
    versionNumber: number;
} | {
    ok: false;
    errors: string[];
};
/**
 * Admin publish flow (service-role client).
 * Validates config, inserts a new version + attributes + requirements,
 * and points the category at the new version.
 */
export declare function publishCategoryVersion(client: AskAlertSupabase, input: PublishInput): Promise<PublishResult>;
/** Admin list (service role): all categories with current config. */
export declare function listManagedCategories(client: AskAlertSupabase): Promise<CategoryWithConfig[]>;
export declare function listAreas(client: AskAlertSupabase): Promise<never[]>;
//# sourceMappingURL=categories.d.ts.map
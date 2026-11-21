import {
  createBrowserClient,
  getPublicCategoryBySlug,
  isSupabaseEnabled,
  listPublicCategories,
} from '@askalert/db';
import type { CategoryConfig } from '@askalert/category-engine';

/**
 * Resolves categories for the web app.
 * USE_SUPABASE=true loads Live rows from Supabase; otherwise mock seeds.
 */
export async function loadPublicCategories(): Promise<CategoryConfig[]> {
  if (!isSupabaseEnabled()) {
    return listPublicCategories(null);
  }
  const client = createBrowserClient();
  return listPublicCategories(client);
}

export async function loadPublicCategoryBySlug(
  slug: string,
): Promise<CategoryConfig | undefined> {
  if (!isSupabaseEnabled()) {
    return getPublicCategoryBySlug(slug, null);
  }
  const client = createBrowserClient();
  return getPublicCategoryBySlug(slug, client);
}

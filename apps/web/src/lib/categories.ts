import {
  getPublicCategoryBySlug,
  listPublicCategories,
} from '@askalert/db';
import type { CategoryConfig } from '@askalert/category-engine';
import { webBrowserClient, webSupabaseEnabled, webSupabaseEnv } from './supabase-browser';

/**
 * Resolves categories for the web app.
 * USE_SUPABASE=true loads Live rows from Supabase; otherwise mock seeds.
 */
export async function loadPublicCategories(): Promise<CategoryConfig[]> {
  if (!webSupabaseEnabled()) {
    return listPublicCategories(null, webSupabaseEnv());
  }
  const client = webBrowserClient();
  if (!client) {
    return listPublicCategories(null, webSupabaseEnv());
  }
  return listPublicCategories(client, webSupabaseEnv());
}

export async function loadPublicCategoryBySlug(
  slug: string,
): Promise<CategoryConfig | undefined> {
  if (!webSupabaseEnabled()) {
    return getPublicCategoryBySlug(slug, null, webSupabaseEnv());
  }
  const client = webBrowserClient();
  if (!client) {
    return getPublicCategoryBySlug(slug, null, webSupabaseEnv());
  }
  return getPublicCategoryBySlug(slug, client, webSupabaseEnv());
}

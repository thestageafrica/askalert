import type { CategoryConfig } from '@askalert/category-engine';
import type { AskAlertSupabase } from './client';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Accept a category UUID or slug and return the row UUID. */
export async function resolveCategoryId(
  client: AskAlertSupabase,
  idOrSlug: string,
): Promise<string | null> {
  if (idOrSlug === 'new' || !idOrSlug.trim()) {
    return null;
  }

  if (UUID_RE.test(idOrSlug)) {
    const { data, error } = await client
      .from('categories')
      .select('id')
      .eq('id', idOrSlug)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to resolve category id: ${error.message}`);
    }
    return data?.id ?? null;
  }

  const { data, error } = await client
    .from('categories')
    .select('id')
    .eq('slug', idOrSlug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve category slug: ${error.message}`);
  }
  return data?.id ?? null;
}

/**
 * Resolve by UUID/slug, or insert a new categories row for a first-time publish.
 * Used when Create blank uses the local id "new".
 */
export async function ensureCategoryId(
  client: AskAlertSupabase,
  options: {
    idOrSlug: string;
    config: CategoryConfig;
  },
): Promise<string> {
  const byId = await resolveCategoryId(client, options.idOrSlug);
  if (byId) {
    return byId;
  }

  const bySlug = await resolveCategoryId(client, options.config.slug);
  if (bySlug) {
    return bySlug;
  }

  const { data, error } = await client
    .from('categories')
    .insert({
      slug: options.config.slug,
      name: options.config.name,
      icon: options.config.icon,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create category row.');
  }
  return data.id;
}

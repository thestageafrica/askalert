import type { AskAlertSupabase } from './client';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Accept a category UUID or slug and return the row UUID. */
export async function resolveCategoryId(
  client: AskAlertSupabase,
  idOrSlug: string,
): Promise<string | null> {
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

export type EnvLike = Record<string, string | undefined>;

/**
 * Feature flag for Supabase-backed category data.
 * When false (default), apps keep using category-engine mock seeds.
 */
export function isSupabaseEnabled(env: EnvLike = process.env as EnvLike): boolean {
  const flag = (env.USE_SUPABASE ?? env.NEXT_PUBLIC_USE_SUPABASE ?? '').toLowerCase();
  if (flag !== 'true' && flag !== '1') {
    return false;
  }

  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY;
  return Boolean(url && anon);
}

export function requireSupabaseEnv(
  env: EnvLike = process.env as EnvLike,
): { url: string; anonKey: string; serviceRoleKey?: string } {
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is enabled but NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing.',
    );
  }

  return { url, anonKey, serviceRoleKey };
}

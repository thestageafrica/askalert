import type { EnvLike } from './feature-flag';

/**
 * Build the public Supabase env bag for browser code.
 *
 * IMPORTANT: call sites in Next apps must pass values read as
 * `process.env.NEXT_PUBLIC_*` (literal member access) so static export inlines them.
 * Do not rely on `process.env` inside this package for browser builds.
 */
export function publicSupabaseEnv(parts: {
  useSupabase?: string;
  url?: string;
  anonKey?: string;
}): EnvLike {
  return {
    USE_SUPABASE: parts.useSupabase,
    NEXT_PUBLIC_USE_SUPABASE: parts.useSupabase,
    NEXT_PUBLIC_SUPABASE_URL: parts.url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: parts.anonKey,
  };
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseEnabled, requireSupabaseEnv, type EnvLike } from './feature-flag';
import type { Database } from './types';

export type AskAlertSupabase = SupabaseClient<Database>;

/**
 * Browser client. Prefer passing an env object whose keys are read as
 * `process.env.NEXT_PUBLIC_*` in the app, so Next can inline them for static export.
 */
export function createBrowserClient(env: EnvLike = process.env as EnvLike): AskAlertSupabase {
  const { url, anonKey } = requireSupabaseEnv(env);
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Same as createBrowserClient, but returns null instead of throwing when
 * the flag is off or public env is incomplete. Use this from React effects.
 */
export function tryCreateBrowserClient(
  env: EnvLike = process.env as EnvLike,
): AskAlertSupabase | null {
  if (!isSupabaseEnabled(env)) {
    return null;
  }
  try {
    return createBrowserClient(env);
  } catch {
    return null;
  }
}

/** Server-only client. Prefer the service role for admin writes. */
export function createServerClient(
  env: EnvLike = process.env as EnvLike,
  options: { useServiceRole?: boolean } = {},
): AskAlertSupabase {
  const { url, anonKey, serviceRoleKey } = requireSupabaseEnv(env);
  const key =
    options.useServiceRole && serviceRoleKey ? serviceRoleKey : anonKey;

  if (options.useServiceRole && !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin writes.');
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireSupabaseEnv, type EnvLike } from './feature-flag';
import type { Database } from './types';

export type AskAlertSupabase = SupabaseClient<Database>;

export function createBrowserClient(env: EnvLike = process.env as EnvLike): AskAlertSupabase {
  const { url, anonKey } = requireSupabaseEnv(env);
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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

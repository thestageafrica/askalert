import {
  isSupabaseEnabled,
  publicSupabaseEnv,
  tryCreateBrowserClient,
  type AskAlertSupabase,
} from '@askalert/db';

/**
 * Literal `process.env.NEXT_PUBLIC_*` reads so Next static export inlines them.
 */
export function adminSupabaseEnv() {
  return publicSupabaseEnv({
    useSupabase: process.env.NEXT_PUBLIC_USE_SUPABASE,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function adminSupabaseEnabled(): boolean {
  return isSupabaseEnabled(adminSupabaseEnv());
}

export function adminBrowserClient(): AskAlertSupabase | null {
  return tryCreateBrowserClient(adminSupabaseEnv());
}

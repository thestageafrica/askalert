import {
  isSupabaseEnabled,
  publicSupabaseEnv,
  tryCreateBrowserClient,
  type AskAlertSupabase,
} from '@askalert/db';

/**
 * Literal `process.env.NEXT_PUBLIC_*` reads so Next static export inlines them.
 */
export function webSupabaseEnv() {
  return publicSupabaseEnv({
    useSupabase: process.env.NEXT_PUBLIC_USE_SUPABASE,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function webSupabaseEnabled(): boolean {
  return isSupabaseEnabled(webSupabaseEnv());
}

export function webBrowserClient(): AskAlertSupabase | null {
  return tryCreateBrowserClient(webSupabaseEnv());
}

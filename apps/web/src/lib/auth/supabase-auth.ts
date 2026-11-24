import {
  tryCreateAuthBrowserClient,
  type AskAlertSupabase,
} from '@askalert/db';
import { webSupabaseEnv } from '../supabase-browser';

let cached: AskAlertSupabase | null | undefined;

export function authClient(): AskAlertSupabase | null {
  if (cached !== undefined) {
    return cached;
  }
  cached = tryCreateAuthBrowserClient(webSupabaseEnv());
  return cached;
}

export function authRedirectTo(path = '/auth/callback/'): string {
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

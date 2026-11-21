import { type SupabaseClient } from '@supabase/supabase-js';
import { type EnvLike } from './feature-flag';
import type { Database } from './types';
export type AskAlertSupabase = SupabaseClient<Database>;
export declare function createBrowserClient(env?: EnvLike): AskAlertSupabase;
/** Server-only client. Prefer the service role for admin writes. */
export declare function createServerClient(env?: EnvLike, options?: {
    useServiceRole?: boolean;
}): AskAlertSupabase;
//# sourceMappingURL=client.d.ts.map
import { createClient } from '@supabase/supabase-js';
import { requireSupabaseEnv } from './feature-flag';
export function createBrowserClient(env = process.env) {
    const { url, anonKey } = requireSupabaseEnv(env);
    return createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}
/** Server-only client. Prefer the service role for admin writes. */
export function createServerClient(env = process.env, options = {}) {
    const { url, anonKey, serviceRoleKey } = requireSupabaseEnv(env);
    const key = options.useServiceRole && serviceRoleKey ? serviceRoleKey : anonKey;
    if (options.useServiceRole && !serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin writes.');
    }
    return createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}
//# sourceMappingURL=client.js.map
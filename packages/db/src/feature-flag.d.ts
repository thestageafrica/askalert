export type EnvLike = Record<string, string | undefined>;
/**
 * Feature flag for Supabase-backed category data.
 * When false (default), apps keep using category-engine mock seeds.
 */
export declare function isSupabaseEnabled(env?: EnvLike): boolean;
export declare function requireSupabaseEnv(env?: EnvLike): {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
};
//# sourceMappingURL=feature-flag.d.ts.map
/** Hand-written Database types matching supabase/migrations. */
export type CategoryStatus = 'draft' | 'pilot' | 'live' | 'paused';
export type AttributeType = 'text' | 'number' | 'money' | 'date' | 'select' | 'multi' | 'area' | 'boolean';
export type AppliesTo = 'need' | 'offer' | 'both';
export type Json = string | number | boolean | null | {
    [key: string]: Json | undefined;
} | Json[];
export type Database = {
    public: {
        Tables: {
            areas: {
                Row: {
                    id: string;
                    slug: string;
                    name: string;
                    parent_id: string | null;
                    sort_order: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    slug: string;
                    name: string;
                    parent_id?: string | null;
                    sort_order?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database['public']['Tables']['areas']['Insert']>;
            };
            categories: {
                Row: {
                    id: string;
                    slug: string;
                    name: string;
                    icon: string;
                    status: CategoryStatus;
                    current_version_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    slug: string;
                    name: string;
                    icon: string;
                    status?: CategoryStatus;
                    current_version_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database['public']['Tables']['categories']['Insert']>;
            };
            category_versions: {
                Row: {
                    id: string;
                    category_id: string;
                    version_number: number;
                    note: string;
                    status: CategoryStatus;
                    published: boolean;
                    published_at: string | null;
                    config: Json;
                    created_by: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    category_id: string;
                    version_number: number;
                    note?: string;
                    status: CategoryStatus;
                    published?: boolean;
                    published_at?: string | null;
                    config: Json;
                    created_by?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database['public']['Tables']['category_versions']['Insert']>;
            };
            category_attributes: {
                Row: {
                    id: string;
                    category_version_id: string;
                    key: string;
                    label: string;
                    type: AttributeType;
                    required: boolean;
                    applies_to: AppliesTo;
                    options: Json | null;
                    unit: string | null;
                    validation: Json | null;
                    sort_order: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    category_version_id: string;
                    key: string;
                    label: string;
                    type: AttributeType;
                    required?: boolean;
                    applies_to: AppliesTo;
                    options?: Json | null;
                    unit?: string | null;
                    validation?: Json | null;
                    sort_order?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database['public']['Tables']['category_attributes']['Insert']>;
            };
            category_areas: {
                Row: {
                    id: string;
                    category_id: string;
                    area_id: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    category_id: string;
                    area_id: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database['public']['Tables']['category_areas']['Insert']>;
            };
            vendor_requirements: {
                Row: {
                    id: string;
                    category_version_id: string;
                    requirement: string;
                    sort_order: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    category_version_id: string;
                    requirement: string;
                    sort_order?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database['public']['Tables']['vendor_requirements']['Insert']>;
            };
            audit_log: {
                Row: {
                    id: string;
                    actor: string;
                    action: string;
                    table_name: string;
                    record_id: string | null;
                    payload: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    actor?: string;
                    action: string;
                    table_name: string;
                    record_id?: string | null;
                    payload?: Json;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database['public']['Tables']['audit_log']['Insert']>;
            };
        };
        Views: Record<string, never>;
        Functions: {
            is_service_role: {
                Args: Record<string, never>;
                Returns: boolean;
            };
        };
        Enums: Record<string, never>;
    };
};
export type AreaRow = Database['public']['Tables']['areas']['Row'];
export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type CategoryVersionRow = Database['public']['Tables']['category_versions']['Row'];
export type CategoryAttributeRow = Database['public']['Tables']['category_attributes']['Row'];
//# sourceMappingURL=types.d.ts.map
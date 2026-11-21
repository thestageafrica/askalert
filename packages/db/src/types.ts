/** Hand-written Database types matching supabase/migrations. */

export type CategoryStatus = 'draft' | 'pilot' | 'live' | 'paused';
export type AttributeType =
  | 'text'
  | 'number'
  | 'money'
  | 'date'
  | 'select'
  | 'multi'
  | 'area'
  | 'boolean';
export type AppliesTo = 'need' | 'offer' | 'both';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

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
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          parent_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'areas_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'areas';
            referencedColumns: ['id'];
          },
        ];
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
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          icon?: string;
          status?: CategoryStatus;
          current_version_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_current_version_fk';
            columns: ['current_version_id'];
            isOneToOne: false;
            referencedRelation: 'category_versions';
            referencedColumns: ['id'];
          },
        ];
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
        Update: {
          id?: string;
          category_id?: string;
          version_number?: number;
          note?: string;
          status?: CategoryStatus;
          published?: boolean;
          published_at?: string | null;
          config?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'category_versions_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
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
        Update: {
          id?: string;
          category_version_id?: string;
          key?: string;
          label?: string;
          type?: AttributeType;
          required?: boolean;
          applies_to?: AppliesTo;
          options?: Json | null;
          unit?: string | null;
          validation?: Json | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'category_attributes_category_version_id_fkey';
            columns: ['category_version_id'];
            isOneToOne: false;
            referencedRelation: 'category_versions';
            referencedColumns: ['id'];
          },
        ];
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
        Update: {
          id?: string;
          category_id?: string;
          area_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'category_areas_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'category_areas_area_id_fkey';
            columns: ['area_id'];
            isOneToOne: false;
            referencedRelation: 'areas';
            referencedColumns: ['id'];
          },
        ];
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
        Update: {
          id?: string;
          category_version_id?: string;
          requirement?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vendor_requirements_category_version_id_fkey';
            columns: ['category_version_id'];
            isOneToOne: false;
            referencedRelation: 'category_versions';
            referencedColumns: ['id'];
          },
        ];
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
        Update: {
          id?: string;
          actor?: string;
          action?: string;
          table_name?: string;
          record_id?: string | null;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
    CompositeTypes: Record<string, never>;
  };
};

export type AreaRow = Database['public']['Tables']['areas']['Row'];
export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type CategoryVersionRow = Database['public']['Tables']['category_versions']['Row'];
export type CategoryAttributeRow = Database['public']['Tables']['category_attributes']['Row'];

/** Kept for documentation; Relationships shapes are inlined above. */
export type { Relationship };

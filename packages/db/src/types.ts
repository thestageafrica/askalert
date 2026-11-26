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
      site_pages: {
        Row: {
          slug: string;
          content: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          content: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          content?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
      webhook_events: {
        Row: {
          id: string;
          source: string;
          received_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          source: string;
          received_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source?: string;
          received_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      job_dead_letters: {
        Row: {
          id: string;
          queue_name: string;
          job_id: number | null;
          payload: Json;
          error_code: string;
          attempts: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          queue_name?: string;
          job_id?: number | null;
          payload: Json;
          error_code: string;
          attempts?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          queue_name?: string;
          job_id?: number | null;
          payload?: Json;
          error_code?: string;
          attempts?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          thread_id: string | null;
          sender_role: string;
          channel: string;
          body: string | null;
          body_summary: string | null;
          media: Json | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          thread_id?: string | null;
          sender_role?: string;
          channel?: string;
          body?: string | null;
          body_summary?: string | null;
          media?: Json | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string | null;
          sender_role?: string;
          channel?: string;
          body?: string | null;
          body_summary?: string | null;
          media?: Json | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      db_size_snapshots: {
        Row: {
          id: string;
          size_bytes: number;
          size_mb: number;
          warning: boolean;
          note: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          size_bytes: number;
          size_mb: number;
          warning?: boolean;
          note?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          size_bytes?: number;
          size_mb?: number;
          warning?: boolean;
          note?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      app_runtime_config: {
        Row: {
          key: string;
          value: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          keys: Json;
          device_label: string | null;
          created_at: string;
          last_success_at: string | null;
          failed_count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          keys?: Json;
          device_label?: string | null;
          created_at?: string;
          last_success_at?: string | null;
          failed_count?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          keys?: Json;
          device_label?: string | null;
          created_at?: string;
          last_success_at?: string | null;
          failed_count?: number;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          title: string;
          body: string;
          url: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: string;
          title: string;
          body: string;
          url?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: string;
          title?: string;
          body?: string;
          url?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          channels_by_event: Json;
          quiet_hours: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          channels_by_event?: Json;
          quiet_hours?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          channels_by_event?: Json;
          quiet_hours?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          phone_e164: string | null;
          phone_verified_at: string | null;
          avatar_url: string | null;
          deletion_requested_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          phone_e164?: string | null;
          phone_verified_at?: string | null;
          avatar_url?: string | null;
          deletion_requested_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          phone_e164?: string | null;
          phone_verified_at?: string | null;
          avatar_url?: string | null;
          deletion_requested_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          status: string;
          verified_tier: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          status?: string;
          verified_tier?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          status?: string;
          verified_tier?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          last_mode: string;
          locale: string;
          notification_prefs: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          last_mode?: string;
          locale?: string;
          notification_prefs?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          last_mode?: string;
          locale?: string;
          notification_prefs?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      consents: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          version: string;
          granted: boolean;
          granted_at: string | null;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          version: string;
          granted: boolean;
          granted_at?: string | null;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          version?: string;
          granted?: boolean;
          granted_at?: string | null;
          source?: string;
          created_at?: string;
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
      is_own_vendor_user: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
      assert_not_self_deal: {
        Args: { target_vendor_user_id: string };
        Returns: undefined;
      };
      request_account_deletion: {
        Args: { retention_note?: string };
        Returns: undefined;
      };
      is_phone_taken: {
        Args: { p_phone: string; p_except_user_id?: string | null };
        Returns: boolean;
      };
      enqueue_job: {
        Args: { p_payload: Json };
        Returns: number | null;
      };
      record_db_size: {
        Args: Record<string, never>;
        Returns: Json;
      };
      run_message_retention: {
        Args: Record<string, never>;
        Returns: Json;
      };
      process_askalert_job_batch: {
        Args: { p_batch_size?: number; p_max_attempts?: number };
        Returns: Json;
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

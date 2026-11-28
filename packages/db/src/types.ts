/** Hand-written Database types matching supabase/migrations. */

export type CategoryStatus = 'draft' | 'pilot' | 'live' | 'paused';
export type MissionStatus =
  | 'DRAFT'
  | 'CLARIFYING'
  | 'SEARCHING'
  | 'OUTREACH'
  | 'COLLECTING'
  | 'RANKING'
  | 'AWAITING_USER'
  | 'BOOKED'
  | 'EXPIRED'
  | 'CANCELLED';
export type MissionCandidateStatus =
  | 'selected'
  | 'contacted'
  | 'nudged'
  | 'responded'
  | 'ignored'
  | 'declined';
export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type BookingStatus = 'awaiting_payment' | 'paid' | 'cancelled' | 'completed';
export type RequestStatus = 'draft' | 'active' | 'closed' | 'cancelled';
export type CatalogEntityStatus = 'draft' | 'active' | 'paused' | 'archived';
export type CatalogPricingModel =
  | 'banded'
  | 'per_unit'
  | 'flat'
  | 'package'
  | 'quote_only';
export type CatalogDimension =
  | 'guests'
  | 'hours'
  | 'nights'
  | 'units'
  | 'guards'
  | 'items'
  | 'none';
export type CatalogRateBasis = 'per_unit' | 'total';
export type CatalogAddonBasis = 'per_unit' | 'total' | 'flat';
export type CatalogAttributeScope = 'category' | 'type' | 'service';
export type CatalogAliasEntity = 'category' | 'type' | 'service';
export type CatalogAliasLanguage = 'en' | 'pcm' | 'yo' | 'ig' | 'ha';
export type VendorServiceStatus = 'draft' | 'active' | 'paused' | 'archived';
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
      geo_nodes: {
        Row: {
          id: string;
          parent_id: string | null;
          level: 'country' | 'state' | 'area' | 'neighbourhood';
          slug: string;
          name: string;
          aliases: Json;
          lat: number | null;
          lng: number | null;
          is_statewide: boolean;
          status: 'draft' | 'active' | 'paused' | 'archived';
          sort_order: number;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id?: string | null;
          level: 'country' | 'state' | 'area' | 'neighbourhood';
          slug: string;
          name: string;
          aliases?: Json;
          lat?: number | null;
          lng?: number | null;
          is_statewide?: boolean;
          status?: 'draft' | 'active' | 'paused' | 'archived';
          sort_order?: number;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string | null;
          level?: 'country' | 'state' | 'area' | 'neighbourhood';
          slug?: string;
          name?: string;
          aliases?: Json;
          lat?: number | null;
          lng?: number | null;
          is_statewide?: boolean;
          status?: 'draft' | 'active' | 'paused' | 'archived';
          sort_order?: number;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'geo_nodes_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'geo_nodes';
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
          location_rule: 'specific' | 'state' | 'none';
          location_role: 'at_buyer' | 'at_venue' | 'at_vendor';
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
          location_rule?: 'specific' | 'state' | 'none';
          location_role?: 'at_buyer' | 'at_venue' | 'at_vendor';
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
          location_rule?: 'specific' | 'state' | 'none';
          location_role?: 'at_buyer' | 'at_venue' | 'at_vendor';
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
      requests: {
        Row: {
          id: string;
          buyer_user_id: string;
          category_slug: string;
          area_slug: string;
          need_payload: Json;
          budget_min_minor: number | null;
          budget_max_minor: number | null;
          currency: string;
          status: RequestStatus;
          catalog_version_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          buyer_user_id: string;
          category_slug: string;
          area_slug: string;
          need_payload?: Json;
          budget_min_minor?: number | null;
          budget_max_minor?: number | null;
          currency?: string;
          status?: RequestStatus;
          catalog_version_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          buyer_user_id?: string;
          category_slug?: string;
          area_slug?: string;
          need_payload?: Json;
          budget_min_minor?: number | null;
          budget_max_minor?: number | null;
          currency?: string;
          status?: RequestStatus;
          catalog_version_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      missions: {
        Row: {
          id: string;
          request_id: string;
          status: MissionStatus;
          state_entered_at: string;
          response_deadline_at: string | null;
          collect_deadline_at: string | null;
          expires_at: string | null;
          top_n: number;
          matched_count: number;
          last_idempotency_key: string | null;
          meta: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          status?: MissionStatus;
          state_entered_at?: string;
          response_deadline_at?: string | null;
          collect_deadline_at?: string | null;
          expires_at?: string | null;
          top_n?: number;
          matched_count?: number;
          last_idempotency_key?: string | null;
          meta?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          status?: MissionStatus;
          state_entered_at?: string;
          response_deadline_at?: string | null;
          collect_deadline_at?: string | null;
          expires_at?: string | null;
          top_n?: number;
          matched_count?: number;
          last_idempotency_key?: string | null;
          meta?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mission_candidates: {
        Row: {
          id: string;
          mission_id: string;
          vendor_profile_id: string;
          vendor_user_id: string;
          status: MissionCandidateStatus;
          match_score: number | null;
          contacted_at: string | null;
          nudged_at: string | null;
          responded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          vendor_profile_id: string;
          vendor_user_id: string;
          status?: MissionCandidateStatus;
          match_score?: number | null;
          contacted_at?: string | null;
          nudged_at?: string | null;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          vendor_profile_id?: string;
          vendor_user_id?: string;
          status?: MissionCandidateStatus;
          match_score?: number | null;
          contacted_at?: string | null;
          nudged_at?: string | null;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      offers: {
        Row: {
          id: string;
          mission_id: string;
          vendor_profile_id: string;
          vendor_user_id: string;
          amount_minor: number;
          currency: string;
          message: string;
          status: OfferStatus;
          rank_score: number | null;
          rank_reason: string | null;
          catalog_version_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          vendor_profile_id: string;
          vendor_user_id: string;
          amount_minor: number;
          currency?: string;
          message?: string;
          status?: OfferStatus;
          rank_score?: number | null;
          rank_reason?: string | null;
          catalog_version_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          vendor_profile_id?: string;
          vendor_user_id?: string;
          amount_minor?: number;
          currency?: string;
          message?: string;
          status?: OfferStatus;
          rank_score?: number | null;
          rank_reason?: string | null;
          catalog_version_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          mission_id: string;
          offer_id: string;
          buyer_user_id: string;
          vendor_profile_id: string;
          vendor_user_id: string;
          status: BookingStatus;
          total_minor: number;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          offer_id: string;
          buyer_user_id: string;
          vendor_profile_id: string;
          vendor_user_id: string;
          status?: BookingStatus;
          total_minor: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          offer_id?: string;
          buyer_user_id?: string;
          vendor_profile_id?: string;
          vendor_user_id?: string;
          status?: BookingStatus;
          total_minor?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      category_types: {
        Row: {
          id: string;
          category_id: string;
          slug: string;
          name: string;
          aliases: Json;
          status: CatalogEntityStatus;
          sort_order: number;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          slug: string;
          name: string;
          aliases?: Json;
          status?: CatalogEntityStatus;
          sort_order?: number;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          slug?: string;
          name?: string;
          aliases?: Json;
          status?: CatalogEntityStatus;
          sort_order?: number;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          category_id: string;
          slug: string;
          name: string;
          description: string;
          status: CatalogEntityStatus;
          sort_order: number;
          pricing_model: CatalogPricingModel;
          dimension: CatalogDimension;
          dimension_label: string | null;
          unit_label: string | null;
          min_value: number | null;
          max_value: number | null;
          step: number;
          default_bands: Json;
          packages: Json;
          allow_custom_bands: boolean;
          requires_inspection: boolean;
          default_lead_time_hours: number;
          regulated: boolean;
          required_documents: Json;
          aliases: Json;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          slug: string;
          name: string;
          description?: string;
          status?: CatalogEntityStatus;
          sort_order?: number;
          pricing_model: CatalogPricingModel;
          dimension: CatalogDimension;
          dimension_label?: string | null;
          unit_label?: string | null;
          min_value?: number | null;
          max_value?: number | null;
          step?: number;
          default_bands?: Json;
          packages?: Json;
          allow_custom_bands?: boolean;
          requires_inspection?: boolean;
          default_lead_time_hours?: number;
          regulated?: boolean;
          required_documents?: Json;
          aliases?: Json;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          slug?: string;
          name?: string;
          description?: string;
          status?: CatalogEntityStatus;
          sort_order?: number;
          pricing_model?: CatalogPricingModel;
          dimension?: CatalogDimension;
          dimension_label?: string | null;
          unit_label?: string | null;
          min_value?: number | null;
          max_value?: number | null;
          step?: number;
          default_bands?: Json;
          packages?: Json;
          allow_custom_bands?: boolean;
          requires_inspection?: boolean;
          default_lead_time_hours?: number;
          regulated?: boolean;
          required_documents?: Json;
          aliases?: Json;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      service_types: {
        Row: {
          id: string;
          service_id: string;
          type_id: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          type_id: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_id?: string;
          type_id?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      catalog_attributes: {
        Row: {
          id: string;
          scope: CatalogAttributeScope;
          scope_id: string;
          key: string;
          label: string;
          type: AttributeType;
          required: boolean;
          options: Json | null;
          applies_to: AppliesTo;
          validation: Json | null;
          sort_order: number;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scope: CatalogAttributeScope;
          scope_id: string;
          key: string;
          label: string;
          type: AttributeType;
          required?: boolean;
          options?: Json | null;
          applies_to: AppliesTo;
          validation?: Json | null;
          sort_order?: number;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          scope?: CatalogAttributeScope;
          scope_id?: string;
          key?: string;
          label?: string;
          type?: AttributeType;
          required?: boolean;
          options?: Json | null;
          applies_to?: AppliesTo;
          validation?: Json | null;
          sort_order?: number;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      catalog_aliases: {
        Row: {
          id: string;
          entity: CatalogAliasEntity;
          entity_id: string;
          alias: string;
          language: CatalogAliasLanguage;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          entity: CatalogAliasEntity;
          entity_id: string;
          alias: string;
          language: CatalogAliasLanguage;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          entity?: CatalogAliasEntity;
          entity_id?: string;
          alias?: string;
          language?: CatalogAliasLanguage;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      catalog_versions: {
        Row: {
          id: string;
          version_number: number;
          snapshot: Json;
          published_by: string | null;
          published_at: string | null;
          change_note: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          version_number: number;
          snapshot: Json;
          published_by?: string | null;
          published_at?: string | null;
          change_note?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          version_number?: number;
          snapshot?: Json;
          published_by?: string | null;
          published_at?: string | null;
          change_note?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vendor_categories: {
        Row: {
          id: string;
          vendor_profile_id: string;
          category_id: string;
          status: CatalogEntityStatus;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_profile_id: string;
          category_id: string;
          status?: CatalogEntityStatus;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_profile_id?: string;
          category_id?: string;
          status?: CatalogEntityStatus;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vendor_types: {
        Row: {
          id: string;
          vendor_profile_id: string;
          category_id: string;
          type_id: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_profile_id: string;
          category_id: string;
          type_id: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_profile_id?: string;
          category_id?: string;
          type_id?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vendor_services: {
        Row: {
          id: string;
          vendor_profile_id: string;
          service_id: string;
          status: VendorServiceStatus;
          min_notice_hours: number;
          deposit_pct: number;
          inclusions: Json;
          exclusions: Json;
          notes: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_profile_id: string;
          service_id: string;
          status?: VendorServiceStatus;
          min_notice_hours?: number;
          deposit_pct?: number;
          inclusions?: Json;
          exclusions?: Json;
          notes?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_profile_id?: string;
          service_id?: string;
          status?: VendorServiceStatus;
          min_notice_hours?: number;
          deposit_pct?: number;
          inclusions?: Json;
          exclusions?: Json;
          notes?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vendor_service_types: {
        Row: {
          id: string;
          vendor_service_id: string;
          type_id: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_service_id: string;
          type_id: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_service_id?: string;
          type_id?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vendor_rates: {
        Row: {
          id: string;
          vendor_service_id: string;
          dim_min: number;
          dim_max: number;
          basis: CatalogRateBasis;
          price_minor: number;
          currency: string;
          min_charge_minor: number | null;
          label: string | null;
          valid_from: string | null;
          valid_to: string | null;
          sort_order: number;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_service_id: string;
          dim_min: number;
          dim_max: number;
          basis: CatalogRateBasis;
          price_minor: number;
          currency?: string;
          min_charge_minor?: number | null;
          label?: string | null;
          valid_from?: string | null;
          valid_to?: string | null;
          sort_order?: number;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_service_id?: string;
          dim_min?: number;
          dim_max?: number;
          basis?: CatalogRateBasis;
          price_minor?: number;
          currency?: string;
          min_charge_minor?: number | null;
          label?: string | null;
          valid_from?: string | null;
          valid_to?: string | null;
          sort_order?: number;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vendor_addons: {
        Row: {
          id: string;
          vendor_service_id: string;
          name: string;
          price_minor: number;
          basis: CatalogAddonBasis;
          max_qty: number | null;
          notes: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_service_id: string;
          name: string;
          price_minor: number;
          basis: CatalogAddonBasis;
          max_qty?: number | null;
          notes?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_service_id?: string;
          name?: string;
          price_minor?: number;
          basis?: CatalogAddonBasis;
          max_qty?: number | null;
          notes?: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      unmet_demand: {
        Row: {
          id: string;
          request_id: string;
          mission_id: string | null;
          category_slug: string;
          area_slug: string;
          matched_count: number;
          required_count: number;
          need_snapshot: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          mission_id?: string | null;
          category_slug: string;
          area_slug: string;
          matched_count: number;
          required_count: number;
          need_snapshot?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          mission_id?: string | null;
          category_slug?: string;
          area_slug?: string;
          matched_count?: number;
          required_count?: number;
          need_snapshot?: Json;
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
      transition_mission: {
        Args: {
          p_mission_id: string;
          p_target_status: MissionStatus;
          p_idempotency_key?: string | null;
        };
        Returns: Json;
      };
      expire_missions: {
        Args: { p_batch_size?: number };
        Returns: Json;
      };
      process_mission_job: {
        Args: { p_payload: Json };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type AreaRow = Database['public']['Tables']['areas']['Row'];
export type GeoNodeRow = Database['public']['Tables']['geo_nodes']['Row'];
export type RequestRow = Database['public']['Tables']['requests']['Row'];
export type MissionRow = Database['public']['Tables']['missions']['Row'];
export type MissionCandidateRow = Database['public']['Tables']['mission_candidates']['Row'];
export type OfferRow = Database['public']['Tables']['offers']['Row'];
export type BookingRow = Database['public']['Tables']['bookings']['Row'];
export type UnmetDemandRow = Database['public']['Tables']['unmet_demand']['Row'];
export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type CategoryVersionRow = Database['public']['Tables']['category_versions']['Row'];
export type CategoryAttributeRow = Database['public']['Tables']['category_attributes']['Row'];
export type CategoryTypeRow = Database['public']['Tables']['category_types']['Row'];
export type CatalogServiceRow = Database['public']['Tables']['services']['Row'];
export type ServiceTypeRow = Database['public']['Tables']['service_types']['Row'];
export type CatalogAttributeRow = Database['public']['Tables']['catalog_attributes']['Row'];
export type CatalogAliasRow = Database['public']['Tables']['catalog_aliases']['Row'];
export type CatalogVersionRow = Database['public']['Tables']['catalog_versions']['Row'];
export type VendorCategoryRow = Database['public']['Tables']['vendor_categories']['Row'];
export type VendorTypeRow = Database['public']['Tables']['vendor_types']['Row'];
export type VendorServiceRow = Database['public']['Tables']['vendor_services']['Row'];
export type VendorServiceTypeRow = Database['public']['Tables']['vendor_service_types']['Row'];
export type VendorRateRow = Database['public']['Tables']['vendor_rates']['Row'];
export type VendorAddonRow = Database['public']['Tables']['vendor_addons']['Row'];

/** Kept for documentation; Relationships shapes are inlined above. */
export type { Relationship };

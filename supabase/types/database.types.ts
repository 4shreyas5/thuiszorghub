// Generated Supabase Database Types
// This file is auto-generated from the database schema
// Do not edit manually - regenerate after migrations

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          legal_name: string | null;
          kvk_number: string | null;
          vat_number: string | null;
          email: string;
          phone: string | null;
          website: string | null;
          address_line_1: string;
          address_line_2: string | null;
          city: string;
          postal_code: string;
          country: string;
          logo_url: string | null;
          primary_language: string;
          timezone: string;
          currency: string;
          subscription_id: string | null;
          is_active: boolean;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          legal_name?: string | null;
          kvk_number?: string | null;
          vat_number?: string | null;
          email: string;
          phone?: string | null;
          website?: string | null;
          address_line_1: string;
          address_line_2?: string | null;
          city: string;
          postal_code: string;
          country?: string;
          logo_url?: string | null;
          primary_language?: string;
          timezone?: string;
          currency?: string;
          subscription_id?: string | null;
          is_active?: boolean;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          legal_name?: string | null;
          kvk_number?: string | null;
          vat_number?: string | null;
          email?: string;
          phone?: string | null;
          website?: string | null;
          address_line_1?: string;
          address_line_2?: string | null;
          city?: string;
          postal_code?: string;
          country?: string;
          logo_url?: string | null;
          primary_language?: string;
          timezone?: string;
          currency?: string;
          subscription_id?: string | null;
          is_active?: boolean;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      branches: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          code: string | null;
          manager_user_id: string | null;
          email: string | null;
          phone: string | null;
          address_line_1: string;
          address_line_2: string | null;
          city: string;
          postal_code: string;
          country: string;
          is_active: boolean;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          code?: string | null;
          manager_user_id?: string | null;
          email?: string | null;
          phone?: string | null;
          address_line_1: string;
          address_line_2?: string | null;
          city: string;
          postal_code: string;
          country?: string;
          is_active?: boolean;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          code?: string | null;
          manager_user_id?: string | null;
          email?: string | null;
          phone?: string | null;
          address_line_1?: string;
          address_line_2?: string | null;
          city?: string;
          postal_code?: string;
          country?: string;
          is_active?: boolean;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string | null;
          employee_id: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          language: string;
          timezone: string;
          last_login: string | null;
          is_active: boolean;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          organization_id: string;
          branch_id?: string | null;
          employee_id?: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          language?: string;
          timezone?: string;
          last_login?: string | null;
          is_active?: boolean;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          branch_id?: string | null;
          employee_id?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          language?: string;
          timezone?: string;
          last_login?: string | null;
          is_active?: boolean;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      permissions: {
        Row: {
          id: string;
          module: string;
          action: string;
          code: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          module: string;
          action: string;
          code: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          module?: string;
          action?: string;
          code?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          id: string;
          role_id: string;
          permission_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          role_id: string;
          permission_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          role_id?: string;
          permission_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          assigned_by: string;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          assigned_by: string;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          assigned_by?: string;
          assigned_at?: string;
        };
        Relationships: [];
      };
      organization_settings: {
        Row: {
          id: string;
          organization_id: string;
          date_format: string;
          time_format: string;
          currency: string;
          work_week_start: number;
          default_visit_duration: number;
          timezone: string;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          date_format?: string;
          time_format?: string;
          currency?: string;
          work_week_start?: number;
          default_visit_duration?: number;
          timezone?: string;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          date_format?: string;
          time_format?: string;
          currency?: string;
          work_week_start?: number;
          default_visit_duration?: number;
          timezone?: string;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          event_type: string;
          resource_type: string;
          resource_id: string | null;
          action: string;
          changes: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          event_type: string;
          resource_type: string;
          resource_id?: string | null;
          action: string;
          changes?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          event_type?: string;
          resource_type?: string;
          resource_id?: string | null;
          action?: string;
          changes?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Views: {};
    Functions: {
      create_organization_with_owner: {
        Args: {
          p_organization_name: string;
          p_organization_email: string;
          p_user_id: string;
          p_first_name: string;
          p_last_name: string;
          p_language?: string;
          p_timezone?: string;
        };
        Returns: {
          organization_id: string;
          success: boolean;
          message: string;
        }[];
      };
    };
  };
}

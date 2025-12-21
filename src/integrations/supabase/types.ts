export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      agency_limits: {
        Row: {
          agency_id: string
          created_at: string
          features: Json | null
          id: string
          max_clients: number
          max_leads: number
          max_recurring_clients: number
          max_users: number
          notes: string | null
          storage_mb: number
          updated_at: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          features?: Json | null
          id?: string
          max_clients?: number
          max_leads?: number
          max_recurring_clients?: number
          max_users?: number
          notes?: string | null
          storage_mb?: number
          updated_at?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          features?: Json | null
          id?: string
          max_clients?: number
          max_leads?: number
          max_recurring_clients?: number
          max_users?: number
          notes?: string | null
          storage_mb?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_limits_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_members: {
        Row: {
          agency_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_members_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_sensitive_data: {
        Row: {
          agency_id: string
          bank_account_encrypted: string | null
          bank_agency_encrypted: string | null
          cnpj_encrypted: string | null
          created_at: string
          encryption_key_id: string | null
          id: string
          pix_key_encrypted: string | null
          updated_at: string
        }
        Insert: {
          agency_id: string
          bank_account_encrypted?: string | null
          bank_agency_encrypted?: string | null
          cnpj_encrypted?: string | null
          created_at?: string
          encryption_key_id?: string | null
          id?: string
          pix_key_encrypted?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string
          bank_account_encrypted?: string | null
          bank_agency_encrypted?: string | null
          cnpj_encrypted?: string | null
          created_at?: string
          encryption_key_id?: string | null
          id?: string
          pix_key_encrypted?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_sensitive_data_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_usage: {
        Row: {
          agency_id: string
          created_at: string
          current_clients: number
          current_leads: number
          current_recurring_clients: number
          current_users: number
          id: string
          last_calculated_at: string
          storage_used_mb: number
          updated_at: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          current_clients?: number
          current_leads?: number
          current_recurring_clients?: number
          current_users?: number
          id?: string
          last_calculated_at?: string
          storage_used_mb?: number
          updated_at?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          current_clients?: number
          current_leads?: number
          current_recurring_clients?: number
          current_users?: number
          id?: string
          last_calculated_at?: string
          storage_used_mb?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_usage_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action_type: string
          agency_id: string
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          user_id: string
          user_name: string
        }
        Insert: {
          action_type: string
          agency_id?: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          user_id: string
          user_name: string
        }
        Update: {
          action_type?: string
          agency_id?: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      client_invoices: {
        Row: {
          agency_id: string
          amount: number
          client_id: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          invoice_number: string
          metadata: Json | null
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_method: string | null
          recurring_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          agency_id: string
          amount: number
          client_id: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          invoice_number: string
          metadata?: Json | null
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          recurring_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string
          amount?: number
          client_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          metadata?: Json | null
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          recurring_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_invoices_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_v2_expanded"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invoices_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "client_recurring_history"
            referencedColumns: ["id"]
          },
        ]
      }
      client_recurring_history: {
        Row: {
          agency_id: string
          amount: number
          billing_cycle: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          client_id: string
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          plan_name: string
          start_date: string
          status: Database["public"]["Enums"]["recurring_status"]
          updated_at: string
        }
        Insert: {
          agency_id: string
          amount?: number
          billing_cycle?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          client_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          plan_name: string
          start_date?: string
          status?: Database["public"]["Enums"]["recurring_status"]
          updated_at?: string
        }
        Update: {
          agency_id?: string
          amount?: number
          billing_cycle?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          client_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          plan_name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["recurring_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_recurring_history_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_recurring_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_recurring_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients_v2_expanded"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          agency_id: string
          attachments: string[] | null
          attachments_count: number | null
          briefing: string | null
          checklist: Json
          city: string | null
          column_id: string
          company_name: string
          comparisons: Json
          cover_config: Json | null
          created_at: string
          deleted_at: string | null
          drive_url: string | null
          google_profile_url: string | null
          history: Json
          id: string
          is_owner: boolean
          keywords: string[] | null
          labels: Json | null
          last_update: string
          main_category: string | null
          notes: string | null
          photo_mode: string | null
          plan_type: string
          profile_image: string | null
          responsible: string
          start_date: string
          status: string
          suspended_at: string | null
          updated_at: string
          whatsapp_group_url: string | null
          whatsapp_link: string | null
          whatsapp_link_short: string | null
          yahoo_email: string | null
        }
        Insert: {
          agency_id?: string
          attachments?: string[] | null
          attachments_count?: number | null
          briefing?: string | null
          checklist?: Json
          city?: string | null
          column_id?: string
          company_name: string
          comparisons?: Json
          cover_config?: Json | null
          created_at?: string
          deleted_at?: string | null
          drive_url?: string | null
          google_profile_url?: string | null
          history?: Json
          id?: string
          is_owner?: boolean
          keywords?: string[] | null
          labels?: Json | null
          last_update?: string
          main_category?: string | null
          notes?: string | null
          photo_mode?: string | null
          plan_type?: string
          profile_image?: string | null
          responsible?: string
          start_date?: string
          status?: string
          suspended_at?: string | null
          updated_at?: string
          whatsapp_group_url?: string | null
          whatsapp_link?: string | null
          whatsapp_link_short?: string | null
          yahoo_email?: string | null
        }
        Update: {
          agency_id?: string
          attachments?: string[] | null
          attachments_count?: number | null
          briefing?: string | null
          checklist?: Json
          city?: string | null
          column_id?: string
          company_name?: string
          comparisons?: Json
          cover_config?: Json | null
          created_at?: string
          deleted_at?: string | null
          drive_url?: string | null
          google_profile_url?: string | null
          history?: Json
          id?: string
          is_owner?: boolean
          keywords?: string[] | null
          labels?: Json | null
          last_update?: string
          main_category?: string | null
          notes?: string | null
          photo_mode?: string | null
          plan_type?: string
          profile_image?: string | null
          responsible?: string
          start_date?: string
          status?: string
          suspended_at?: string | null
          updated_at?: string
          whatsapp_group_url?: string | null
          whatsapp_link?: string | null
          whatsapp_link_short?: string | null
          yahoo_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      clients_v2: {
        Row: {
          agency_id: string
          city: string | null
          company_name: string
          contact_name: string | null
          created_at: string
          custom_fields: Json | null
          deleted_at: string | null
          email: string | null
          end_date: string | null
          google_profile_url: string | null
          id: string
          main_category: string | null
          monthly_value: number | null
          notes: string | null
          phone: string | null
          plan_name: string | null
          responsible: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["client_status_v2"]
          tags: Json | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          agency_id: string
          city?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          custom_fields?: Json | null
          deleted_at?: string | null
          email?: string | null
          end_date?: string | null
          google_profile_url?: string | null
          id?: string
          main_category?: string | null
          monthly_value?: number | null
          notes?: string | null
          phone?: string | null
          plan_name?: string | null
          responsible?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["client_status_v2"]
          tags?: Json | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          agency_id?: string
          city?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          custom_fields?: Json | null
          deleted_at?: string | null
          email?: string | null
          end_date?: string | null
          google_profile_url?: string | null
          id?: string
          main_category?: string | null
          monthly_value?: number | null
          notes?: string | null
          phone?: string | null
          plan_name?: string | null
          responsible?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["client_status_v2"]
          tags?: Json | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_v2_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_configs: {
        Row: {
          active: boolean
          agency_id: string
          amount: number
          collaborator_name: string
          collaborator_user_id: string | null
          commission_model: string
          commission_type: string
          created_at: string
          id: string
          initial_status: string
          notes: string | null
          trigger_event: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          agency_id?: string
          amount?: number
          collaborator_name: string
          collaborator_user_id?: string | null
          commission_model?: string
          commission_type?: string
          created_at?: string
          id?: string
          initial_status?: string
          notes?: string | null
          trigger_event?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          agency_id?: string
          amount?: number
          collaborator_name?: string
          collaborator_user_id?: string | null
          commission_model?: string
          commission_type?: string
          created_at?: string
          id?: string
          initial_status?: string
          notes?: string | null
          trigger_event?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_configs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_roles: {
        Row: {
          active: boolean
          agency_id: string
          created_at: string
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          agency_id?: string
          created_at?: string
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          agency_id?: string
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_roles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions_old: {
        Row: {
          agency_id: string
          amount: number
          client_id: string
          client_name: string
          created_at: string
          delivered_at: string | null
          execution_deadline: string | null
          id: string
          monitoring_days: number
          monitoring_end_date: string | null
          notes: string | null
          operator_id: string | null
          operator_name: string
          paid_at: string | null
          status: Database["public"]["Enums"]["commission_status"]
          updated_at: string
        }
        Insert: {
          agency_id?: string
          amount?: number
          client_id: string
          client_name: string
          created_at?: string
          delivered_at?: string | null
          execution_deadline?: string | null
          id?: string
          monitoring_days?: number
          monitoring_end_date?: string | null
          notes?: string | null
          operator_id?: string | null
          operator_name?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
        }
        Update: {
          agency_id?: string
          amount?: number
          client_id?: string
          client_name?: string
          created_at?: string
          delivered_at?: string | null
          execution_deadline?: string | null
          id?: string
          monitoring_days?: number
          monitoring_end_date?: string | null
          notes?: string | null
          operator_id?: string | null
          operator_name?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_old_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions_v2: {
        Row: {
          agency_id: string
          amount: number
          approved_at: string | null
          client_id: string | null
          client_name: string
          created_at: string
          created_by: string
          delivered_at: string | null
          description: string
          id: string
          lead_id: string | null
          notes: string | null
          paid_at: string | null
          recipient_id: string | null
          recipient_name: string
          recipient_role_id: string | null
          recipient_type: Database["public"]["Enums"]["commission_recipient_type"]
          sale_value: number | null
          status: Database["public"]["Enums"]["commission_payment_status"]
          updated_at: string
        }
        Insert: {
          agency_id?: string
          amount?: number
          approved_at?: string | null
          client_id?: string | null
          client_name: string
          created_at?: string
          created_by: string
          delivered_at?: string | null
          description: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          paid_at?: string | null
          recipient_id?: string | null
          recipient_name: string
          recipient_role_id?: string | null
          recipient_type: Database["public"]["Enums"]["commission_recipient_type"]
          sale_value?: number | null
          status?: Database["public"]["Enums"]["commission_payment_status"]
          updated_at?: string
        }
        Update: {
          agency_id?: string
          amount?: number
          approved_at?: string | null
          client_id?: string | null
          client_name?: string
          created_at?: string
          created_by?: string
          delivered_at?: string | null
          description?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          paid_at?: string | null
          recipient_id?: string | null
          recipient_name?: string
          recipient_role_id?: string | null
          recipient_type?: Database["public"]["Enums"]["commission_recipient_type"]
          sale_value?: number | null
          status?: Database["public"]["Enums"]["commission_payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_v2_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_v2_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_v2_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_v2_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_expanded"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_v2_recipient_role_id_fkey"
            columns: ["recipient_role_id"]
            isOneToOne: false
            referencedRelation: "commission_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          agency_id: string
          attempts: number | null
          body_html: string | null
          body_text: string | null
          created_at: string
          error_message: string | null
          id: string
          last_attempt_at: string | null
          max_attempts: number | null
          notification_id: string | null
          priority: number | null
          recipient_email: string
          recipient_name: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          subject: string
          template_data: Json | null
          template_id: string | null
        }
        Insert: {
          agency_id: string
          attempts?: number | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          notification_id?: string | null
          priority?: number | null
          recipient_email: string
          recipient_name?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_data?: Json | null
          template_id?: string | null
        }
        Update: {
          agency_id?: string
          attempts?: number | null
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          notification_id?: string | null
          priority?: number | null
          recipient_email?: string
          recipient_name?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_data?: Json | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_queue_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          agency_id: string
          ai_insight: string | null
          content: string
          created_at: string
          created_by: string
          created_by_name: string
          id: string
          lead_id: string
          link: string | null
          notes: string | null
          type: Database["public"]["Enums"]["lead_activity_type"]
          updated_at: string | null
        }
        Insert: {
          agency_id?: string
          ai_insight?: string | null
          content: string
          created_at?: string
          created_by: string
          created_by_name: string
          id?: string
          lead_id: string
          link?: string | null
          notes?: string | null
          type: Database["public"]["Enums"]["lead_activity_type"]
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          ai_insight?: string | null
          content?: string
          created_at?: string
          created_by?: string
          created_by_name?: string
          id?: string
          lead_id?: string
          link?: string | null
          notes?: string | null
          type?: Database["public"]["Enums"]["lead_activity_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_expanded"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_ai_interactions: {
        Row: {
          agency_id: string
          ai_response: string | null
          created_at: string | null
          id: string
          interaction_type: string
          lead_id: string
          metadata: Json | null
          model: string | null
          prompt: string | null
          tokens_used: number | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          agency_id: string
          ai_response?: string | null
          created_at?: string | null
          id?: string
          interaction_type: string
          lead_id: string
          metadata?: Json | null
          model?: string | null
          prompt?: string | null
          tokens_used?: number | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          agency_id?: string
          ai_response?: string | null
          created_at?: string | null
          id?: string
          interaction_type?: string
          lead_id?: string
          metadata?: Json | null
          model?: string | null
          prompt?: string | null
          tokens_used?: number | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_ai_interactions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_ai_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_ai_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_expanded"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_custom_fields: {
        Row: {
          agency_id: string
          created_at: string | null
          field_key: string
          field_type: string
          id: string
          is_required: boolean | null
          is_searchable: boolean | null
          name: string
          options: string[] | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          field_key: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          is_searchable?: boolean | null
          name: string
          options?: string[] | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          field_key?: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          is_searchable?: boolean | null
          name?: string
          options?: string[] | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_custom_fields_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_field_values: {
        Row: {
          agency_id: string
          created_at: string | null
          field_id: string
          id: string
          lead_id: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          field_id: string
          id?: string
          lead_id: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          field_id?: string
          id?: string
          lead_id?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_field_values_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "lead_custom_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_field_values_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_field_values_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_expanded"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_messages: {
        Row: {
          agency_id: string
          created_at: string | null
          id: string
          is_private: boolean | null
          lead_id: string
          message: string
          message_type: string | null
          updated_at: string | null
          user_id: string | null
          user_name: string
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          lead_id: string
          message: string
          message_type?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_name?: string
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          lead_id?: string
          message?: string
          message_type?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_messages_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_expanded"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sources: {
        Row: {
          active: boolean
          agency_id: string
          created_at: string
          id: string
          label: string
        }
        Insert: {
          active?: boolean
          agency_id?: string
          created_at?: string
          id?: string
          label: string
        }
        Update: {
          active?: boolean
          agency_id?: string
          created_at?: string
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_sources_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tag_assignments: {
        Row: {
          agency_id: string
          created_at: string | null
          id: string
          lead_id: string
          tag_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          id?: string
          lead_id: string
          tag_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          id?: string
          lead_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tag_assignments_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tag_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tag_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_expanded"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "lead_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tags: {
        Row: {
          agency_id: string
          color: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          agency_id: string
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          agency_id?: string
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tags_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          agency_id: string
          city: string | null
          company_name: string
          contact_name: string | null
          converted_at: string | null
          converted_client_id: string | null
          created_at: string
          created_by: string
          email: string | null
          estimated_value: number | null
          id: string
          last_activity_at: string
          lost_notes: string | null
          lost_reason_id: string | null
          main_category: string | null
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          phone: string | null
          pipeline_stage: Database["public"]["Enums"]["lead_pipeline_stage"]
          probability: number | null
          proposal_notes: string | null
          proposal_status: Database["public"]["Enums"]["proposal_status"]
          proposal_url: string | null
          responsible: string
          source_custom: string | null
          source_id: string | null
          status: Database["public"]["Enums"]["lead_status"]
          temperature: Database["public"]["Enums"]["lead_temperature"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          agency_id?: string
          city?: string | null
          company_name: string
          contact_name?: string | null
          converted_at?: string | null
          converted_client_id?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          estimated_value?: number | null
          id?: string
          last_activity_at?: string
          lost_notes?: string | null
          lost_reason_id?: string | null
          main_category?: string | null
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_stage?: Database["public"]["Enums"]["lead_pipeline_stage"]
          probability?: number | null
          proposal_notes?: string | null
          proposal_status?: Database["public"]["Enums"]["proposal_status"]
          proposal_url?: string | null
          responsible?: string
          source_custom?: string | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          agency_id?: string
          city?: string | null
          company_name?: string
          contact_name?: string | null
          converted_at?: string | null
          converted_client_id?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          estimated_value?: number | null
          id?: string
          last_activity_at?: string
          lost_notes?: string | null
          lost_reason_id?: string | null
          main_category?: string | null
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_stage?: Database["public"]["Enums"]["lead_pipeline_stage"]
          probability?: number | null
          proposal_notes?: string | null
          proposal_status?: Database["public"]["Enums"]["proposal_status"]
          proposal_url?: string | null
          responsible?: string
          source_custom?: string | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_lost_reason_id_fkey"
            columns: ["lost_reason_id"]
            isOneToOne: false
            referencedRelation: "lost_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      login_events: {
        Row: {
          created_at: string
          failure_reason: string | null
          id: string
          ip_address: unknown
          location: string | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          location?: string | null
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          location?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lost_reasons: {
        Row: {
          active: boolean
          agency_id: string
          created_at: string
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          agency_id?: string
          created_at?: string
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          agency_id?: string
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "lost_reasons_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          agency_id: string
          ai_insight_enabled: boolean | null
          created_at: string
          email_digest_frequency: string | null
          email_enabled: boolean | null
          id: string
          lead_activity_enabled: boolean | null
          lead_stale_enabled: boolean | null
          push_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          task_due_enabled: boolean | null
          task_overdue_enabled: boolean | null
          team_mention_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_id: string
          ai_insight_enabled?: boolean | null
          created_at?: string
          email_digest_frequency?: string | null
          email_enabled?: boolean | null
          id?: string
          lead_activity_enabled?: boolean | null
          lead_stale_enabled?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          task_due_enabled?: boolean | null
          task_overdue_enabled?: boolean | null
          team_mention_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string
          ai_insight_enabled?: boolean | null
          created_at?: string
          email_digest_frequency?: string | null
          email_enabled?: boolean | null
          id?: string
          lead_activity_enabled?: boolean | null
          lead_stale_enabled?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          task_due_enabled?: boolean | null
          task_overdue_enabled?: boolean | null
          team_mention_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          agency_id: string
          channel: Database["public"]["Enums"]["notification_channel"]
          client_id: string | null
          created_at: string
          dismissed_at: string | null
          expires_at: string | null
          id: string
          lead_id: string | null
          message: string | null
          metadata: Json | null
          priority: Database["public"]["Enums"]["notification_priority"]
          read_at: string | null
          sent_at: string | null
          task_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          agency_id: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          client_id?: string | null
          created_at?: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          lead_id?: string | null
          message?: string | null
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          sent_at?: string | null
          task_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          agency_id?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          client_id?: string | null
          created_at?: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          lead_id?: string | null
          message?: string | null
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          sent_at?: string | null
          task_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_expanded"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "scheduled_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_registrations: {
        Row: {
          agency_name: string
          agency_slug: string
          created_at: string
          id: string
          owner_email: string
          owner_name: string
          owner_phone: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agency_name: string
          agency_slug: string
          created_at?: string
          id?: string
          owner_email: string
          owner_name: string
          owner_phone?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agency_name?: string
          agency_slug?: string
          created_at?: string
          id?: string
          owner_email?: string
          owner_name?: string
          owner_phone?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          features: Json
          id: string
          max_clients: number
          max_leads: number
          max_recurring_clients: number
          max_users: number
          name: string
          price_monthly: number
          price_yearly: number | null
          slug: string
          sort_order: number
          storage_mb: number
          trial_days: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          max_clients?: number
          max_leads?: number
          max_recurring_clients?: number
          max_users?: number
          name: string
          price_monthly?: number
          price_yearly?: number | null
          slug: string
          sort_order?: number
          storage_mb?: number
          trial_days?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          max_clients?: number
          max_leads?: number
          max_recurring_clients?: number
          max_users?: number
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          slug?: string
          sort_order?: number
          storage_mb?: number
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_agency_id: string | null
          full_name: string
          id: string
          last_login: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_agency_id?: string | null
          full_name: string
          id: string
          last_login?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_agency_id?: string | null
          full_name?: string
          id?: string
          last_login?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_agency_id_fkey"
            columns: ["current_agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          agency_id: string
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          answered_by_name: string | null
          asked_by: string
          asked_by_name: string
          client_id: string
          client_name: string
          created_at: string
          id: string
          question: string
          status: Database["public"]["Enums"]["question_status"]
          updated_at: string
        }
        Insert: {
          agency_id?: string
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          answered_by_name?: string | null
          asked_by: string
          asked_by_name: string
          client_id: string
          client_name: string
          created_at?: string
          id?: string
          question: string
          status?: Database["public"]["Enums"]["question_status"]
          updated_at?: string
        }
        Update: {
          agency_id?: string
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          answered_by_name?: string | null
          asked_by?: string
          asked_by_name?: string
          client_id?: string
          client_name?: string
          created_at?: string
          id?: string
          question?: string
          status?: Database["public"]["Enums"]["question_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      raiox_analyses: {
        Row: {
          agency_id: string
          call_link: string | null
          client_id: string | null
          closing_angle: string | null
          created_at: string
          created_by: string
          id: string
          lead_id: string | null
          next_step: string | null
          objections: string | null
          suggested_script: string | null
          summary: string | null
          transcription: string | null
          what_to_avoid: string | null
        }
        Insert: {
          agency_id?: string
          call_link?: string | null
          client_id?: string | null
          closing_angle?: string | null
          created_at?: string
          created_by: string
          id?: string
          lead_id?: string | null
          next_step?: string | null
          objections?: string | null
          suggested_script?: string | null
          summary?: string | null
          transcription?: string | null
          what_to_avoid?: string | null
        }
        Update: {
          agency_id?: string
          call_link?: string | null
          client_id?: string | null
          closing_angle?: string | null
          created_at?: string
          created_by?: string
          id?: string
          lead_id?: string | null
          next_step?: string | null
          objections?: string | null
          suggested_script?: string | null
          summary?: string | null
          transcription?: string | null
          what_to_avoid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raiox_analyses_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raiox_analyses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raiox_analyses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raiox_analyses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_expanded"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_clients: {
        Row: {
          agency_id: string
          client_id: string | null
          company_name: string
          created_at: string
          id: string
          monthly_value: number | null
          notes: string | null
          responsible_name: string
          responsible_user_id: string | null
          schedule_variant: string
          start_date: string
          status: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          agency_id?: string
          client_id?: string | null
          company_name: string
          created_at?: string
          id?: string
          monthly_value?: number | null
          notes?: string | null
          responsible_name?: string
          responsible_user_id?: string | null
          schedule_variant?: string
          start_date?: string
          status?: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string
          client_id?: string | null
          company_name?: string
          created_at?: string
          id?: string
          monthly_value?: number | null
          notes?: string | null
          responsible_name?: string
          responsible_user_id?: string | null
          schedule_variant?: string
          start_date?: string
          status?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_clients_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_routines: {
        Row: {
          active: boolean
          agency_id: string
          created_at: string
          description: string | null
          frequency: string
          id: string
          occurrences_per_period: number
          rules_json: Json | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          agency_id?: string
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          occurrences_per_period?: number
          rules_json?: Json | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          agency_id?: string
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          occurrences_per_period?: number
          rules_json?: Json | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_routines_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_tasks: {
        Row: {
          agency_id: string
          completed_at: string | null
          completed_by: string | null
          completed_by_name: string | null
          created_at: string
          due_date: string
          id: string
          notes: string | null
          recurring_client_id: string
          routine_id: string
          status: string
          updated_at: string
        }
        Insert: {
          agency_id?: string
          completed_at?: string | null
          completed_by?: string | null
          completed_by_name?: string | null
          created_at?: string
          due_date: string
          id?: string
          notes?: string | null
          recurring_client_id: string
          routine_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          completed_at?: string | null
          completed_by?: string | null
          completed_by_name?: string | null
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          recurring_client_id?: string
          routine_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_tasks_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_tasks_recurring_client_id_fkey"
            columns: ["recurring_client_id"]
            isOneToOne: false
            referencedRelation: "recurring_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_tasks_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "recurring_routines"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: string
          role: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          role: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          role?: string
        }
        Relationships: []
      }
      scheduled_tasks: {
        Row: {
          agency_id: string
          client_id: string | null
          completed_at: string | null
          completed_by: string | null
          completed_by_name: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          lead_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          agency_id?: string
          client_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completed_by_name?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          lead_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id?: string | null
          user_name?: string
        }
        Update: {
          agency_id?: string
          client_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completed_by_name?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          lead_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_expanded"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          agency_id: string | null
          details: Json | null
          detected_at: string
          event_type: string
          id: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          agency_id?: string | null
          details?: Json | null
          detected_at?: string
          event_type: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string | null
        }
        Update: {
          agency_id?: string | null
          details?: Json | null
          detected_at?: string
          event_type?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_alerts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_history: {
        Row: {
          agency_id: string
          changed_by: string | null
          created_at: string
          id: string
          new_plan_id: string | null
          new_status: string | null
          old_plan_id: string | null
          old_status: string | null
          reason: string | null
          subscription_id: string
        }
        Insert: {
          agency_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_plan_id?: string | null
          new_status?: string | null
          old_plan_id?: string | null
          old_status?: string | null
          reason?: string | null
          subscription_id: string
        }
        Update: {
          agency_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_plan_id?: string | null
          new_status?: string | null
          old_plan_id?: string | null
          old_status?: string | null
          reason?: string | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_history_new_plan_id_fkey"
            columns: ["new_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_history_old_plan_id_fkey"
            columns: ["old_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          agency_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string
          external_subscription_id: string | null
          id: string
          metadata: Json | null
          payment_method: string | null
          plan_id: string
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          agency_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          external_subscription_id?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          plan_id: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          external_subscription_id?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          plan_id?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          agency_id: string
          archived_at: string | null
          author_id: string
          author_name: string
          created_at: string
          description: string
          id: string
          read_at: string | null
          status: string
          target_level: string
          title: string
          updated_at: string
        }
        Insert: {
          agency_id?: string
          archived_at?: string | null
          author_id: string
          author_name: string
          created_at?: string
          description: string
          id?: string
          read_at?: string | null
          status?: string
          target_level: string
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          archived_at?: string | null
          author_id?: string
          author_name?: string
          created_at?: string
          description?: string
          id?: string
          read_at?: string | null
          status?: string
          target_level?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_actions: {
        Row: {
          action: string
          agency_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          super_admin_user_id: string
        }
        Insert: {
          action: string
          agency_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          super_admin_user_id: string
        }
        Update: {
          action?: string
          agency_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          super_admin_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "super_admin_actions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      task_time_entries: {
        Row: {
          agency_id: string
          client_id: string
          client_name: string
          created_at: string
          duration_seconds: number
          ended_at: string
          id: string
          section_title: string
          started_at: string
          task_id: string
          task_title: string
          user_id: string
          user_name: string
        }
        Insert: {
          agency_id?: string
          client_id: string
          client_name: string
          created_at?: string
          duration_seconds: number
          ended_at: string
          id?: string
          section_title: string
          started_at: string
          task_id: string
          task_title: string
          user_id: string
          user_name: string
        }
        Update: {
          agency_id?: string
          client_id?: string
          client_name?: string
          created_at?: string
          duration_seconds?: number
          ended_at?: string
          id?: string
          section_title?: string
          started_at?: string
          task_id?: string
          task_title?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_time_entries_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_audit_findings: {
        Row: {
          created_at: string
          details: string | null
          fixed: boolean
          issue: string
          run_id: number
          severity: string
          table_name: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          fixed?: boolean
          issue: string
          run_id: number
          severity: string
          table_name: string
        }
        Update: {
          created_at?: string
          details?: string | null
          fixed?: boolean
          issue?: string
          run_id?: number
          severity?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_audit_findings_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "tenant_audit_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_audit_runs: {
        Row: {
          auto_fix: boolean
          id: number
          run_at: string
        }
        Insert: {
          auto_fix?: boolean
          id?: number
          run_at?: string
        }
        Update: {
          auto_fix?: boolean
          id?: number
          run_at?: string
        }
        Relationships: []
      }
      tenant_fn_audit_findings: {
        Row: {
          created_at: string
          details: string | null
          function_name: string
          function_schema: string
          function_signature: string
          issue: string
          recommendation: string | null
          run_id: number
          severity: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          function_name: string
          function_schema: string
          function_signature: string
          issue: string
          recommendation?: string | null
          run_id: number
          severity: string
        }
        Update: {
          created_at?: string
          details?: string | null
          function_name?: string
          function_schema?: string
          function_signature?: string
          issue?: string
          recommendation?: string | null
          run_id?: number
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_fn_audit_findings_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "tenant_fn_audit_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_fn_audit_runs: {
        Row: {
          id: number
          run_at: string
        }
        Insert: {
          id?: number
          run_at?: string
        }
        Update: {
          id?: number
          run_at?: string
        }
        Relationships: []
      }
      tenant_healthcheck_results: {
        Row: {
          force_rls: boolean
          null_agency_id_rows: number
          policies_count: number
          rls_enabled: boolean
          run_id: number
          table_name: string
        }
        Insert: {
          force_rls: boolean
          null_agency_id_rows: number
          policies_count: number
          rls_enabled: boolean
          run_id: number
          table_name: string
        }
        Update: {
          force_rls?: boolean
          null_agency_id_rows?: number
          policies_count?: number
          rls_enabled?: boolean
          run_id?: number
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_healthcheck_results_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "tenant_healthcheck_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_healthcheck_runs: {
        Row: {
          id: number
          run_at: string
        }
        Insert: {
          id?: number
          run_at?: string
        }
        Update: {
          id?: number
          run_at?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          accepted_at: string
          created_at: string
          id: string
          ip_address: unknown
          policy_type: string
          policy_version: string
          revoked_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          policy_type?: string
          policy_version: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          policy_type?: string
          policy_version?: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_deletion_requests: {
        Row: {
          agency_id: string | null
          deletion_type: string
          id: string
          metadata: Json | null
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: string
          user_email: string
          user_id: string
        }
        Insert: {
          agency_id?: string | null
          deletion_type?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          user_email: string
          user_id: string
        }
        Update: {
          agency_id?: string | null
          deletion_type?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          user_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_deletion_requests_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          can_admin: boolean
          can_finance: boolean
          can_ops: boolean
          can_recurring: boolean
          can_sales: boolean
          created_at: string
          is_super_admin: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          can_admin?: boolean
          can_finance?: boolean
          can_ops?: boolean
          can_recurring?: boolean
          can_sales?: boolean
          created_at?: string
          is_super_admin?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          can_admin?: boolean
          can_finance?: boolean
          can_ops?: boolean
          can_recurring?: boolean
          can_sales?: boolean
          created_at?: string
          is_super_admin?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          agency_id: string | null
          created_at: string
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          notes: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          notes?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          notes?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      activities_last_30_days: {
        Row: {
          day: string | null
          total_activities: number | null
        }
        Relationships: []
      }
      agency_members_with_roles: {
        Row: {
          agency_id: string | null
          agency_name: string | null
          app_role: Database["public"]["Enums"]["app_role"] | null
          avatar_url: string | null
          created_at: string | null
          expires_at: string | null
          full_name: string | null
          id: string | null
          last_login: string | null
          member_role: string | null
          role_notes: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_members_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      client_commission_summary: {
        Row: {
          client_id: string | null
          client_name: string | null
          paid_amount: number | null
          pending_amount: number | null
          sale_value: number | null
          total_commission_amount: number | null
          total_commissions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_v2_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients_v2_expanded: {
        Row: {
          agency_id: string | null
          city: string | null
          company_name: string | null
          contact_name: string | null
          created_at: string | null
          custom_fields: Json | null
          deleted_at: string | null
          email: string | null
          end_date: string | null
          google_profile_url: string | null
          id: string | null
          invoices_count: number | null
          main_category: string | null
          monthly_value: number | null
          notes: string | null
          phone: string | null
          plan_name: string | null
          recurring_count: number | null
          responsible: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["client_status_v2"] | null
          tags: Json | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          agency_id?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          email?: string | null
          end_date?: string | null
          google_profile_url?: string | null
          id?: string | null
          invoices_count?: never
          main_category?: string | null
          monthly_value?: number | null
          notes?: string | null
          phone?: string | null
          plan_name?: string | null
          recurring_count?: never
          responsible?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["client_status_v2"] | null
          tags?: Json | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          agency_id?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          deleted_at?: string | null
          email?: string | null
          end_date?: string | null
          google_profile_url?: string | null
          id?: string | null
          invoices_count?: never
          main_category?: string | null
          monthly_value?: number | null
          notes?: string | null
          phone?: string | null
          plan_name?: string | null
          recurring_count?: never
          responsible?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["client_status_v2"] | null
          tags?: Json | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_v2_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_metrics_by_stage: {
        Row: {
          cold_leads: number | null
          hot_leads: number | null
          pipeline_stage:
            | Database["public"]["Enums"]["lead_pipeline_stage"]
            | null
          total_leads: number | null
          total_value: number | null
          warm_leads: number | null
        }
        Relationships: []
      }
      leads_expanded: {
        Row: {
          agency_id: string | null
          city: string | null
          company_name: string | null
          contact_name: string | null
          converted_at: string | null
          converted_client_id: string | null
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          email: string | null
          estimated_value: number | null
          id: string | null
          last_activity_at: string | null
          lost_notes: string | null
          lost_reason_id: string | null
          main_category: string | null
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          phone: string | null
          pipeline_stage:
            | Database["public"]["Enums"]["lead_pipeline_stage"]
            | null
          probability: number | null
          proposal_notes: string | null
          proposal_status: Database["public"]["Enums"]["proposal_status"] | null
          proposal_url: string | null
          responsible: string | null
          source_custom: string | null
          source_id: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          tags: Json | null
          temperature: Database["public"]["Enums"]["lead_temperature"] | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          agency_id?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          converted_at?: string | null
          converted_client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: never
          email?: string | null
          estimated_value?: number | null
          id?: string | null
          last_activity_at?: string | null
          lost_notes?: string | null
          lost_reason_id?: string | null
          main_category?: string | null
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_stage?:
            | Database["public"]["Enums"]["lead_pipeline_stage"]
            | null
          probability?: number | null
          proposal_notes?: string | null
          proposal_status?:
            | Database["public"]["Enums"]["proposal_status"]
            | null
          proposal_url?: string | null
          responsible?: string | null
          source_custom?: string | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          tags?: never
          temperature?: Database["public"]["Enums"]["lead_temperature"] | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          agency_id?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          converted_at?: string | null
          converted_client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: never
          email?: string | null
          estimated_value?: number | null
          id?: string | null
          last_activity_at?: string | null
          lost_notes?: string | null
          lost_reason_id?: string | null
          main_category?: string | null
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_stage?:
            | Database["public"]["Enums"]["lead_pipeline_stage"]
            | null
          probability?: number | null
          proposal_notes?: string | null
          proposal_status?:
            | Database["public"]["Enums"]["proposal_status"]
            | null
          proposal_url?: string | null
          responsible?: string | null
          source_custom?: string | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          tags?: never
          temperature?: Database["public"]["Enums"]["lead_temperature"] | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_lost_reason_id_fkey"
            columns: ["lost_reason_id"]
            isOneToOne: false
            referencedRelation: "lost_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks_summary_by_status: {
        Row: {
          status: Database["public"]["Enums"]["task_status"] | null
          total_tasks: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_client_recurring: {
        Args: {
          _amount: number
          _billing_cycle?: string
          _client_id: string
          _notes?: string
          _plan_name: string
          _start_date?: string
        }
        Returns: string
      }
      approve_agency: { Args: { _agency_id: string }; Returns: undefined }
      approve_registration: {
        Args: { _registration_id: string; _temp_password?: string }
        Returns: Json
      }
      assign_role: {
        Args: {
          _agency_id?: string
          _notes?: string
          _role: string
          _target_user_id: string
        }
        Returns: string
      }
      auto_overdue_tasks: { Args: never; Returns: number }
      build_suggestion_prompt: { Args: { _lead_id: string }; Returns: string }
      calculate_agency_usage: {
        Args: { _agency_id: string }
        Returns: {
          agency_id: string
          created_at: string
          current_clients: number
          current_leads: number
          current_recurring_clients: number
          current_users: number
          id: string
          last_calculated_at: string
          storage_used_mb: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "agency_usage"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      can: {
        Args: { _agency_id?: string; _permission: string; _user_id?: string }
        Returns: boolean
      }
      can_access_admin: { Args: { _user_id: string }; Returns: boolean }
      can_access_agency: {
        Args: { _agency_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_finance: { Args: { _user_id: string }; Returns: boolean }
      can_access_ops: { Args: { _user_id: string }; Returns: boolean }
      can_access_recurring: { Args: { _user_id: string }; Returns: boolean }
      can_access_sales: { Args: { _user_id: string }; Returns: boolean }
      cancel_client_recurring: {
        Args: { _client_id: string; _reason?: string }
        Returns: undefined
      }
      change_agency_plan: {
        Args: {
          _agency_id: string
          _new_plan_id: string
          _new_status?: string
          _reason?: string
        }
        Returns: undefined
      }
      check_limit: {
        Args: { _agency_id: string; _increment?: number; _resource: string }
        Returns: Json
      }
      check_notifications: { Args: never; Returns: Json }
      complete_task: { Args: { p_task_id: string }; Returns: boolean }
      count_clients_v2: {
        Args: {
          _custom_field_filters?: Json
          _responsible?: string
          _search?: string
          _start_date_from?: string
          _start_date_to?: string
          _status?: string
          _tags?: string[]
        }
        Returns: number
      }
      count_leads: {
        Args: {
          _custom_field_filters?: Json
          _pipeline_stage?: string
          _responsible?: string
          _search?: string
          _status?: string
          _tags?: string[]
          _temperature?: string
        }
        Returns: number
      }
      create_agency_with_owner: {
        Args: { _name: string; _owner_user_id: string; _slug: string }
        Returns: string
      }
      create_notification: {
        Args: {
          p_channel?: Database["public"]["Enums"]["notification_channel"]
          p_client_id?: string
          p_lead_id?: string
          p_message?: string
          p_metadata?: Json
          p_priority?: Database["public"]["Enums"]["notification_priority"]
          p_task_id?: string
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: string
      }
      create_trial_subscription: {
        Args: { _agency_id: string; _plan_slug?: string }
        Returns: string
      }
      current_agency_id: { Args: never; Returns: string }
      dashboard_summary: { Args: never; Returns: Json }
      decrypt_sensitive_data: {
        Args: { _encrypted: string; _key?: string }
        Returns: string
      }
      delete_lead: { Args: { _lead_id: string }; Returns: undefined }
      detect_suspicious_logins: {
        Args: { _user_id: string; _window_minutes?: number }
        Returns: {
          is_suspicious: boolean
          reason: string
          recent_ips: string[]
        }[]
      }
      encrypt_sensitive_data: {
        Args: { _data: string; _key?: string }
        Returns: string
      }
      exit_impersonate: { Args: never; Returns: undefined }
      export_clients_v2: {
        Args: { _search?: string; _status?: string; _tags?: string[] }
        Returns: {
          city: string
          company_name: string
          contact_name: string
          created_at: string
          custom_fields: Json
          email: string
          end_date: string
          id: string
          monthly_value: number
          notes: string
          phone: string
          plan_name: string
          responsible: string
          start_date: string
          status: string
          tags: string
          updated_at: string
          whatsapp: string
        }[]
      }
      export_leads: {
        Args: {
          _pipeline_stage?: string
          _search?: string
          _status?: string
          _tags?: string[]
          _temperature?: string
        }
        Returns: {
          city: string
          company_name: string
          contact_name: string
          created_at: string
          custom_fields: Json
          email: string
          estimated_value: number
          id: string
          notes: string
          phone: string
          pipeline_stage: string
          responsible: string
          status: string
          tags: string
          temperature: string
          updated_at: string
          whatsapp: string
        }[]
      }
      generate_invoice_number: { Args: { _agency_id: string }; Returns: string }
      generate_lead_summary: { Args: { _lead_id: string }; Returns: string }
      generate_manual_invoice: {
        Args: {
          _amount: number
          _client_id: string
          _description?: string
          _due_date: string
          _notes?: string
        }
        Returns: string
      }
      get_agency_features: { Args: { _agency_id: string }; Returns: Json }
      get_all_agencies_with_stats: {
        Args: never
        Returns: {
          clients_count: number
          created_at: string
          id: string
          leads_count: number
          members_count: number
          name: string
          slug: string
          status: string
          updated_at: string
        }[]
      }
      get_pending_registrations: {
        Args: never
        Returns: {
          agency_name: string
          agency_slug: string
          created_at: string
          id: string
          owner_email: string
          owner_name: string
          owner_phone: string
          status: string
        }[]
      }
      get_super_admin_logs: {
        Args: { _limit?: number }
        Returns: {
          action: string
          agency_id: string
          agency_name: string
          created_at: string
          id: string
          metadata: Json
          super_admin_name: string
          super_admin_user_id: string
        }[]
      }
      get_unread_notification_count: { Args: never; Returns: number }
      get_user_role: {
        Args: { _agency_id: string; _user_id: string }
        Returns: string
      }
      has_active_consent: {
        Args: { _min_version?: string; _policy_type?: string; _user_id: string }
        Returns: boolean
      }
      has_agency_role: {
        Args: { _agency_id: string; _role: string; _user_id: string }
        Returns: boolean
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | {
            Args: { _agency_id?: string; _role: string; _user_id: string }
            Returns: boolean
          }
      impersonate_agency: { Args: { _agency_id: string }; Returns: undefined }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_admin_or_owner: {
        Args: { _agency_id?: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      log_action: {
        Args: {
          _action_type: string
          _entity_id?: string
          _entity_name?: string
          _entity_type: string
          _metadata?: Json
          _new_value?: Json
          _old_value?: Json
        }
        Returns: string
      }
      log_lead_activity: {
        Args: {
          p_content: string
          p_lead_id: string
          p_link?: string
          p_notes?: string
          p_type: Database["public"]["Enums"]["lead_activity_type"]
        }
        Returns: string
      }
      log_lead_message: {
        Args: {
          _is_private?: boolean
          _lead_id: string
          _message: string
          _message_type?: string
        }
        Returns: string
      }
      log_limit_abuse: {
        Args: {
          _agency_id: string
          _attempted_count: number
          _limit: number
          _resource: string
          _user_id: string
        }
        Returns: string
      }
      log_login_event: {
        Args: {
          _failure_reason?: string
          _ip_address?: string
          _success: boolean
          _user_agent?: string
        }
        Returns: string
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_invoice_paid: {
        Args: {
          _invoice_id: string
          _paid_amount?: number
          _payment_method?: string
        }
        Returns: undefined
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      my_role: { Args: { _agency_id?: string }; Returns: string }
      queue_email: {
        Args: {
          p_body_html?: string
          p_body_text?: string
          p_notification_id?: string
          p_recipient_email: string
          p_recipient_name?: string
          p_scheduled_for?: string
          p_subject: string
          p_template_data?: Json
          p_template_id?: string
        }
        Returns: string
      }
      reactivate_agency: { Args: { _agency_id: string }; Returns: undefined }
      reject_registration: {
        Args: { _reason?: string; _registration_id: string }
        Returns: undefined
      }
      request_user_deletion: {
        Args: { _deletion_type?: string; _notes?: string; _user_id: string }
        Returns: string
      }
      save_ai_interaction: {
        Args: {
          _ai_response: string
          _interaction_type: string
          _lead_id: string
          _metadata?: Json
          _model?: string
          _prompt: string
          _tokens_used?: number
        }
        Returns: string
      }
      search_clients_v2: {
        Args: {
          _custom_field_filters?: Json
          _limit?: number
          _offset?: number
          _responsible?: string
          _search?: string
          _start_date_from?: string
          _start_date_to?: string
          _status?: string
          _tags?: string[]
        }
        Returns: {
          city: string
          company_name: string
          contact_name: string
          created_at: string
          custom_fields: Json
          email: string
          end_date: string
          id: string
          monthly_value: number
          notes: string
          phone: string
          plan_name: string
          responsible: string
          start_date: string
          status: Database["public"]["Enums"]["client_status_v2"]
          tags: Json
          updated_at: string
          whatsapp: string
        }[]
      }
      search_leads: {
        Args: {
          _custom_field_filters?: Json
          _limit?: number
          _offset?: number
          _pipeline_stage?: string
          _responsible?: string
          _search?: string
          _status?: string
          _tags?: string[]
          _temperature?: string
        }
        Returns: {
          company_name: string
          contact_name: string
          created_at: string
          custom_fields: Json
          email: string
          estimated_value: number
          id: string
          next_action: string
          next_action_date: string
          phone: string
          pipeline_stage: Database["public"]["Enums"]["lead_pipeline_stage"]
          responsible: string
          status: Database["public"]["Enums"]["lead_status"]
          tags: Json
          temperature: Database["public"]["Enums"]["lead_temperature"]
          updated_at: string
          whatsapp: string
        }[]
      }
      set_current_agency: { Args: { _agency_id: string }; Returns: undefined }
      suggest_next_task: { Args: { p_lead_id: string }; Returns: Json }
      suspend_agency: { Args: { _agency_id: string }; Returns: undefined }
      sync_agency_limits_from_plan: {
        Args: { _agency_id: string }
        Returns: undefined
      }
      tenant_healthcheck: {
        Args: never
        Returns: {
          force_rls: boolean
          null_agency_id_rows: number
          policies_count: number
          rls_enabled: boolean
          tbl_name: string
        }[]
      }
      try_uuid: { Args: { _val: string }; Returns: string }
      update_expired_subscriptions: { Args: never; Returns: number }
    }
    Enums: {
      app_role:
        | "admin"
        | "operador"
        | "visualizador"
        | "super_admin"
        | "owner"
        | "manager"
        | "sales_rep"
        | "support"
      client_status: "on_track" | "delayed" | "pending_client"
      client_status_v2: "active" | "paused" | "cancelled"
      column_id:
        | "pipeline"
        | "onboarding"
        | "optimization"
        | "ready_to_deliver"
        | "delivered"
        | "suspended"
        | "finalized"
      commission_payment_status: "pending" | "approved" | "paid" | "cancelled"
      commission_recipient_type:
        | "sdr"
        | "seller"
        | "photographer"
        | "operational"
        | "designer"
        | "freelancer"
      commission_status: "pending" | "paid" | "cancelled"
      invoice_status: "draft" | "pending" | "paid" | "overdue" | "cancelled"
      lead_activity_type:
        | "whatsapp"
        | "call"
        | "meeting"
        | "note"
        | "follow_up"
        | "proposal"
        | "email"
      lead_pipeline_stage:
        | "cold"
        | "contacted"
        | "qualified"
        | "meeting_scheduled"
        | "meeting_done"
        | "proposal_sent"
        | "negotiating"
        | "future"
        | "gained"
        | "lost"
      lead_status: "open" | "gained" | "lost" | "future"
      lead_temperature: "cold" | "warm" | "hot"
      notification_channel: "in_app" | "email" | "push" | "sms"
      notification_priority: "low" | "normal" | "high" | "urgent"
      notification_type:
        | "task_due"
        | "task_overdue"
        | "lead_stale"
        | "lead_activity"
        | "ai_insight"
        | "team_mention"
        | "system"
        | "reminder"
      photo_mode: "with_photos" | "without_photos" | "pending"
      plan_type: "unique" | "recurring"
      proposal_status:
        | "not_sent"
        | "sent"
        | "reviewing"
        | "approved"
        | "rejected"
      question_status: "pending" | "answered" | "resolved"
      recurring_status: "active" | "paused" | "cancelled" | "completed"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "pending" | "completed" | "overdue" | "cancelled"
      user_role:
        | "super_admin"
        | "owner"
        | "manager"
        | "sales_rep"
        | "operator"
        | "support"
        | "viewer"
      user_status: "ativo" | "suspenso" | "excluido"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "operador",
        "visualizador",
        "super_admin",
        "owner",
        "manager",
        "sales_rep",
        "support",
      ],
      client_status: ["on_track", "delayed", "pending_client"],
      client_status_v2: ["active", "paused", "cancelled"],
      column_id: [
        "pipeline",
        "onboarding",
        "optimization",
        "ready_to_deliver",
        "delivered",
        "suspended",
        "finalized",
      ],
      commission_payment_status: ["pending", "approved", "paid", "cancelled"],
      commission_recipient_type: [
        "sdr",
        "seller",
        "photographer",
        "operational",
        "designer",
        "freelancer",
      ],
      commission_status: ["pending", "paid", "cancelled"],
      invoice_status: ["draft", "pending", "paid", "overdue", "cancelled"],
      lead_activity_type: [
        "whatsapp",
        "call",
        "meeting",
        "note",
        "follow_up",
        "proposal",
        "email",
      ],
      lead_pipeline_stage: [
        "cold",
        "contacted",
        "qualified",
        "meeting_scheduled",
        "meeting_done",
        "proposal_sent",
        "negotiating",
        "future",
        "gained",
        "lost",
      ],
      lead_status: ["open", "gained", "lost", "future"],
      lead_temperature: ["cold", "warm", "hot"],
      notification_channel: ["in_app", "email", "push", "sms"],
      notification_priority: ["low", "normal", "high", "urgent"],
      notification_type: [
        "task_due",
        "task_overdue",
        "lead_stale",
        "lead_activity",
        "ai_insight",
        "team_mention",
        "system",
        "reminder",
      ],
      photo_mode: ["with_photos", "without_photos", "pending"],
      plan_type: ["unique", "recurring"],
      proposal_status: [
        "not_sent",
        "sent",
        "reviewing",
        "approved",
        "rejected",
      ],
      question_status: ["pending", "answered", "resolved"],
      recurring_status: ["active", "paused", "cancelled", "completed"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["pending", "completed", "overdue", "cancelled"],
      user_role: [
        "super_admin",
        "owner",
        "manager",
        "sales_rep",
        "operator",
        "support",
        "viewer",
      ],
      user_status: ["ativo", "suspenso", "excluido"],
    },
  },
} as const

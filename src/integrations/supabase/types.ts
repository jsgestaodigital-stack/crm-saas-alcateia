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
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
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
            foreignKeyName: "commissions_v2_recipient_role_id_fkey"
            columns: ["recipient_role_id"]
            isOneToOne: false
            referencedRelation: "commission_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          agency_id: string
          content: string
          created_at: string
          created_by: string
          created_by_name: string
          id: string
          lead_id: string
          link: string | null
          type: Database["public"]["Enums"]["lead_activity_type"]
        }
        Insert: {
          agency_id?: string
          content: string
          created_at?: string
          created_by: string
          created_by_name: string
          id?: string
          lead_id: string
          link?: string | null
          type: Database["public"]["Enums"]["lead_activity_type"]
        }
        Update: {
          agency_id?: string
          content?: string
          created_at?: string
          created_by?: string
          created_by_name?: string
          id?: string
          lead_id?: string
          link?: string | null
          type?: Database["public"]["Enums"]["lead_activity_type"]
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
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
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
    }
    Functions: {
      can_access_admin: { Args: { _user_id: string }; Returns: boolean }
      can_access_agency: {
        Args: { _agency_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_finance: { Args: { _user_id: string }; Returns: boolean }
      can_access_ops: { Args: { _user_id: string }; Returns: boolean }
      can_access_recurring: { Args: { _user_id: string }; Returns: boolean }
      can_access_sales: { Args: { _user_id: string }; Returns: boolean }
      create_agency_with_owner: {
        Args: { _name: string; _owner_user_id: string; _slug: string }
        Returns: string
      }
      current_agency_id: { Args: never; Returns: string }
      delete_lead: { Args: { _lead_id: string }; Returns: undefined }
      has_agency_role: {
        Args: { _agency_id: string; _role: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      set_current_agency: { Args: { _agency_id: string }; Returns: undefined }
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
    }
    Enums: {
      app_role: "admin" | "operador" | "visualizador"
      client_status: "on_track" | "delayed" | "pending_client"
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
      photo_mode: "with_photos" | "without_photos" | "pending"
      plan_type: "unique" | "recurring"
      proposal_status:
        | "not_sent"
        | "sent"
        | "reviewing"
        | "approved"
        | "rejected"
      question_status: "pending" | "answered" | "resolved"
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
      app_role: ["admin", "operador", "visualizador"],
      client_status: ["on_track", "delayed", "pending_client"],
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
      user_status: ["ativo", "suspenso", "excluido"],
    },
  },
} as const

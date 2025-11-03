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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_configurations: {
        Row: {
          api_key: string
          api_name: Database["public"]["Enums"]["api_name"]
          created_at: string
          endpoint_url: string
          fallback_api: string | null
          id: string
          is_active: boolean
          last_health_check: string | null
          priority: number
          rate_limit: number
          timeout: number
        }
        Insert: {
          api_key: string
          api_name: Database["public"]["Enums"]["api_name"]
          created_at?: string
          endpoint_url: string
          fallback_api?: string | null
          id?: string
          is_active?: boolean
          last_health_check?: string | null
          priority?: number
          rate_limit?: number
          timeout?: number
        }
        Update: {
          api_key?: string
          api_name?: Database["public"]["Enums"]["api_name"]
          created_at?: string
          endpoint_url?: string
          fallback_api?: string | null
          id?: string
          is_active?: boolean
          last_health_check?: string | null
          priority?: number
          rate_limit?: number
          timeout?: number
        }
        Relationships: []
      }
      attachment_capture_jobs: {
        Row: {
          captured_attachments: number | null
          cnj_number: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          started_at: string | null
          status: string
          total_attachments: number | null
          user_id: string
        }
        Insert: {
          captured_attachments?: number | null
          cnj_number: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          started_at?: string | null
          status?: string
          total_attachments?: number | null
          user_id: string
        }
        Update: {
          captured_attachments?: number | null
          cnj_number?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          started_at?: string | null
          status?: string
          total_attachments?: number | null
          user_id?: string
        }
        Relationships: []
      }
      credentials_vault: {
        Row: {
          created_at: string
          credential_type: Database["public"]["Enums"]["credential_type"]
          encrypted_credentials: string
          id: string
          last_used: string | null
          status: Database["public"]["Enums"]["credential_status"]
          tribunal: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_type: Database["public"]["Enums"]["credential_type"]
          encrypted_credentials: string
          id?: string
          last_used?: string | null
          status?: Database["public"]["Enums"]["credential_status"]
          tribunal: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_type?: Database["public"]["Enums"]["credential_type"]
          encrypted_credentials?: string
          id?: string
          last_used?: string | null
          status?: Database["public"]["Enums"]["credential_status"]
          tribunal?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credentials_vault_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          cost_in_reais: number
          created_at: string
          credits_amount: number
          description: string | null
          id: string
          operation_type: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          cost_in_reais: number
          created_at?: string
          credits_amount: number
          description?: string | null
          id?: string
          operation_type?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          cost_in_reais?: number
          created_at?: string
          credits_amount?: number
          description?: string | null
          id?: string
          operation_type?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credits_plans: {
        Row: {
          created_at: string
          credit_cost: number
          credits_balance: number
          id: string
          next_billing_date: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_cost?: number
          credits_balance?: number
          id?: string
          next_billing_date?: string | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credit_cost?: number
          credits_balance?: number
          id?: string
          next_billing_date?: string | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      criminal_records: {
        Row: {
          cpf: string
          created_at: string
          criminal_executions: Json | null
          has_active_warrants: boolean | null
          id: string
          last_update: string
          warrants: Json | null
        }
        Insert: {
          cpf: string
          created_at?: string
          criminal_executions?: Json | null
          has_active_warrants?: boolean | null
          id?: string
          last_update?: string
          warrants?: Json | null
        }
        Update: {
          cpf?: string
          created_at?: string
          criminal_executions?: Json | null
          has_active_warrants?: boolean | null
          id?: string
          last_update?: string
          warrants?: Json | null
        }
        Relationships: []
      }
      diarios_oficiais_cache: {
        Row: {
          created_at: string
          id: string
          last_update: string
          results: Json | null
          results_count: number | null
          search_term: string
          search_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_update?: string
          results?: Json | null
          results_count?: number | null
          search_term: string
          search_type: string
        }
        Update: {
          created_at?: string
          id?: string
          last_update?: string
          results?: Json | null
          results_count?: number | null
          search_term?: string
          search_type?: string
        }
        Relationships: []
      }
      edge_function_config: {
        Row: {
          api_priority: Json
          enabled_apis: Json
          fallback_enabled: boolean
          function_name: string
          id: string
          status: Database["public"]["Enums"]["function_status"]
          updated_at: string
        }
        Insert: {
          api_priority?: Json
          enabled_apis?: Json
          fallback_enabled?: boolean
          function_name: string
          id?: string
          status?: Database["public"]["Enums"]["function_status"]
          updated_at?: string
        }
        Update: {
          api_priority?: Json
          enabled_apis?: Json
          fallback_enabled?: boolean
          function_name?: string
          id?: string
          status?: Database["public"]["Enums"]["function_status"]
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          parent_message_id: string | null
          receiver_id: string
          sender_id: string
          subject: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          parent_message_id?: string | null
          receiver_id: string
          sender_id: string
          subject: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          parent_message_id?: string | null
          receiver_id?: string
          sender_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_alerts: {
        Row: {
          alert_data: Json | null
          alert_type: string
          created_at: string
          id: string
          is_read: boolean
          monitoring_id: string
        }
        Insert: {
          alert_data?: Json | null
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean
          monitoring_id: string
        }
        Update: {
          alert_data?: Json | null
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          monitoring_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_alerts_monitoring_id_fkey"
            columns: ["monitoring_id"]
            isOneToOne: false
            referencedRelation: "monitorings"
            referencedColumns: ["id"]
          },
        ]
      }
      monitorings: {
        Row: {
          alerts_count: number
          api_provider: Database["public"]["Enums"]["api_name"] | null
          callback_url: string | null
          created_at: string
          frequency: Database["public"]["Enums"]["monitoring_frequency"]
          id: string
          last_check: string | null
          last_notification_at: string | null
          monitoring_type: Database["public"]["Enums"]["search_type"]
          monitoring_value: string
          next_check: string | null
          process_id: string | null
          status: Database["public"]["Enums"]["monitoring_status"]
          tracking_id: string | null
          user_id: string
        }
        Insert: {
          alerts_count?: number
          api_provider?: Database["public"]["Enums"]["api_name"] | null
          callback_url?: string | null
          created_at?: string
          frequency?: Database["public"]["Enums"]["monitoring_frequency"]
          id?: string
          last_check?: string | null
          last_notification_at?: string | null
          monitoring_type: Database["public"]["Enums"]["search_type"]
          monitoring_value: string
          next_check?: string | null
          process_id?: string | null
          status?: Database["public"]["Enums"]["monitoring_status"]
          tracking_id?: string | null
          user_id: string
        }
        Update: {
          alerts_count?: number
          api_provider?: Database["public"]["Enums"]["api_name"] | null
          callback_url?: string | null
          created_at?: string
          frequency?: Database["public"]["Enums"]["monitoring_frequency"]
          id?: string
          last_check?: string | null
          last_notification_at?: string | null
          monitoring_type?: Database["public"]["Enums"]["search_type"]
          monitoring_value?: string
          next_check?: string | null
          process_id?: string | null
          status?: Database["public"]["Enums"]["monitoring_status"]
          tracking_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitorings_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitorings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          link_to: string | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          link_to?: string | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link_to?: string | null
          notification_type?: Database["public"]["Enums"]["notification_type"]
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      process_attachments: {
        Row: {
          attachment_name: string
          attachment_type: string | null
          created_at: string
          download_cost_credits: number | null
          file_size: number | null
          file_url: string | null
          filing_date: string | null
          id: string
          process_id: string
        }
        Insert: {
          attachment_name: string
          attachment_type?: string | null
          created_at?: string
          download_cost_credits?: number | null
          file_size?: number | null
          file_url?: string | null
          filing_date?: string | null
          id?: string
          process_id: string
        }
        Update: {
          attachment_name?: string
          attachment_type?: string | null
          created_at?: string
          download_cost_credits?: number | null
          file_size?: number | null
          file_url?: string | null
          filing_date?: string | null
          id?: string
          process_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_attachments_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_movements: {
        Row: {
          created_at: string
          description: string
          id: string
          movement_date: string
          movement_type: string | null
          process_id: string
          tribunal_source: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          movement_date: string
          movement_type?: string | null
          process_id: string
          tribunal_source?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          movement_date?: string
          movement_type?: string | null
          process_id?: string
          tribunal_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_movements_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          author_names: Json | null
          case_value: number | null
          cnj_number: string
          court_name: string | null
          created_at: string
          defendant_names: Json | null
          distribution_date: string | null
          id: string
          judge_name: string | null
          last_searched_by: string | null
          last_update: string
          parties_cpf_cnpj: Json | null
          phase: string | null
          search_count: number | null
          source_api: Database["public"]["Enums"]["api_name"] | null
          status: string | null
          tribunal: string
        }
        Insert: {
          author_names?: Json | null
          case_value?: number | null
          cnj_number: string
          court_name?: string | null
          created_at?: string
          defendant_names?: Json | null
          distribution_date?: string | null
          id?: string
          judge_name?: string | null
          last_searched_by?: string | null
          last_update?: string
          parties_cpf_cnpj?: Json | null
          phase?: string | null
          search_count?: number | null
          source_api?: Database["public"]["Enums"]["api_name"] | null
          status?: string | null
          tribunal: string
        }
        Update: {
          author_names?: Json | null
          case_value?: number | null
          cnj_number?: string
          court_name?: string | null
          created_at?: string
          defendant_names?: Json | null
          distribution_date?: string | null
          id?: string
          judge_name?: string | null
          last_searched_by?: string | null
          last_update?: string
          parties_cpf_cnpj?: Json | null
          phase?: string | null
          search_count?: number | null
          source_api?: Database["public"]["Enums"]["api_name"] | null
          status?: string | null
          tribunal?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf_cnpj: string
          created_at: string
          full_name: string
          id: string
          oab_number: string | null
          phone: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          cpf_cnpj: string
          created_at?: string
          full_name: string
          id: string
          oab_number?: string | null
          phone?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          cpf_cnpj?: string
          created_at?: string
          full_name?: string
          id?: string
          oab_number?: string | null
          phone?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      registration_data: {
        Row: {
          additional_data: Json | null
          addresses: Json | null
          contacts: Json | null
          created_at: string
          document: string
          document_type: string
          full_name: string | null
          id: string
          last_update: string
          registration_status: string | null
        }
        Insert: {
          additional_data?: Json | null
          addresses?: Json | null
          contacts?: Json | null
          created_at?: string
          document: string
          document_type: string
          full_name?: string | null
          id?: string
          last_update?: string
          registration_status?: string | null
        }
        Update: {
          additional_data?: Json | null
          addresses?: Json | null
          contacts?: Json | null
          created_at?: string
          document?: string
          document_type?: string
          full_name?: string | null
          id?: string
          last_update?: string
          registration_status?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          log_type: Database["public"]["Enums"]["log_type"]
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          log_type: Database["public"]["Enums"]["log_type"]
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          log_type?: Database["public"]["Enums"]["log_type"]
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_processes: {
        Row: {
          access_cost_credits: number
          added_at: string
          id: string
          process_id: string
          user_id: string
        }
        Insert: {
          access_cost_credits?: number
          added_at?: string
          id?: string
          process_id: string
          user_id: string
        }
        Update: {
          access_cost_credits?: number
          added_at?: string
          id?: string
          process_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_processes_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_processes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_searches: {
        Row: {
          api_used: Database["public"]["Enums"]["api_name"] | null
          created_at: string
          credits_consumed: number
          from_cache: boolean | null
          id: string
          response_time_ms: number | null
          results_count: number
          search_type: Database["public"]["Enums"]["search_type"]
          search_value: string
          user_id: string
        }
        Insert: {
          api_used?: Database["public"]["Enums"]["api_name"] | null
          created_at?: string
          credits_consumed: number
          from_cache?: boolean | null
          id?: string
          response_time_ms?: number | null
          results_count?: number
          search_type: Database["public"]["Enums"]["search_type"]
          search_value: string
          user_id: string
        }
        Update: {
          api_used?: Database["public"]["Enums"]["api_name"] | null
          created_at?: string
          credits_consumed?: number
          from_cache?: boolean | null
          id?: string
          response_time_ms?: number | null
          results_count?: number
          search_type?: Database["public"]["Enums"]["search_type"]
          search_value?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      api_name: "judit" | "escavador"
      app_role: "admin" | "moderator" | "user"
      credential_status: "active" | "inactive" | "expired"
      credential_type: "password" | "certificate"
      function_status: "active" | "inactive"
      log_type: "api_call" | "user_action" | "error" | "admin_action"
      monitoring_frequency: "daily" | "weekly"
      monitoring_status: "active" | "paused" | "error"
      notification_type: "monitoring" | "system" | "message"
      plan_type: "prepaid" | "plus" | "pro"
      search_type: "cpf" | "cnpj" | "oab" | "cnj"
      subscription_status: "active" | "canceled" | "expired"
      transaction_type: "purchase" | "consumption" | "refund"
      user_type: "user" | "lawyer" | "admin"
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
      api_name: ["judit", "escavador"],
      app_role: ["admin", "moderator", "user"],
      credential_status: ["active", "inactive", "expired"],
      credential_type: ["password", "certificate"],
      function_status: ["active", "inactive"],
      log_type: ["api_call", "user_action", "error", "admin_action"],
      monitoring_frequency: ["daily", "weekly"],
      monitoring_status: ["active", "paused", "error"],
      notification_type: ["monitoring", "system", "message"],
      plan_type: ["prepaid", "plus", "pro"],
      search_type: ["cpf", "cnpj", "oab", "cnj"],
      subscription_status: ["active", "canceled", "expired"],
      transaction_type: ["purchase", "consumption", "refund"],
      user_type: ["user", "lawyer", "admin"],
    },
  },
} as const

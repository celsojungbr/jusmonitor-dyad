export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_type: 'user' | 'lawyer' | 'admin'
          full_name: string
          oab_number: string | null
          cpf_cnpj: string
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_type?: 'user' | 'lawyer' | 'admin'
          full_name: string
          oab_number?: string | null
          cpf_cnpj: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_type?: 'user' | 'lawyer' | 'admin'
          full_name?: string
          oab_number?: string | null
          cpf_cnpj?: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      credits_plans: {
        Row: {
          id: string
          user_id: string
          plan_type: 'prepaid' | 'plus' | 'pro'
          credits_balance: number
          credit_cost: number
          subscription_status: 'active' | 'canceled' | 'expired'
          next_billing_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_type?: 'prepaid' | 'plus' | 'pro'
          credits_balance?: number
          credit_cost?: number
          subscription_status?: 'active' | 'canceled' | 'expired'
          next_billing_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_type?: 'prepaid' | 'plus' | 'pro'
          credits_balance?: number
          credit_cost?: number
          subscription_status?: 'active' | 'canceled' | 'expired'
          next_billing_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      processes: {
        Row: {
          id: string
          cnj_number: string
          tribunal: string
          distribution_date: string | null
          status: string | null
          case_value: number | null
          judge_name: string | null
          court_name: string | null
          phase: string | null
          author_names: string[]
          defendant_names: string[]
          parties_cpf_cnpj: string[]
          last_update: string
          created_at: string
        }
        Insert: {
          id?: string
          cnj_number: string
          tribunal: string
          distribution_date?: string | null
          status?: string | null
          case_value?: number | null
          judge_name?: string | null
          court_name?: string | null
          phase?: string | null
          author_names?: string[]
          defendant_names?: string[]
          parties_cpf_cnpj?: string[]
          last_update?: string
          created_at?: string
        }
        Update: {
          id?: string
          cnj_number?: string
          tribunal?: string
          distribution_date?: string | null
          status?: string | null
          case_value?: number | null
          judge_name?: string | null
          court_name?: string | null
          phase?: string | null
          author_names?: string[]
          defendant_names?: string[]
          parties_cpf_cnpj?: string[]
          last_update?: string
          created_at?: string
        }
        Relationships: []
      }
      process_movements: {
        Row: {
          id: string
          process_id: string
          movement_date: string
          movement_type: string
          description: string
          tribunal_source: string
          created_at: string
        }
        Insert: {
          id?: string
          process_id: string
          movement_date: string
          movement_type: string
          description: string
          tribunal_source: string
          created_at?: string
        }
        Update: {
          id?: string
          process_id?: string
          movement_date?: string
          movement_type?: string
          description?: string
          tribunal_source?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_movements_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          }
        ]
      }
      process_attachments: {
        Row: {
          id: string
          process_id: string
          attachment_name: string
          attachment_type: string
          file_url: string
          file_size: number
          filing_date: string
          download_cost_credits: number
          created_at: string
        }
        Insert: {
          id?: string
          process_id: string
          attachment_name: string
          attachment_type: string
          file_url: string
          file_size: number
          filing_date: string
          download_cost_credits?: number
          created_at?: string
        }
        Update: {
          id?: string
          process_id?: string
          attachment_name?: string
          attachment_type?: string
          file_url?: string
          file_size?: number
          filing_date?: string
          download_cost_credits?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_attachments_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          }
        ]
      }
      user_searches: {
        Row: {
          id: string
          user_id: string
          search_type: 'cpf' | 'cnpj' | 'oab' | 'cnj'
          search_value: string
          credits_consumed: number
          results_count: number
          from_cache: boolean
          api_used: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          search_type: 'cpf' | 'cnpj' | 'oab' | 'cnj'
          search_value: string
          credits_consumed?: number
          results_count?: number
          from_cache?: boolean
          api_used?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          search_type?: 'cpf' | 'cnpj' | 'oab' | 'cnj'
          search_value?: string
          credits_consumed?: number
          results_count?: number
          from_cache?: boolean
          api_used?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_processes: {
        Row: {
          id: string
          user_id: string
          process_id: string
          added_at: string
          access_cost_credits: number
        }
        Insert: {
          id?: string
          user_id: string
          process_id: string
          added_at?: string
          access_cost_credits?: number
        }
        Update: {
          id?: string
          user_id?: string
          process_id?: string
          added_at?: string
          access_cost_credits?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_processes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_processes_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          }
        ]
      }
      monitorings: {
        Row: {
          id: string
          user_id: string
          monitoring_type: 'cpf' | 'cnpj' | 'oab' | 'cnj'
          monitoring_value: string
          process_id: string | null
          frequency: 'daily' | 'weekly'
          status: 'active' | 'paused' | 'error'
          last_check: string | null
          next_check: string | null
          alerts_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          monitoring_type: 'cpf' | 'cnpj' | 'oab' | 'cnj'
          monitoring_value: string
          process_id?: string | null
          frequency?: 'daily' | 'weekly'
          status?: 'active' | 'paused' | 'error'
          last_check?: string | null
          next_check?: string | null
          alerts_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          monitoring_type?: 'cpf' | 'cnpj' | 'oab' | 'cnj'
          monitoring_value?: string
          process_id?: string | null
          frequency?: 'daily' | 'weekly'
          status?: 'active' | 'paused' | 'error'
          last_check?: string | null
          next_check?: string | null
          alerts_count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitorings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitorings_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          }
        ]
      }
      monitoring_alerts: {
        Row: {
          id: string
          monitoring_id: string
          alert_type: string
          alert_data: Json
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          monitoring_id: string
          alert_type: string
          alert_data: Json
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          monitoring_id?: string
          alert_type?: string
          alert_data?: Json
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_alerts_monitoring_id_fkey"
            columns: ["monitoring_id"]
            isOneToOne: false
            referencedRelation: "monitorings"
            referencedColumns: ["id"]
          }
        ]
      }
      credential_vault: {
        Row: {
          id: string
          user_id: string
          tribunal: string
          credential_type: 'password' | 'certificate'
          encrypted_credentials: string
          status: 'active' | 'inactive' | 'expired'
          last_used: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tribunal: string
          credential_type: 'password' | 'certificate'
          encrypted_credentials: string
          status?: 'active' | 'inactive' | 'expired'
          last_used?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tribunal?: string
          credential_type?: 'password' | 'certificate'
          encrypted_credentials?: string
          status?: 'active' | 'inactive' | 'expired'
          last_used?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credential_vault_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          transaction_type: 'purchase' | 'consumption' | 'refund'
          operation_type: string
          credits_amount: number
          cost_in_reais: number
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_type: 'purchase' | 'consumption' | 'refund'
          operation_type: string
          credits_amount: number
          cost_in_reais: number
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_type?: 'purchase' | 'consumption' | 'refund'
          operation_type?: string
          credits_amount?: number
          cost_in_reais?: number
          description?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      api_configuration: {
        Row: {
          id: string
          api_name: 'judit' | 'escavador'
          api_key: string
          endpoint_url: string
          is_active: boolean
          priority: number
          rate_limit: number
          timeout: number
          fallback_api: string | null
          last_health_check: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          api_name: 'judit' | 'escavador'
          api_key: string
          endpoint_url: string
          is_active?: boolean
          priority?: number
          rate_limit?: number
          timeout?: number
          fallback_api?: string | null
          last_health_check?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          api_name?: 'judit' | 'escavador'
          api_key?: string
          endpoint_url?: string
          is_active?: boolean
          priority?: number
          rate_limit?: number
          timeout?: number
          fallback_api?: string | null
          last_health_check?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      edge_function_config: {
        Row: {
          id: string
          function_name: string
          enabled_apis: string[]
          api_priority: string[]
          fallback_enabled: boolean
          status: 'active' | 'inactive'
          updated_at: string
        }
        Insert: {
          id?: string
          function_name: string
          enabled_apis?: string[]
          api_priority?: string[]
          fallback_enabled?: boolean
          status?: 'active' | 'inactive'
          updated_at?: string
        }
        Update: {
          id?: string
          function_name?: string
          enabled_apis?: string[]
          api_priority?: string[]
          fallback_enabled?: boolean
          status?: 'active' | 'inactive'
          updated_at?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          id: string
          log_type: 'api_call' | 'user_action' | 'error' | 'admin_action'
          user_id: string | null
          action: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          log_type: 'api_call' | 'user_action' | 'error' | 'admin_action'
          user_id?: string | null
          action: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          log_type?: 'api_call' | 'user_action' | 'error' | 'admin_action'
          user_id?: string | null
          action?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          notification_type: 'monitoring' | 'system' | 'message'
          title: string
          content: string
          is_read: boolean
          link_to: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          notification_type: 'monitoring' | 'system' | 'message'
          title: string
          content: string
          is_read?: boolean
          link_to?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          notification_type?: 'monitoring' | 'system' | 'message'
          title?: string
          content?: string
          is_read?: boolean
          link_to?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          subject: string
          content: string
          is_read: boolean
          parent_message_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          subject: string
          content: string
          is_read?: boolean
          parent_message_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          subject?: string
          content?: string
          is_read?: boolean
          parent_message_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      pricing_config: {
        Row: {
          id: string
          operation_name: string
          credits_cost: number
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          operation_name: string
          credits_cost: number
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          operation_name?: string
          credits_cost?: number
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          id: string
          plan_name: string
          plan_type: 'prepaid' | 'plus' | 'pro'
          credit_price: number
          monthly_price: number | null
          included_credits: number
          can_recharge: boolean
          description: string | null
          features: string[] | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plan_name: string
          plan_type: 'prepaid' | 'plus' | 'pro'
          credit_price: number
          monthly_price?: number | null
          included_credits?: number
          can_recharge?: boolean
          description?: string | null
          features?: string[] | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plan_name?: string
          plan_type?: 'prepaid' | 'plus' | 'pro'
          credit_price?: number
          monthly_price?: number | null
          included_credits?: number
          can_recharge?: boolean
          description?: string | null
          features?: string[] | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          id: string
          promotion_name: string
          promotion_type: 'discount_percentage' | 'discount_fixed' | 'bonus_credits' | 'free_trial'
          description: string | null
          discount_percentage: number | null
          discount_fixed: number | null
          bonus_credits: number | null
          applicable_to: string[] | null
          start_date: string
          end_date: string
          is_active: boolean
          max_uses: number | null
          current_uses: number
          coupon_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          promotion_name: string
          promotion_type: 'discount_percentage' | 'discount_fixed' | 'bonus_credits' | 'free_trial'
          description?: string | null
          discount_percentage?: number | null
          discount_fixed?: number | null
          bonus_credits?: number | null
          applicable_to?: string[] | null
          start_date: string
          end_date: string
          is_active?: boolean
          max_uses?: number | null
          current_uses?: number
          coupon_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          promotion_name?: string
          promotion_type?: 'discount_percentage' | 'discount_fixed' | 'bonus_credits' | 'free_trial'
          description?: string | null
          discount_percentage?: number | null
          discount_fixed?: number | null
          bonus_credits?: number | null
          applicable_to?: string[] | null
          start_date?: string
          end_date?: string
          is_active?: boolean
          max_uses?: number | null
          current_uses?: number
          coupon_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          email_notifications: boolean
          process_alerts: boolean
          credit_alerts: boolean
          system_updates: boolean
          marketing_emails: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_notifications?: boolean
          process_alerts?: boolean
          credit_alerts?: boolean
          system_updates?: boolean
          marketing_emails?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_notifications?: boolean
          process_alerts?: boolean
          credit_alerts?: boolean
          system_updates?: boolean
          marketing_emails?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      async_searches: {
        Row: {
          id: string
          user_id: string
          search_type: 'cpf' | 'cnpj' | 'oab' | 'cnj'
          search_value: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          results_count: number
          error_message: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          search_type: 'cpf' | 'cnpj' | 'oab' | 'cnj'
          search_value: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          results_count?: number
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          search_type?: 'cpf' | 'cnpj' | 'oab' | 'cnj'
          search_value?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          results_count?: number
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "async_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
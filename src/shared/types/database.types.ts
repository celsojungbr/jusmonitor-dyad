// Database Types - Espelha o schema do Supabase

export type UserType = 'user' | 'lawyer' | 'admin'
export type PlanType = 'prepaid' | 'plus' | 'pro'
export type SubscriptionStatus = 'active' | 'canceled' | 'expired'
export type SearchType = 'cpf' | 'cnpj' | 'oab' | 'cnj'
export type MonitoringFrequency = 'daily' | 'weekly'
export type MonitoringStatus = 'active' | 'paused' | 'error'
export type CredentialType = 'password' | 'certificate'
export type CredentialStatus = 'active' | 'inactive' | 'expired'
export type TransactionType = 'purchase' | 'consumption' | 'refund'
export type ApiName = 'judit' | 'escavador'
export type FunctionStatus = 'active' | 'inactive'
export type LogType = 'api_call' | 'user_action' | 'error' | 'admin_action'
export type NotificationType = 'monitoring' | 'system' | 'message'

export interface Profile {
  id: string
  user_type: UserType
  full_name: string
  oab_number?: string | null // Permitir null
  cpf_cnpj: string
  phone?: string | null // Permitir null
  avatar_url?: string | null // Permitir null
  created_at: string
  updated_at: string
}

export interface CreditsPlan {
  id: string
  user_id: string
  plan_type: PlanType
  credits_balance: number
  credit_cost: number
  subscription_status: SubscriptionStatus
  next_billing_date?: string | null // Permitir null
  created_at: string
  updated_at: string
}

export interface Process {
  id: string
  cnj_number: string
  tribunal: string
  distribution_date: string | null // Permitir null
  status: string | null // Permitir null
  case_value: number | null // Permitir null
  judge_name: string | null // Permitir null
  court_name: string | null // Permitir null
  phase: string | null // Permitir null
  author_names: string[]
  defendant_names: string[]
  parties_cpf_cnpj: string[]
  last_update: string
  created_at: string
}

export interface ProcessMovement {
  id: string
  process_id: string
  movement_date: string
  movement_type: string
  description: string
  tribunal_source: string
  created_at: string
}

export interface ProcessAttachment {
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

export interface UserSearch {
  id: string
  user_id: string
  search_type: SearchType
  search_value: string
  credits_consumed: number
  results_count: number
  created_at: string
}

export interface UserProcess {
  id: string
  user_id: string
  process_id: string
  added_at: string
  access_cost_credits: number
}

export interface Monitoring {
  id: string
  user_id: string
  monitoring_type: SearchType
  monitoring_value: string
  process_id?: string | null // Permitir null
  frequency: MonitoringFrequency
  status: MonitoringStatus
  last_check?: string | null // Permitir null
  next_check?: string | null // Permitir null
  alerts_count: number
  created_at: string
}

export interface MonitoringAlert {
  id: string
  monitoring_id: string
  alert_type: string
  alert_data: any
  is_read: boolean
  created_at: string
}

export interface CredentialVault {
  id: string
  user_id: string
  tribunal: string
  credential_type: CredentialType
  encrypted_credentials: string
  status: CredentialStatus
  last_used?: string | null // Permitir null
  created_at: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  transaction_type: TransactionType
  operation_type: string
  credits_amount: number
  cost_in_reais: number
  description: string
  created_at: string
}

export interface ApiConfiguration {
  id: string
  api_name: ApiName
  api_key: string
  endpoint_url: string
  is_active: boolean
  priority: number
  rate_limit: number
  timeout: number
  fallback_api?: string | null // Permitir null
  last_health_check?: string | null // Permitir null
  created_at: string
  updated_at: string
}

export interface EdgeFunctionConfig {
  id: string
  function_name: string
  enabled_apis: string[]
  api_priority: string[]
  fallback_enabled: boolean
  status: FunctionStatus
  updated_at: string
}

export interface SystemLog {
  id: string
  log_type: LogType
  user_id?: string | null // Permitir null
  action: string
  metadata: any
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  notification_type: NotificationType
  title: string
  content: string
  is_read: boolean
  link_to?: string | null // Permitir null
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  subject: string
  content: string
  is_read: boolean
  parent_message_id?: string | null // Permitir null
  created_at: string
}
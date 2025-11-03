export interface FeatureProvider {
  name: string
  displayName: string
}

export interface FeatureFunction {
  functionName: string
  displayName: string
  availableProviders: FeatureProvider[]
}

export interface Feature {
  id: string
  name: string
  description: string
  functions: FeatureFunction[]
}

export interface EdgeFunctionConfig {
  id: string
  function_name: string
  enabled_apis: string[]
  api_priority: string[]
  fallback_enabled: boolean
  status: 'active' | 'inactive'
  updated_at: string
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useToast } from '@/hooks/use-toast'

interface NotificationPreferences {
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

export function useNotificationPreferences() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        // Se não existir, criar com valores padrão
        if (error.code === 'PGRST116') {
          const { data: newPrefs, error: insertError } = await supabase
            .from('notification_preferences')
            .insert({
              user_id: user.id,
              email_notifications: true,
              process_alerts: true,
              credit_alerts: true,
              system_updates: true,
              marketing_emails: false,
            })
            .select()
            .single()

          if (insertError) throw insertError
          return newPrefs as NotificationPreferences
        }
        throw error
      }

      return data as NotificationPreferences
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('notification_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as NotificationPreferences
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-preferences', user?.id], data)
      toast({
        title: 'Preferências atualizadas',
        description: 'Suas preferências de notificação foram salvas',
      })
    },
    onError: (error: any) => {
      console.error('Error updating preferences:', error)
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Não foi possível salvar as preferências',
        variant: 'destructive',
      })
    },
  })

  const updatePreference = (
    key: keyof Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    value: boolean
  ) => {
    updateMutation.mutate({ [key]: value })
  }

  return {
    preferences,
    isLoading,
    updatePreference,
    isUpdating: updateMutation.isPending,
  }
}
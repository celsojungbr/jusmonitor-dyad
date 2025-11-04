import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useToast } from '@/hooks/use-toast'

export interface NotificationPreferences {
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
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Buscar preferências
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification_preferences', user?.id],
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
              marketing_emails: false
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

  // Atualizar preferências
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as NotificationPreferences
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['notification_preferences', user?.id], data)
      toast({
        title: 'Preferências atualizadas',
        description: 'Suas preferências de notificação foram salvas.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Não foi possível salvar suas preferências.',
        variant: 'destructive',
      })
    },
  })

  // Atualizar uma preferência específica
  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    updateMutation.mutate({ [key]: value })
  }

  return {
    preferences,
    isLoading,
    isUpdating: updateMutation.isPending,
    updatePreference,
    updatePreferences: updateMutation.mutate,
  }
}

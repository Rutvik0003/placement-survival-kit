import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'

export type SettingsRow = {
  user_id: string
  push_enabled: boolean
  quiet_start: string | null
  quiet_end: string | null
  ghost_after_days: number
  samosas_per_ppt: number
}

export function useSettings() {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['settings'],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*').maybeSingle()
      if (error) throw new Error(error.message)
      if (data) return data as SettingsRow
      // Row missing (shouldn't happen — a trigger creates it). Create it.
      const { data: created, error: e2 } = await supabase.from('settings').insert({}).select().single()
      if (e2) throw new Error(e2.message)
      return created as SettingsRow
    },
  })
}

export function useSaveSettings() {
  const qc = useQueryClient()
  const { session } = useAuth()
  return useMutation({
    mutationFn: async (patch: Partial<Omit<SettingsRow, 'user_id'>>) => {
      const { data, error } = await supabase
        .from('settings')
        .update(patch)
        .eq('user_id', session!.user.id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as SettingsRow
    },
    onMutate: (patch) => qc.setQueryData<SettingsRow>(['settings'], (s) => (s ? { ...s, ...patch } : s)),
    onSettled: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

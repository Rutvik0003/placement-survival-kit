import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { CompanyStatus, EventRow } from '../lib/types'

export type HistoryRow = { company_id: string; from_status: CompanyStatus | null; to_status: CompanyStatus; changed_at: string }
export type PptRating = {
  event_id: string
  snacks_rating: number | null
  length_rating: number | null
  could_be_email: boolean | null
  ran_over: boolean | null
}
export type BadgeRow = { badge_key: string; company_id: string | null; earned_at: string }

async function rows<T>(q: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data as T
}

export const useHistory = () =>
  useQuery({
    queryKey: ['history', 'all'],
    queryFn: () =>
      rows<HistoryRow[]>(
        supabase.from('company_status_history').select('company_id, from_status, to_status, changed_at').order('changed_at'),
      ),
  })

export const useAllEvents = () =>
  useQuery({
    queryKey: ['events', 'all'],
    queryFn: () =>
      rows<EventRow[]>(
        supabase.from('events').select('*, company:companies(id, name, emoji, nickname, status)').order('starts_at'),
      ),
  })

export const usePptRatings = () =>
  useQuery({ queryKey: ['ppt_ratings'], queryFn: () => rows<PptRating[]>(supabase.from('ppt_ratings').select('*')) })

export const useFormals = () =>
  useQuery({
    queryKey: ['formals'],
    queryFn: async () => (await rows<{ day: string }[]>(supabase.from('formals_log').select('day').order('day'))).map((r) => r.day),
  })

export const useBadges = () =>
  useQuery({ queryKey: ['badges'], queryFn: () => rows<BadgeRow[]>(supabase.from('badges_earned').select('*')) })

export function useSavePptRating() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (r: PptRating) => rows(supabase.from('ppt_ratings').upsert(r, { onConflict: 'event_id' }).select()),
    onSettled: () => qc.invalidateQueries({ queryKey: ['ppt_ratings'] }),
  })
}

export function useLogFormals() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ day, on }: { day: string; on: boolean }) =>
      on
        ? rows(supabase.from('formals_log').upsert({ day }, { onConflict: 'user_id,day' }).select())
        : rows(supabase.from('formals_log').delete().eq('day', day)),
    onMutate: ({ day, on }) =>
      qc.setQueryData<string[]>(['formals'], (d = []) => (on ? [...new Set([...d, day])].sort() : d.filter((x) => x !== day))),
    onSettled: () => qc.invalidateQueries({ queryKey: ['formals'] }),
  })
}

export function useRecordBadges() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (list: { badge_key: string; company_id: string | null }[]) =>
      rows(supabase.from('badges_earned').upsert(list, { onConflict: 'user_id,badge_key', ignoreDuplicates: true }).select()),
    onSettled: () => qc.invalidateQueries({ queryKey: ['badges'] }),
  })
}

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Company, CompanyInput, CompanyStatus, EventInput, EventRow } from '../lib/types'

const EVENT_SELECT = '*, company:companies(id, name, emoji, nickname, status)'

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message)
  return data as T
}

// ─── Companies ────────────────────────────────────────────────────────────

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () =>
      unwrap<Company[]>(await supabase.from('companies').select('*').order('updated_at', { ascending: false })),
  })
}

export function useCompany(id: string | undefined) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: ['company', id],
    enabled: !!id,
    queryFn: async () => unwrap<Company | null>(await supabase.from('companies').select('*').eq('id', id!).maybeSingle()),
    initialData: () => qc.getQueryData<Company[]>(['companies'])?.find((c) => c.id === id),
  })
}

function invalidateAll(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ['companies'] })
  qc.invalidateQueries({ queryKey: ['company'] })
  qc.invalidateQueries({ queryKey: ['events'] })
  qc.invalidateQueries({ queryKey: ['event'] })
  qc.invalidateQueries({ queryKey: ['history'] })
}

export function useSaveCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: CompanyInput) => {
      const q = id
        ? supabase.from('companies').update(input).eq('id', id).select().single()
        : supabase.from('companies').insert(input).select().single()
      return unwrap<Company>(await q)
    },
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDeleteCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.from('companies').delete().eq('id', id)),
    onSuccess: () => invalidateAll(qc),
  })
}

/** Write a status change to the cache immediately (used for optimistic UI + undo). */
export function patchCompanyStatus(qc: QueryClient, id: string, status: CompanyStatus) {
  qc.setQueryData<Company[]>(['companies'], (list) => list?.map((c) => (c.id === id ? { ...c, status } : c)))
  qc.setQueryData<Company | null>(['company', id], (c) => (c ? { ...c, status } : c))
}

export function useSetStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CompanyStatus }) =>
      unwrap(await supabase.from('companies').update({ status }).eq('id', id)),
    onMutate: ({ id, status }) => patchCompanyStatus(qc, id, status),
    onSettled: () => invalidateAll(qc),
  })
}

// ─── Events ───────────────────────────────────────────────────────────────

/** Events whose start falls in [from, to). */
export function useEventsBetween(from: Date, to: Date) {
  const f = from.toISOString()
  const t = to.toISOString()
  return useQuery({
    queryKey: ['events', 'range', f, t],
    queryFn: async () =>
      unwrap<EventRow[]>(
        await supabase.from('events').select(EVENT_SELECT).gte('starts_at', f).lt('starts_at', t).order('starts_at'),
      ),
  })
}

/** Everything from `from` onwards (companies list uses it for "next event"). */
export function useEventsFrom(from: Date) {
  const f = from.toISOString()
  return useQuery({
    queryKey: ['events', 'from', f],
    queryFn: async () =>
      unwrap<EventRow[]>(await supabase.from('events').select(EVENT_SELECT).gte('starts_at', f).order('starts_at')),
  })
}

export function useCompanyEvents(companyId: string | undefined) {
  return useQuery({
    queryKey: ['events', 'company', companyId],
    enabled: !!companyId,
    queryFn: async () =>
      unwrap<EventRow[]>(
        await supabase.from('events').select(EVENT_SELECT).eq('company_id', companyId!).order('starts_at'),
      ),
  })
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['event', id],
    enabled: !!id,
    queryFn: async () =>
      unwrap<EventRow | null>(await supabase.from('events').select(EVENT_SELECT).eq('id', id!).maybeSingle()),
  })
}

export function useSaveEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: EventInput) => {
      const q = id
        ? supabase.from('events').update(input).eq('id', id).select(EVENT_SELECT).single()
        : supabase.from('events').insert(input).select(EVENT_SELECT).single()
      return unwrap<EventRow>(await q)
    },
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.from('events').delete().eq('id', id)),
    onSuccess: () => invalidateAll(qc),
  })
}

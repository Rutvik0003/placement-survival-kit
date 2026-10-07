import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { patchCompanyStatus, useSetStatus } from './queries'
import { useToast } from '../components/Toast'
import type { Company, CompanyStatus } from '../lib/types'

const DELAY = 4500

/**
 * Status changes with an Undo window. The UI updates instantly; the database
 * write happens after a few seconds unless Undo is tapped. That keeps status
 * history (used for badges later) free of accidental swipes.
 */
export function useStatusMover() {
  const qc = useQueryClient()
  const { mutate } = useSetStatus()
  const mutateRef = useRef(mutate)
  mutateRef.current = mutate
  const toast = useToast()
  const pending = useRef(
    new Map<string, { from: CompanyStatus; to: CompanyStatus; timer: ReturnType<typeof setTimeout> }>(),
  )

  const commit = useCallback(
    (id: string) => {
      const p = pending.current.get(id)
      if (!p) return
      clearTimeout(p.timer)
      pending.current.delete(id)
      if (p.to !== p.from) mutateRef.current({ id, status: p.to })
    },
    [],
  )

  const flushAll = useCallback(() => {
    for (const id of [...pending.current.keys()]) commit(id)
  }, [commit])

  // Don't lose a pending change if the app is backgrounded or the screen unmounts.
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && flushAll()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flushAll)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flushAll)
      flushAll()
    }
  }, [flushAll])

  return useCallback(
    (company: Pick<Company, 'id' | 'status'>, to: CompanyStatus, message: string) => {
      const existing = pending.current.get(company.id)
      if (existing) clearTimeout(existing.timer)
      // If a change is already pending, the database still holds its original "from".
      const from = existing?.from ?? company.status
      patchCompanyStatus(qc, company.id, to)
      pending.current.set(company.id, { from, to, timer: setTimeout(() => commit(company.id), DELAY) })
      toast.show({
        message,
        duration: DELAY,
        action: {
          label: 'Undo',
          onClick: () => {
            const p = pending.current.get(company.id)
            if (p) clearTimeout(p.timer)
            pending.current.delete(company.id)
            patchCompanyStatus(qc, company.id, from)
          },
        },
      })
    },
    [qc, commit, toast],
  )
}

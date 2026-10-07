import { useCallback, useEffect, useRef, useState } from 'react'
import { useCompanies } from '../hooks/queries'
import { useBadges, useHistory, useRecordBadges } from '../hooks/fun'
import { qualifyingBadges, type BadgeKey } from '../lib/fun'
import { BadgeUnlock } from './BadgeUnlock'

/** Watches your data, records newly qualified badges, and shows the unlock pop-up for each. */
export function BadgeWatcher() {
  const { data: companies } = useCompanies()
  const { data: history } = useHistory()
  const { data: earned } = useBadges()
  const record = useRecordBadges()
  const inFlight = useRef(new Set<string>())
  const [queue, setQueue] = useState<BadgeKey[]>([])

  useEffect(() => {
    if (!companies || !history || !earned) return
    const have = new Set(earned.map((b) => b.badge_key))
    const fresh = [...qualifyingBadges(companies, history)].filter(([k]) => !have.has(k) && !inFlight.current.has(k))
    if (!fresh.length) return
    fresh.forEach(([k]) => inFlight.current.add(k))
    record.mutate(
      fresh.map(([badge_key, company_id]) => ({ badge_key, company_id })),
      {
        onSuccess: () => setQueue((q) => [...q, ...fresh.map(([k]) => k)]),
        onSettled: () => fresh.forEach(([k]) => inFlight.current.delete(k)),
      },
    )
  }, [companies, history, earned]) // eslint-disable-line react-hooks/exhaustive-deps

  const next = useCallback(() => setQueue((q) => q.slice(1)), [])

  if (!queue.length) return null
  return <BadgeUnlock badge={queue[0]} remaining={queue.length - 1} total={Math.max(1, (earned?.length ?? 0) - (queue.length - 1))} onNext={next} />
}

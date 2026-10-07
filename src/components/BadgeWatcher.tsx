import { useEffect, useRef } from 'react'
import { useCompanies } from '../hooks/queries'
import { useBadges, useHistory, useRecordBadges } from '../hooks/fun'
import { qualifyingBadges } from '../lib/fun'
import { useToast } from './Toast'
import { badgeDefs, badgesCopy } from '../copy'

/** Invisible. Watches your data and unlocks badges (with a toast) when you qualify. */
export function BadgeWatcher() {
  const { data: companies } = useCompanies()
  const { data: history } = useHistory()
  const { data: earned } = useBadges()
  const record = useRecordBadges()
  const toast = useToast()
  const inFlight = useRef(new Set<string>())

  useEffect(() => {
    if (!companies || !history || !earned) return
    const have = new Set(earned.map((b) => b.badge_key))
    const fresh = [...qualifyingBadges(companies, history)].filter(([k]) => !have.has(k) && !inFlight.current.has(k))
    if (!fresh.length) return
    fresh.forEach(([k]) => inFlight.current.add(k))
    record.mutate(
      fresh.map(([badge_key, company_id]) => ({ badge_key, company_id })),
      {
        onSuccess: () => {
          const first = badgeDefs[fresh[0][0]]
          toast.show({
            message:
              fresh.length === 1
                ? `${first.emoji} ${badgesCopy.unlocked(first.name)}`
                : `${first.emoji} ${badgesCopy.unlocked(first.name)} (+${fresh.length - 1} more)`,
            duration: 5000,
          })
        },
        onSettled: () => fresh.forEach(([k]) => inFlight.current.delete(k)),
      },
    )
  }, [companies, history, earned]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

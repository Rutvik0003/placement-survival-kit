import { useEffect, useMemo } from 'react'
import { BackBar } from '../components/BackBar'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { Loading } from '../components/Loading'
import { CompanyTile } from '../components/Stamps'
import { Tombstone } from '../components/Tombstone'
import { useToast } from '../components/Toast'
import { useCompanies, useSaveCompany } from '../hooks/queries'
import { useSettings } from '../hooks/useSettings'
import { useStatusMover } from '../hooks/useStatusMover'
import { drizzle } from '../lib/confetti'
import { ghostSuspects } from '../lib/fun'
import { daysBetween } from '../lib/time'
import { graveyardCopy as c } from '../copy'

export default function Graveyard() {
  const { data: companies = [], isLoading } = useCompanies()
  const { data: settings } = useSettings()
  const save = useSaveCompany()
  const move = useStatusMover()
  const toast = useToast()
  const afterDays = settings?.ghost_after_days ?? 14
  const party = companies.some((co) => co.status === 'offer')

  const ghosts = useMemo(
    () =>
      companies
        .filter((co) => co.status === 'ghosted')
        .map((co) => ({ co, days: Math.max(0, daysBetween(co.last_contact_at, new Date())) }))
        .sort((a, b) => b.days - a.days),
    [companies],
  )
  const suspects = useMemo(() => ghostSuspects(companies, afterDays), [companies, afterDays])

  useEffect(() => {
    if (party && ghosts.length) {
      const t = setTimeout(drizzle, 400)
      return () => clearTimeout(t)
    }
  }, [party, ghosts.length])

  if (isLoading) return <Loading />

  return (
    <div className="mx-auto max-w-4xl">
      <BackBar fallback="/season" />
      <PageHeader kicker={party ? c.partyKicker : c.kicker} title={party && ghosts.length ? `🎉 ${c.partyTitle}` : c.title} />

      {suspects.length > 0 && (
        <section className="mb-8 rounded-2xl border border-dashed border-ghost/60 bg-card/60 p-4">
          <p className="font-display text-[17px] font-semibold">{c.suspectsTitle}</p>
          <p className="text-[13.5px] text-muted">{c.suspectsHint(afterDays)}</p>
          <ul className="mt-3 divide-y divide-line">
            {suspects.map((co) => (
              <li key={co.id} className="flex items-center gap-3 py-2.5">
                <CompanyTile company={co} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{co.name}</p>
                  <p className="font-mono text-[11px] text-muted">{c.daysSilent(daysBetween(co.last_contact_at, new Date()))}</p>
                </div>
                <button
                  className="btn btn-ghost h-8 px-2.5 text-[13px]"
                  onClick={() =>
                    save.mutate(
                      { id: co.id, ghost_suggest_snoozed_until: new Date(Date.now() + 7 * 86_400_000).toISOString() },
                      { onSuccess: () => toast.show({ message: c.snoozed }) },
                    )
                  }
                >
                  {c.snooze}
                </button>
                <button className="btn h-8 border border-ghost px-3 text-[13px] text-ghost hover:bg-ghost hover:text-white" onClick={() => move(co, 'ghosted', c.buried(co.name))}>
                  🪦 {c.markGhosted}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ghosts.length === 0 ? (
        <EmptyState title={c.empty.title} body={c.empty.body} />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {ghosts.map(({ co, days }) => (
            <Tombstone key={co.id} company={co} days={days} party={party} />
          ))}
        </div>
      )}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BackBar } from '../components/BackBar'
import { PageHeader } from '../components/PageHeader'
import { Loading } from '../components/Loading'
import { Sheet } from '../components/Sheet'
import { CompanyTile } from '../components/Stamps'
import { GraveyardScene, epitaphFor, type Grave } from '../components/GraveyardScene'
import { useToast } from '../components/Toast'
import { useCompanies, useSaveCompany } from '../hooks/queries'
import { useSettings } from '../hooks/useSettings'
import { useStatusMover } from '../hooks/useStatusMover'
import { drizzle } from '../lib/confetti'
import { ghostSuspects } from '../lib/fun'
import { daysBetween, fmtIST } from '../lib/time'
import { graveyardCopy as c } from '../copy'

export default function Graveyard() {
  const { data: companies = [], isLoading } = useCompanies()
  const { data: settings } = useSettings()
  const save = useSaveCompany()
  const move = useStatusMover()
  const toast = useToast()
  const [picked, setPicked] = useState<Grave | null>(null)
  const afterDays = settings?.ghost_after_days ?? 14
  const party = companies.some((co) => co.status === 'offer')

  const graves = useMemo<Grave[]>(
    () =>
      companies
        .filter((co) => co.status === 'ghosted')
        .map((company) => ({ company, days: Math.max(0, daysBetween(company.last_contact_at, new Date())) }))
        .sort((a, b) => b.days - a.days),
    [companies],
  )
  const suspects = useMemo(() => ghostSuspects(companies, afterDays), [companies, afterDays])

  useEffect(() => {
    if (party && graves.length) {
      const t = setTimeout(drizzle, 600)
      return () => clearTimeout(t)
    }
  }, [party, graves.length])

  if (isLoading) return <Loading />

  return (
    <div className="mx-auto max-w-4xl">
      <BackBar fallback="/season" />
      <PageHeader
        kicker={party && graves.length ? c.partyKicker : c.kicker}
        title={party && graves.length ? c.partyTitle : c.title}
        right={graves.length > 0 && <span className="font-mono text-[12px] text-muted">{graves.length} 🪦</span>}
      />

      <GraveyardScene graves={graves} party={party} onPick={setPicked} />
      {graves.length === 0 && <p className="mt-3 text-center text-[14.5px] text-muted">{c.empty.body}</p>}

      {suspects.length > 0 && (
        <section className="mt-8 rounded-2xl border border-dashed border-ghost/60 bg-card/60 p-4">
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
                <button
                  className="btn h-8 border border-ghost px-3 text-[13px] text-ghost hover:bg-ghost hover:text-white"
                  onClick={() => move(co, 'ghosted', c.buried(co.name))}
                >
                  🪦 {c.markGhosted}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Sheet open={!!picked} onClose={() => setPicked(null)} title={picked ? <>🪦 {picked.company.name}</> : null}>
        {picked && (
          <div className="space-y-4">
            <p className="rounded-xl bg-paper-2 px-4 py-3 text-center text-[15px] italic leading-snug">“{epitaphFor(picked.company.id)}”</p>
            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line text-center">
              {[
                [c.appliedOn, fmtIST(picked.company.created_at, 'd MMM')],
                [c.lastHeard, fmtIST(picked.company.last_contact_at, 'd MMM')],
                [c.silence, `${picked.days}d`],
              ].map(([k, v]) => (
                <div key={k} className="bg-card px-2 py-2.5">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">{k}</dt>
                  <dd className="font-display text-[17px] font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="grid grid-cols-2 gap-2">
              <Link to={`/companies/${picked.company.id}`} className="btn btn-ghost border border-line">
                {c.openCompany}
              </Link>
              <button
                className="btn btn-primary"
                onClick={() => {
                  move(picked.company, 'applied', c.resurrected(picked.company.name))
                  setPicked(null)
                }}
              >
                🧟 {c.resurrect}
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}

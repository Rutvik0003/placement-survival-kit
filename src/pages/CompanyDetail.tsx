import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BackBar } from '../components/BackBar'
import { EmptyState } from '../components/EmptyState'
import { EventCard } from '../components/EventCard'
import { Loading } from '../components/Loading'
import { ConfirmSheet } from '../components/Sheet'
import { CompanyTile, StatusStamp } from '../components/Stamps'
import { useToast } from '../components/Toast'
import { IconEdit, IconPlus, IconTrash } from '../components/Icons'
import { useCompany, useCompanyEvents, useDeleteCompany } from '../hooks/queries'
import { useStatusMover } from '../hooks/useStatusMover'
import { useHistory, usePptRatings } from '../hooks/fun'
import { companyNicknames } from '../lib/fun'
import { findClashes, interval } from '../lib/clash'
import { PIPELINE, STATUS_META } from '../lib/meta'
import { supabase } from '../lib/supabase'
import { daysBetween } from '../lib/time'
import type { Company, CompanyStatus } from '../lib/types'
import { commonCopy, companyDetailCopy as c, companyFormCopy, nicknameDefs, statusCopy } from '../copy'

const SM_COLS: Record<number, string> = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' }

/** Highest pipeline stage this company ever reached (so a rejection after interview still shows progress). */
function useFurthestStage(company: Company | null | undefined) {
  const { data: history = [] } = useQuery({
    queryKey: ['history', company?.id],
    enabled: !!company,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_status_history')
        .select('to_status')
        .eq('company_id', company!.id)
      if (error) throw error
      return data.map((r) => r.to_status as CompanyStatus)
    },
  })
  if (!company) return -1
  const idx = [company.status, ...history].map((s) => PIPELINE.indexOf(s)).filter((i) => i >= 0)
  return Math.max(0, ...idx)
}

function Stepper({ company, onPick }: { company: Company; onPick: (s: CompanyStatus) => void }) {
  const current = PIPELINE.indexOf(company.status)
  const furthest = useFurthestStage(company)
  const exited = current === -1
  return (
    <ol className="grid grid-cols-5">
      {PIPELINE.map((s, i) => {
        const done = exited ? i <= furthest : i < current
        const isCurrent = i === current
        return (
          <li key={s} className="relative">
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute right-1/2 top-[15px] h-[2px] w-full ${done || isCurrent ? 'bg-ink' : 'bg-line'} ${
                  exited && i > furthest ? 'bg-line' : ''
                }`}
              />
            )}
            <button
              onClick={() => onPick(s)}
              className="group relative flex w-full flex-col items-center gap-1.5"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-full border-[1.5px] font-mono text-[11px] font-semibold transition-transform group-hover:scale-110 ${
                  isCurrent
                    ? 'border-ink bg-marker text-marker-ink shadow-[2px_2px_0_var(--ink)]'
                    : done
                      ? exited
                        ? 'border-muted bg-muted text-paper'
                        : 'border-ink bg-ink text-paper'
                      : 'border-line bg-card text-muted'
                }`}
              >
                {done && !isCurrent ? '✓' : String(i + 1).padStart(2, '0')}
              </span>
              <span
                className={`text-center text-[11px] font-medium leading-tight sm:text-[12px] ${isCurrent ? 'text-ink' : 'text-muted'}`}
              >
                {STATUS_META[s].label}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export default function CompanyDetail() {
  const { id } = useParams()
  const { data: company, isLoading } = useCompany(id)
  const { data: events = [] } = useCompanyEvents(id)
  const del = useDeleteCompany()
  const move = useStatusMover()
  const navigate = useNavigate()
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)
  const { data: ratings = [] } = usePptRatings()
  const { data: allHistory = [] } = useHistory()

  const { upcoming, past, clashes } = useMemo(() => {
    const nowMs = Date.now()
    return {
      upcoming: events.filter((e) => interval(e)[1] > nowMs),
      past: events.filter((e) => interval(e)[1] <= nowMs).reverse(),
      clashes: findClashes(events),
    }
  }, [events])

  if (isLoading) return <Loading />
  if (!company)
    return (
      <>
        <BackBar fallback="/companies" />
        <EmptyState title="Company not found." body="Deleted, or never existed. Much like some job postings." />
      </>
    )

  const pick = (s: CompanyStatus) =>
    s !== company.status && move(company, s, statusCopy.moved(company.name, STATUS_META[s].label))
  const titles = companyNicknames(company, events, ratings, allHistory)
  const silent = daysBetween(company.last_contact_at, new Date())
  const closedStamp = company.status === 'rejected' || company.status === 'ghosted' || company.status === 'offer'
  const facts = [
    company.role && { k: 'Role', v: company.role },
    company.ctc_lpa != null && { k: c.ctc, v: `${company.ctc_lpa} ${c.lpa}` },
    company.cgpa_cutoff != null && { k: c.cgpa, v: `${company.cgpa_cutoff} CGPA` },
    company.location && { k: 'Where', v: company.location },
  ].filter(Boolean) as { k: string; v: string }[]

  return (
    <div className="mx-auto max-w-3xl">
      <BackBar
        fallback="/companies"
        right={
          <>
            <Link to={`/companies/${company.id}/edit`} className="btn btn-ghost h-10 px-3 text-[14px]">
              <IconEdit width={17} height={17} /> {c.edit}
            </Link>
            <button className="btn btn-ghost h-10 px-3 text-stamp-red" onClick={() => setConfirm(true)} aria-label="Delete">
              <IconTrash width={18} height={18} />
            </button>
          </>
        }
      />

      <header className="pb-6 pt-2">
        <div className="flex items-start gap-4">
          <CompanyTile company={company} size={64} />
          <div className="min-w-0 flex-1 pt-1">
            <h1 className="font-display text-[32px] font-bold leading-[1.02] tracking-[-0.03em] lg:text-[40px]">{company.name}</h1>
            {company.nickname && <p className="mt-1 text-[15px] italic text-muted">“{company.nickname}”</p>}
          </div>
          {closedStamp ? (
            <span className={`stamp stamp-in mt-2 shrink-0 border-2 px-2.5 py-1 text-[13px] ${STATUS_META[company.status].cls}`}>
              {STATUS_META[company.status].label}
            </span>
          ) : (
            <StatusStamp status={company.status} className="mt-2 shrink-0" />
          )}
        </div>
        {facts.length > 0 && (
          <dl
            className={`mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line ${SM_COLS[facts.length]}`}
          >
            {facts.map((f, i) => (
              <div
                key={f.k}
                className={`bg-card px-3.5 py-2.5 ${facts.length % 2 && i === facts.length - 1 ? 'col-span-2 sm:col-span-1' : ''}`}
              >
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{f.k}</dt>
                <dd className="truncate text-[15px] font-medium">{f.v}</dd>
              </div>
            ))}
          </dl>
        )}
        {titles.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {titles.map((k) => (
              <li
                key={k}
                title={nicknameDefs[k].why}
                className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-highlight/35 px-2.5 py-1 text-[13px] font-medium"
              >
                <span>{nicknameDefs[k].emoji}</span>
                {nicknameDefs[k].label}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 font-mono text-[11px] text-muted">{c.lastContact(Math.max(0, silent))}</p>
      </header>

      <section className="rounded-2xl border border-line bg-card px-3 pb-4 pt-4 sm:px-5">
        <p className="label px-1">{c.pipeline}</p>
        <Stepper company={company} onPick={pick} />
        <div className="mt-4 grid grid-cols-2 gap-2 border-t-[1.5px] border-dashed border-line pt-3">
          <button
            className={`btn h-10 border-[1.5px] text-[14px] ${
              company.status === 'rejected' ? 'border-stamp-red bg-stamp-red text-white' : 'border-line text-stamp-red hover:border-stamp-red'
            }`}
            onClick={() => pick('rejected')}
          >
            {statusCopy.markRejected}
          </button>
          <button
            className={`btn h-10 border-[1.5px] text-[14px] ${
              company.status === 'ghosted' ? 'border-ghost bg-ghost text-white' : 'border-line text-ghost hover:border-ghost'
            }`}
            onClick={() => pick('ghosted')}
          >
            {statusCopy.markGhosted}
          </button>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[22px] font-bold tracking-tight">{c.events}</h2>
          <Link to={`/events/new?company=${company.id}`} className="btn btn-primary h-9 px-3 text-[14px]">
            <IconPlus width={16} height={16} /> {c.addEvent}
          </Link>
        </div>
        {events.length === 0 ? (
          <p className="rounded-2xl border-[1.5px] border-dashed border-line px-4 py-5 text-[15px] text-muted">{c.noEvents}</p>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div>
                <p className="label">{c.upcoming}</p>
                <div className="space-y-2.5">
                  {upcoming.map((e) => (
                    <EventCard key={e.id} event={e} clashes={clashes.get(e.id)} showDate />
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p className="label">{c.past}</p>
                <div className="space-y-2.5">
                  {past.map((e) => (
                    <EventCard key={e.id} event={e} past showDate />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {company.notes && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-[22px] font-bold tracking-tight">{c.notes}</h2>
          <p className="whitespace-pre-wrap rounded-2xl border-[1.5px] border-line bg-card px-4 py-3 text-[15px] leading-relaxed">
            {company.notes}
          </p>
        </section>
      )}

      <ConfirmSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title={companyFormCopy.deleteTitle}
        body={companyFormCopy.deleteBody(company.name)}
        confirmLabel={companyFormCopy.delete}
        cancelLabel={companyFormCopy.cancel}
        busy={del.isPending}
        onConfirm={async () => {
          await del.mutateAsync(company.id)
          toast.show({ message: commonCopy.deleted })
          navigate('/companies', { replace: true })
        }}
      />
    </div>
  )
}

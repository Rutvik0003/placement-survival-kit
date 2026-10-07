import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { Loading } from '../components/Loading'
import { SwipeRow } from '../components/SwipeRow'
import { StatusPicker } from '../components/StatusPicker'
import { CompanyTile, StatusStamp } from '../components/Stamps'
import { IconPlus, IconSearch } from '../components/Icons'
import { useCompanies, useEventsFrom } from '../hooks/queries'
import { useStatusMover } from '../hooks/useStatusMover'
import { EVENT_META, STATUS_META, isClosed, nextStatus } from '../lib/meta'
import { fmtIST, relDay, startOfISTDay } from '../lib/time'
import type { Company, CompanyStatus, EventRow } from '../lib/types'
import { companiesCopy as c, statusCopy } from '../copy'

type Filter = keyof typeof c.filters

const FILTERS: { key: Filter; match: (s: CompanyStatus) => boolean }[] = [
  { key: 'active', match: (s) => !isClosed(s) },
  { key: 'offer', match: (s) => s === 'offer' },
  { key: 'rejected', match: (s) => s === 'rejected' },
  { key: 'ghosted', match: (s) => s === 'ghosted' },
  { key: 'all', match: () => true },
]

function CompanyRow({
  company,
  nextEvent,
  onPickStatus,
  onAdvance,
  onReject,
}: {
  company: Company
  nextEvent?: EventRow
  onPickStatus: () => void
  onAdvance: () => void
  onReject: () => void
}) {
  const next = nextStatus(company.status)
  const meta = [company.role, company.ctc_lpa != null ? `${company.ctc_lpa} LPA` : null, company.location]
    .filter(Boolean)
    .join(' · ')
  return (
    <SwipeRow
      onRight={onAdvance}
      onLeft={onReject}
      rightEnabled={!!next}
      leftEnabled={company.status !== 'rejected'}
      rightLabel={next ? `→ ${STATUS_META[next].label}` : ''}
      leftLabel={statusCopy.swipeLeft}
    >
      <Link
        to={`/companies/${company.id}`}
        className="flex items-center gap-3 rounded-2xl border-[1.5px] border-line bg-card px-3.5 py-3 transition-colors hover:border-ink md:gap-4 md:px-4"
      >
        <CompanyTile company={company} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[17px] font-semibold leading-tight tracking-tight">
            {company.name}
            {company.nickname && <span className="font-sans text-[14px] font-normal text-muted"> · {company.nickname}</span>}
          </p>
          {meta && <p className="mt-0.5 truncate text-[13px] text-muted">{meta}</p>}
          <p className="mt-1 truncate font-mono text-[11px] uppercase tracking-wider text-muted md:hidden">
            {nextEvent ? (
              <>
                <span className={EVENT_META[nextEvent.type].cls.split(' ')[0]}>{EVENT_META[nextEvent.type].label}</span> ·{' '}
                {relDay(nextEvent.starts_at)} {fmtIST(nextEvent.starts_at, 'HH:mm')}
              </>
            ) : null}
          </p>
        </div>
        <div className="hidden w-44 shrink-0 font-mono text-[12px] text-muted md:block">
          {nextEvent ? (
            <>
              <p className={`uppercase tracking-wider ${EVENT_META[nextEvent.type].cls.split(' ')[0]}`}>
                {EVENT_META[nextEvent.type].label}
              </p>
              <p className="text-ink-2">
                {relDay(nextEvent.starts_at)}, {fmtIST(nextEvent.starts_at, 'HH:mm')}
              </p>
            </>
          ) : (
            <p>{c.noUpcoming}</p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onPickStatus()
          }}
          className="shrink-0 rounded-md p-1 transition-transform hover:-rotate-3 active:scale-95"
          aria-label={`Status: ${STATUS_META[company.status].label}. Change`}
        >
          <StatusStamp status={company.status} />
        </button>
      </Link>
    </SwipeRow>
  )
}

export default function Companies() {
  const { data: companies = [], isLoading } = useCompanies()
  const dayStart = useMemo(() => startOfISTDay(), [])
  const { data: upcoming = [] } = useEventsFrom(dayStart)
  const move = useStatusMover()
  const [query, setQuery] = useState('')
  const [picker, setPicker] = useState<Company | null>(null)
  const hasActive = companies.some((co) => !isClosed(co.status))
  const [filter, setFilter] = useState<Filter | null>(null)
  const active: Filter = filter ?? (hasActive || !companies.length ? 'active' : 'all')

  const nextByCompany = useMemo(() => {
    const m = new Map<string, EventRow>()
    const nowMs = Date.now()
    for (const e of upcoming) if (+new Date(e.starts_at) >= nowMs && !m.has(e.company_id)) m.set(e.company_id, e)
    return m
  }, [upcoming])

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.key, companies.filter((co) => f.match(co.status)).length])),
    [companies],
  )

  const list = useMemo(() => {
    const f = FILTERS.find((x) => x.key === active)!
    const q = query.trim().toLowerCase()
    return companies
      .filter((co) => f.match(co.status))
      .filter((co) => !q || [co.name, co.nickname, co.role].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => {
        // Companies with something coming up float to the top, soonest first.
        const ea = nextByCompany.get(a.id)
        const eb = nextByCompany.get(b.id)
        if (ea && eb) return +new Date(ea.starts_at) - +new Date(eb.starts_at)
        if (ea) return -1
        if (eb) return 1
        return +new Date(b.updated_at) - +new Date(a.updated_at)
      })
  }, [companies, active, query, nextByCompany])

  return (
    <>
      <PageHeader
        kicker={c.kicker}
        title={c.title}
        right={
          <Link to="/companies/new" className="btn btn-primary h-10 px-3 sm:px-4">
            <IconPlus width={18} height={18} />
            <span className="sm:hidden">{c.addShort}</span>
            <span className="hidden sm:inline">{c.add}</span>
          </Link>
        }
      />

      {isLoading ? (
        <Loading />
      ) : companies.length === 0 ? (
        <EmptyState
          title={c.emptyFilter.all.title}
          body={c.emptyFilter.all.body}
          action={
            <Link to="/companies/new" className="btn btn-primary">
              <IconPlus width={18} height={18} /> {c.add}
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0" role="tablist">
              {FILTERS.map(({ key }) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active === key}
                  onClick={() => setFilter(key)}
                  className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-[14px] font-medium transition-colors ${
                    active === key ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:border-ink'
                  }`}
                >
                  {c.filters[key]}
                  <span className={`font-mono text-[11px] ${active === key ? 'text-paper/60' : 'text-muted'}`}>{counts[key]}</span>
                </button>
              ))}
            </div>
            <label className="relative block md:w-64">
              <span className="sr-only">{c.search}</span>
              <IconSearch width={18} height={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="search"
                className="field h-10 pl-9 text-[15px]"
                placeholder={c.search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>

          <p className="mt-4 font-mono text-[11px] text-muted lg:hidden">{c.swipeHint}</p>

          {list.length === 0 ? (
            query ? (
              <p className="mt-6 text-center text-[15px] text-muted">{c.noMatch}</p>
            ) : (
              <EmptyState title={c.emptyFilter[active].title} body={c.emptyFilter[active].body} />
            )
          ) : (
            <ul className="mt-3 space-y-2">
              {list.map((co) => (
                <li key={co.id}>
                  <CompanyRow
                    company={co}
                    nextEvent={nextByCompany.get(co.id)}
                    onPickStatus={() => setPicker(co)}
                    onAdvance={() => {
                      const n = nextStatus(co.status)
                      if (n) move(co, n, statusCopy.advanced(co.name, STATUS_META[n].label))
                    }}
                    onReject={() => move(co, 'rejected', statusCopy.rejected(co.name))}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {picker && (
        <StatusPicker
          open
          onClose={() => setPicker(null)}
          companyName={picker.name}
          current={picker.status}
          onPick={(s) => s !== picker.status && move(picker, s, statusCopy.moved(picker.name, STATUS_META[s].label))}
        />
      )}
    </>
  )
}

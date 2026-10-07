import { Fragment, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EventCard } from '../components/EventCard'
import { NextUp } from '../components/NextUp'
import { Loading } from '../components/Loading'
import { RemindersNudge } from '../components/RemindersNudge'
import { useNow } from '../hooks/useNow'
import { useCompanies, useEventsFrom } from '../hooks/queries'
import { findClashes, interval } from '../lib/clash'
import { ALL_STATUSES, EVENT_META, STATUS_META } from '../lib/meta'
import { addISTDays, dayKey, fmtIST, greetingIST, relDay, startOfISTDay } from '../lib/time'
import type { EventRow } from '../lib/types'
import { homeCopy, timelineCopy as t } from '../copy'

function SectionTitle({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <h2 className="mb-3 mt-9 flex items-baseline gap-2 font-display text-[20px] font-bold tracking-tight">
      {children}
      {count !== undefined && count > 0 && <span className="font-mono text-[12px] font-normal text-muted">{count}</span>}
    </h2>
  )
}

function NowLine({ time }: { time: string }) {
  return (
    <div className="flex items-center gap-2 py-1" aria-label={`Now, ${time}`}>
      <span className="w-[48px] text-right font-mono text-[11px] font-semibold uppercase tracking-wider text-marker">
        {t.now}
      </span>
      <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-marker bg-paper" />
      <span className="h-[2px] flex-1 bg-marker" />
      <span className="font-mono text-[11px] tabular-nums text-marker">{time}</span>
    </div>
  )
}

function WeekStrip({ days, byDay, clashDays }: { days: Date[]; byDay: Map<string, EventRow[]>; clashDays: Set<string> }) {
  return (
    <div>
      <p className="label">{t.weekAtAGlance}</p>
      <ol className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const k = dayKey(d)
          const evs = byDay.get(k) ?? []
          const today = i === 0
          return (
            <li key={k}>
              <a
                href={`#day-${k}`}
                className={`flex h-[84px] flex-col items-center rounded-xl border px-1 pt-2 transition-colors ${
                  today ? 'border-ink bg-ink text-paper' : clashDays.has(k) ? 'border-stamp-red/60 bg-card' : 'border-line bg-card hover:border-ink/40'
                }`}
              >
                <span className={`font-mono text-[10px] uppercase ${today ? 'text-paper/60' : 'text-muted'}`}>
                  {fmtIST(d, 'EEEEE')}
                </span>
                <span className="font-display text-[17px] font-bold leading-tight">{fmtIST(d, 'd')}</span>
                <span className="mt-auto mb-2 flex w-full flex-col items-center gap-[3px]">
                  {evs.slice(0, 4).map((e) => (
                    <span key={e.id} className={`h-[5px] w-[70%] rounded-full ${EVENT_META[e.type].bar}`} />
                  ))}
                  {evs.length > 4 && <span className="font-mono text-[9px] leading-none">+{evs.length - 4}</span>}
                  {clashDays.has(k) && <span className="font-mono text-[9px] font-semibold uppercase leading-none text-stamp-red">clash</span>}
                </span>
              </a>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function PipelineSummary() {
  const { data: companies = [] } = useCompanies()
  if (!companies.length) return null
  const counts = ALL_STATUSES.map((s) => ({ s, n: companies.filter((c) => c.status === s).length }))
  const max = Math.max(...counts.map((c) => c.n), 1)
  return (
    <Link to="/companies" className="block rounded-2xl border border-line bg-card p-4 transition-colors hover:border-ink/40">
      <p className="label">{t.pipeline}</p>
      <ul className="space-y-1.5">
        {counts.map(({ s, n }) => (
          <li key={s} className="grid grid-cols-[84px_1fr_24px] items-center gap-2 text-[13px]">
            <span className="text-ink-2">{STATUS_META[s].label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-paper-2">
              <span className={`block h-full rounded-full ${STATUS_META[s].dot}`} style={{ width: `${(n / max) * 100}%` }} />
            </span>
            <span className="text-right font-mono tabular-nums text-muted">{n}</span>
          </li>
        ))}
      </ul>
    </Link>
  )
}

export default function Home() {
  const now = useNow()
  const dayStart = useMemo(() => startOfISTDay(now), [dayKey(now)]) // eslint-disable-line react-hooks/exhaustive-deps
  const { data: events = [], isLoading } = useEventsFrom(dayStart)

  const { days, byDay, clashes, next, clashDays } = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => addISTDays(dayStart, i))
    const weekEnd = addISTDays(dayStart, 7).getTime()
    const inWeek = events.filter((e) => +new Date(e.starts_at) < weekEnd)
    const byDay = new Map<string, EventRow[]>()
    for (const e of inWeek) {
      const k = dayKey(e.starts_at)
      byDay.set(k, [...(byDay.get(k) ?? []), e])
    }
    const clashes = findClashes(inWeek)
    const clashDays = new Set([...clashes.keys()].map((id) => dayKey(inWeek.find((e) => e.id === id)!.starts_at)))
    const next = events.find((e) => interval(e)[1] > Date.now()) ?? null
    return { days, byDay, clashes, next, clashDays }
  }, [events, dayStart, now]) // `now` so "next" rolls over each minute

  const todayKey = dayKey(dayStart)
  const todays = byDay.get(todayKey) ?? []
  const nowMs = now.getTime()
  const firstUpcoming = todays.findIndex((e) => interval(e)[1] > nowMs)
  const rest = days.slice(1).filter((d) => byDay.get(dayKey(d))?.length)
  const restCount = rest.reduce((n, d) => n + (byDay.get(dayKey(d))?.length ?? 0), 0)

  return (
    <>
      <PageHeader
        kicker={
          <>
            {fmtIST(now, 'EEE · d MMM')} <span className="text-marker">·</span>{' '}
            <span className="tabular-nums">{fmtIST(now, 'HH:mm')} IST</span>
          </>
        }
        title={homeCopy.greeting[greetingIST(now)]}
      />
      <RemindersNudge />

      {isLoading ? (
        <Loading />
      ) : (
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-10">
          <div className="min-w-0">
            <div className="lg:hidden">
              <NextUp event={next} />
            </div>

            <section id={`day-${todayKey}`} className="scroll-mt-6">
              <SectionTitle count={todays.length}>{t.today}</SectionTitle>
              {todays.length === 0 ? (
                <p className="pl-[60px] text-[14.5px] text-muted">{t.todayEmpty}</p>
              ) : (
                <div className="space-y-2">
                  {todays.map((e, i) => (
                    <Fragment key={e.id}>
                      {i === firstUpcoming && i > 0 && <NowLine time={fmtIST(now, 'HH:mm')} />}
                      <EventCard event={e} clashes={clashes.get(e.id)} past={interval(e)[1] <= nowMs} />
                    </Fragment>
                  ))}
                  {firstUpcoming === -1 && <NowLine time={fmtIST(now, 'HH:mm')} />}
                </div>
              )}
            </section>

            <section>
              <SectionTitle count={restCount}>{t.week}</SectionTitle>
              {rest.length === 0 ? (
                <p className="pl-[60px] text-[14.5px] text-muted">{t.weekEmpty}</p>
              ) : (
                <div className="space-y-6">
                  {rest.map((d) => {
                    const k = dayKey(d)
                    return (
                      <div key={k} id={`day-${k}`} className="scroll-mt-6">
                        <h3 className="mb-2.5 flex items-center gap-3 pl-[60px] font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                          <span className="text-ink">{relDay(d, now)}</span>
                          <span>{fmtIST(d, 'd MMM')}</span>
                          <span className="h-px flex-1 bg-line" />
                        </h3>
                        <div className="space-y-2">
                          {byDay.get(k)!.map((e) => (
                            <EventCard key={e.id} event={e} clashes={clashes.get(e.id)} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="hidden space-y-6 lg:sticky lg:top-6 lg:block">
            <NextUp event={next} />
            <WeekStrip days={days} byDay={byDay} clashDays={clashDays} />
            <PipelineSummary />
          </aside>
        </div>
      )}
    </>
  )
}

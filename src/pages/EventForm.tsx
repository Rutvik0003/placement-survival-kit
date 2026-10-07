import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BackBar } from '../components/BackBar'
import { PageHeader } from '../components/PageHeader'
import { Loading } from '../components/Loading'
import { CompanyTile } from '../components/Stamps'
import { useToast } from '../components/Toast'
import { IconAlert, IconPlus } from '../components/Icons'
import { useCompanies, useEvent, useEventsBetween, useSaveCompany, useSaveEvent } from '../hooks/queries'
import { clashesFor } from '../lib/clash'
import { DEFAULT_MINUTES, EVENT_META, EVENT_TYPES } from '../lib/meta'
import { addISTDays, durationLabel, fmtIST, fromISTParts, istParts, startOfISTDay } from '../lib/time'
import type { EventType } from '../lib/types'
import { clashCopy, commonCopy, defaultEventTitles, eventFormCopy as c } from '../copy'

/** "meet.google.com/abc" → "https://meet.google.com/abc" so it opens from a notification. */
function normalizeLink(raw: string) {
  const v = raw.trim()
  if (!v) return null
  return /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`
}

const DURATIONS = [30, 45, 60, 90, 120, 180]
const QUICK_TIMES = ['09:00', '10:00', '11:00', '14:00', '16:00', '18:00']

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-[14px] font-medium transition-colors ${
        active ? 'border-ink bg-ink text-paper' : 'border-line bg-card text-ink-2 hover:border-ink'
      }`}
    >
      {children}
    </button>
  )
}

function Row({ label, children, htmlFor }: { label: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
    </div>
  )
}

export default function EventForm() {
  const { id } = useParams()
  const editing = !!id
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { data: existing, isLoading } = useEvent(id)
  const { data: companies = [] } = useCompanies()
  const saveEvent = useSaveEvent()
  const saveCompany = useSaveCompany()

  const today = useMemo(() => startOfISTDay(), [])
  const [companyId, setCompanyId] = useState<string | null>(params.get('company'))
  const [companyQuery, setCompanyQuery] = useState('')
  const [type, setType] = useState<EventType>('ppt')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(istParts(today).date)
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState<number | null>(DEFAULT_MINUTES.ppt)
  const [customEnd, setCustomEnd] = useState<string | null>(null)
  const [durationTouched, setDurationTouched] = useState(false)
  const [venue, setVenue] = useState('')
  const [link, setLink] = useState('')
  const [notes, setNotes] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loaded = useRef(false)

  // Prefill when editing.
  useEffect(() => {
    if (!existing || loaded.current) return
    loaded.current = true
    const p = istParts(existing.starts_at)
    setCompanyId(existing.company_id)
    setType(existing.type)
    setTitle(existing.title === defaultEventTitles[existing.type] ? '' : existing.title)
    setDate(p.date)
    setTime(p.time)
    if (existing.ends_at) {
      const mins = Math.round((+new Date(existing.ends_at) - +new Date(existing.starts_at)) / 60000)
      if (DURATIONS.includes(mins)) setDuration(mins)
      else {
        setDuration(null)
        setCustomEnd(istParts(existing.ends_at).time)
      }
    } else setDuration(null)
    setDurationTouched(true)
    setVenue(existing.venue ?? '')
    setLink(existing.link ?? '')
    setNotes(existing.notes ?? '')
    setShowMore(!!(existing.venue || existing.link || existing.notes))
  }, [existing])

  const company = companies.find((co) => co.id === companyId) ?? null
  const q = companyQuery.trim()
  const matches = useMemo(() => {
    const lq = q.toLowerCase()
    const list = lq
      ? companies.filter((co) => [co.name, co.nickname].some((v) => v?.toLowerCase().includes(lq)))
      : companies.filter((co) => !['rejected', 'ghosted'].includes(co.status))
    return list.slice(0, 6)
  }, [companies, q])
  const exact = companies.some((co) => co.name.toLowerCase() === q.toLowerCase())

  function pickType(t: EventType) {
    setType(t)
    if (t === 'deadline') {
      setDuration(null)
      setCustomEnd(null)
      if (!time) setTime('23:59')
    } else if (!durationTouched) setDuration(DEFAULT_MINUTES[t])
  }

  // Compute the instants (null if incomplete).
  const startsAt = date && time ? fromISTParts(date, time) : null
  const endsAt = !startsAt
    ? null
    : customEnd
      ? fromISTParts(date, customEnd)
      : duration
        ? new Date(startsAt.getTime() + duration * 60_000)
        : null

  // Clash check against that IST day (±1 day so late-night events are covered).
  const dayStart = useMemo(() => addISTDays(startOfISTDay(startsAt ?? today), -1), [date]) // eslint-disable-line react-hooks/exhaustive-deps
  const { data: nearby = [] } = useEventsBetween(dayStart, addISTDays(dayStart, 3))
  const clashes = startsAt
    ? clashesFor(
        { id, type, starts_at: startsAt.toISOString(), ends_at: endsAt?.toISOString() ?? null },
        nearby,
      )
    : []

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!companyId && !q) return setError(c.needCompany)
    if (!startsAt) return setError(c.needTime)
    if (endsAt && endsAt < startsAt) return setError(c.endBeforeStart)
    try {
      let cid = companyId
      if (!cid) {
        const match = companies.find((co) => co.name.toLowerCase() === q.toLowerCase())
        cid = match ? match.id : (await saveCompany.mutateAsync({ name: q })).id
      }
      const saved = await saveEvent.mutateAsync({
        id,
        company_id: cid,
        type,
        title: title.trim() || defaultEventTitles[type],
        starts_at: startsAt.toISOString(),
        ends_at: endsAt?.toISOString() ?? null,
        venue: venue.trim() || null,
        link: normalizeLink(link),
        notes: notes.trim() || null,
      })
      toast.show({ message: commonCopy.saved })
      if (editing) navigate(`/events/${saved.id}`, { replace: true })
      else if (location.key !== 'default') navigate(-1)
      else navigate('/', { replace: true })
    } catch {
      setError(commonCopy.error)
    }
  }

  if (editing && isLoading) return <Loading />

  const dateChips = [0, 1, 2, 3, 4].map((n) => {
    const d = addISTDays(today, n)
    return { value: istParts(d).date, label: n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : fmtIST(d, 'EEE d') }
  })
  const busy = saveEvent.isPending || saveCompany.isPending

  return (
    <div className="mx-auto max-w-2xl">
      <BackBar fallback="/" />
      <PageHeader kicker={c.kicker} title={editing ? c.editTitle : c.newTitle} />

      <form onSubmit={submit} className="space-y-6">
        {/* Company */}
        <Row label={c.company} htmlFor="company">
          {company ? (
            <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-ink bg-card px-3 py-2">
              <CompanyTile company={company} size={36} />
              <p className="min-w-0 flex-1 truncate font-display text-[17px] font-semibold">{company.name}</p>
              <button
                type="button"
                className="rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-muted hover:bg-paper-2 hover:text-ink"
                onClick={() => {
                  setCompanyId(null)
                  setCompanyQuery('')
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <div>
              <input
                id="company"
                className="field"
                placeholder={c.companyPlaceholder}
                value={companyQuery}
                onChange={(e) => setCompanyQuery(e.target.value)}
                autoFocus={!editing}
                autoComplete="off"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {matches.map((co) => (
                  <button
                    type="button"
                    key={co.id}
                    onClick={() => setCompanyId(co.id)}
                    className="flex h-9 items-center gap-2 rounded-full border-[1.5px] border-line bg-card pl-1 pr-3 text-[14px] font-medium hover:border-ink"
                  >
                    <CompanyTile company={co} size={26} />
                    {co.name}
                  </button>
                ))}
                {q && !exact && (
                  <span className="flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-ink px-3 text-[14px] font-medium">
                    <IconPlus width={15} height={15} /> {c.createCompany(q)}
                  </span>
                )}
              </div>
            </div>
          )}
        </Row>

        {/* Type */}
        <Row label={c.type}>
          <div className="flex flex-wrap gap-1.5">
            {EVENT_TYPES.map((t) => (
              <Chip key={t} active={type === t} onClick={() => pickType(t)}>
                <span className={`h-2 w-2 rounded-full ${EVENT_META[t].bar}`} />
                {EVENT_META[t].label}
              </Chip>
            ))}
          </div>
        </Row>

        {/* When */}
        <div className="rounded-2xl border-[1.5px] border-line bg-card/60 p-4 space-y-4">
          <Row label={c.date} htmlFor="date">
            <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
              {dateChips.map((d) => (
                <Chip key={d.value} active={date === d.value} onClick={() => setDate(d.value)}>
                  {d.label}
                </Chip>
              ))}
              <input
                id="date"
                type="date"
                className={`field h-9 w-auto shrink-0 rounded-full px-3 text-[14px] ${
                  dateChips.some((d) => d.value === date) ? '' : 'border-ink'
                }`}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </Row>

          <Row label={c.time} htmlFor="time">
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                id="time"
                type="time"
                className="field h-11 w-32 font-mono text-[17px]"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
              {QUICK_TIMES.map((qt) => (
                <Chip key={qt} active={time === qt} onClick={() => setTime(qt)}>
                  <span className="font-mono text-[13px]">{qt}</span>
                </Chip>
              ))}
            </div>
          </Row>

          {type !== 'deadline' && (
            <Row label={c.duration}>
              <div className="flex flex-wrap items-center gap-1.5">
                <Chip
                  active={duration === null && customEnd === null}
                  onClick={() => {
                    setDuration(null)
                    setCustomEnd(null)
                    setDurationTouched(true)
                  }}
                >
                  {c.noEnd}
                </Chip>
                {DURATIONS.map((m) => (
                  <Chip
                    key={m}
                    active={duration === m && customEnd === null}
                    onClick={() => {
                      setDuration(m)
                      setCustomEnd(null)
                      setDurationTouched(true)
                    }}
                  >
                    {durationLabel(m)}
                  </Chip>
                ))}
                {customEnd === null ? (
                  <Chip
                    active={false}
                    onClick={() => {
                      setCustomEnd(endsAt ? istParts(endsAt).time : time || '')
                      setDurationTouched(true)
                    }}
                  >
                    {c.endTime}…
                  </Chip>
                ) : (
                  <label className="flex items-center gap-2">
                    <span className="text-[13px] text-muted">{c.endTime}</span>
                    <input
                      type="time"
                      className="field h-9 w-28 rounded-full border-ink px-3 font-mono text-[14px]"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      autoFocus
                    />
                  </label>
                )}
              </div>
            </Row>
          )}

          {startsAt && (
            <p className="font-mono text-[12px] text-muted">
              → {fmtIST(startsAt, 'EEE d MMM, HH:mm')}
              {endsAt && `–${fmtIST(endsAt, 'HH:mm')}`} IST
            </p>
          )}
        </div>

        {clashes.length > 0 && (
          <div role="status" className="flex gap-3 rounded-xl border-[1.5px] border-stamp-red bg-stamp-red/10 px-4 py-3 text-stamp-red">
            <IconAlert width={20} height={20} className="mt-0.5 shrink-0" />
            <div className="text-[14px] leading-snug">
              <p className="font-semibold">{clashes.length === 1 ? clashCopy.formOne : clashCopy.formMany(clashes.length)}</p>
              <ul className="mt-1 space-y-0.5">
                {clashes.map((x) => (
                  <li key={x.id}>
                    {x.company?.name} · {x.title} · {fmtIST(x.starts_at, 'HH:mm')}
                    {x.ends_at && `–${fmtIST(x.ends_at, 'HH:mm')}`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <Row label={c.title} htmlFor="title">
          <input
            id="title"
            className="field"
            placeholder={`${defaultEventTitles[type]}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoComplete="off"
          />
        </Row>

        {!showMore ? (
          <button
            type="button"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-line text-[14px] font-medium text-ink-2 hover:border-ink"
            onClick={() => setShowMore(true)}
          >
            <IconPlus width={16} height={16} /> {c.more}
          </button>
        ) : (
          <div className="space-y-5">
            <Row label={c.venue} htmlFor="venue">
              <input id="venue" className="field" placeholder={c.venuePlaceholder} value={venue} onChange={(e) => setVenue(e.target.value)} />
            </Row>
            <Row label={c.link} htmlFor="link">
              <input
                id="link"
                type="text"
                inputMode="url"
                autoCapitalize="off"
                autoCorrect="off"
                className="field"
                placeholder={c.linkPlaceholder}
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </Row>
            <Row label={c.notes} htmlFor="notes">
              <textarea
                id="notes"
                rows={3}
                className="field h-auto resize-y py-3 leading-relaxed"
                placeholder={c.notesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Row>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg border-[1.5px] border-stamp-red/40 bg-stamp-red/10 px-3 py-2.5 text-[14px] text-stamp-red">
            {error}
          </p>
        )}

        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-10 -mx-4 bg-gradient-to-t from-paper via-paper to-transparent px-4 pb-2 pt-4 lg:bottom-0">
          <button type="submit" className="btn btn-marker w-full" disabled={busy}>
            {busy ? c.saving : c.save}
          </button>
        </div>
      </form>
    </div>
  )
}

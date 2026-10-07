import { Link } from 'react-router-dom'
import { EVENT_META } from '../lib/meta'
import { fmtIST } from '../lib/time'
import type { EventRow } from '../lib/types'
import { clashCopy } from '../copy'

/** One row of the timeline: time column + a quiet card. Colour bar = event type. */
export function EventCard({
  event,
  clashes = [],
  past = false,
  showDate = false,
}: {
  event: EventRow
  clashes?: EventRow[]
  past?: boolean
  showDate?: boolean
}) {
  const meta = EVENT_META[event.type]
  const clash = clashes.length > 0
  const sub = [event.title, event.venue].filter(Boolean).join(' · ')
  return (
    <Link
      to={`/events/${event.id}`}
      className={`group grid grid-cols-[48px_1fr] gap-3 transition-opacity ${past ? 'opacity-50 hover:opacity-90' : ''}`}
    >
      <div className="pt-2.5 text-right font-mono leading-tight tabular-nums">
        {showDate && <p className="text-[10px] uppercase tracking-wider text-muted">{fmtIST(event.starts_at, 'd MMM')}</p>}
        <p className="text-[14px] font-medium">{fmtIST(event.starts_at, 'HH:mm')}</p>
        {event.ends_at && <p className="text-[11px] text-muted">{fmtIST(event.ends_at, 'HH:mm')}</p>}
      </div>
      <div
        className={`relative overflow-hidden rounded-xl border bg-card py-2.5 pl-4 pr-3 transition-colors ${
          clash ? 'border-stamp-red/60' : 'border-line group-hover:border-ink/40'
        }`}
      >
        <span aria-hidden className={`absolute inset-y-2 left-1.5 w-[3px] rounded-full ${meta.bar}`} />
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate font-display text-[16px] font-semibold tracking-tight">{event.company?.name ?? '—'}</p>
          <span className={`shrink-0 font-mono text-[10.5px] uppercase tracking-wider ${meta.cls.split(' ')[0]}`}>
            {meta.label}
          </span>
        </div>
        {sub && <p className="mt-0.5 truncate text-[13.5px] text-muted">{sub}</p>}
        {clash && (
          <p className="mt-1.5 truncate text-[12.5px] text-stamp-red">
            ⚠ {clashCopy.overlapsWith}{' '}
            {clashes.map((c) => `${c.company?.name ?? c.title} ${fmtIST(c.starts_at, 'HH:mm')}`).join(', ')}
          </p>
        )}
      </div>
    </Link>
  )
}

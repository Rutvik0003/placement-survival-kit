import { Link } from 'react-router-dom'
import { CompanyTile, TypeTag } from './Stamps'
import { IconAlert, IconLink, IconPin } from './Icons'
import { EVENT_META } from '../lib/meta'
import { fmtIST, durationLabel } from '../lib/time'
import type { EventRow } from '../lib/types'
import { clashCopy } from '../copy'

/** One row of the timeline: time column + ticket-ish card. */
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
  const mins = event.ends_at ? Math.round((+new Date(event.ends_at) - +new Date(event.starts_at)) / 60000) : null
  const clash = clashes.length > 0
  return (
    <Link
      to={`/events/${event.id}`}
      className={`group grid grid-cols-[52px_1fr] gap-3 rounded-2xl transition-opacity ${past ? 'opacity-55 hover:opacity-90' : ''}`}
    >
      <div className="pt-3 text-right font-mono leading-tight tabular-nums">
        {showDate && <p className="text-[10px] uppercase tracking-wider text-muted">{fmtIST(event.starts_at, 'd MMM')}</p>}
        <p className="text-[15px] font-medium">{fmtIST(event.starts_at, 'HH:mm')}</p>
        {event.ends_at && <p className="text-[12px] text-muted">{fmtIST(event.ends_at, 'HH:mm')}</p>}
      </div>
      <div
        className={`relative overflow-hidden rounded-2xl border-[1.5px] bg-card py-3 pl-4 pr-3 transition-[transform,box-shadow] group-hover:-translate-y-px group-hover:shadow-[3px_3px_0_var(--ink)] ${
          clash ? 'border-stamp-red' : 'border-ink'
        }`}
      >
        <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${meta.bar}`} />
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <TypeTag type={event.type} />
              {mins !== null && mins > 0 && (
                <span className="font-mono text-[11px] text-muted">{durationLabel(mins)}</span>
              )}
              {past && event.mood == null && <span className="font-mono text-[11px] text-muted">· done</span>}
            </div>
            <p className="mt-1.5 truncate font-display text-[17px] font-semibold leading-snug tracking-tight">
              {event.company?.name ?? '—'}
            </p>
            <p className="truncate text-[14px] text-ink-2">{event.title}</p>
            {(event.venue || event.link) && (
              <p className="mt-1 flex items-center gap-3 truncate text-[13px] text-muted">
                {event.venue && (
                  <span className="flex min-w-0 items-center gap-1">
                    <IconPin width={14} height={14} className="shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </span>
                )}
                {event.link && (
                  <span className="flex shrink-0 items-center gap-1">
                    <IconLink width={14} height={14} /> link
                  </span>
                )}
              </p>
            )}
          </div>
          {event.company && <CompanyTile company={event.company} size={36} />}
        </div>
        {clash && (
          <p className="mt-2.5 flex items-start gap-1.5 border-t-[1.5px] border-dashed border-stamp-red/40 pt-2 text-[12.5px] leading-snug text-stamp-red">
            <IconAlert width={15} height={15} className="mt-px shrink-0" />
            <span>
              {clashCopy.overlapsWith}{' '}
              {clashes.map((c) => `${c.company?.name ?? c.title} (${fmtIST(c.starts_at, 'HH:mm')})`).join(', ')}
            </span>
          </p>
        )}
      </div>
    </Link>
  )
}

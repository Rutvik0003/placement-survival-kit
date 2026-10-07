import { Link } from 'react-router-dom'
import { CompanyTile } from './Stamps'
import { IconArrow, IconLink, IconPin } from './Icons'
import { useNow } from '../hooks/useNow'
import { interval } from '../lib/clash'
import { EVENT_META } from '../lib/meta'
import { countdown, fmtIST, relDay } from '../lib/time'
import type { EventRow } from '../lib/types'
import { nextUpCopy as c } from '../copy'

/** The pinned "next event" ticket with a live countdown. */
export function NextUp({ event }: { event: EventRow | null }) {
  const now = useNow(1000)
  if (!event) {
    return (
      <div className="rounded-2xl border-[1.5px] border-dashed border-line px-5 py-5">
        <p className="label">{c.kicker}</p>
        <p className="font-display text-lg font-semibold">{c.noneTitle}</p>
        <p className="mt-1 text-[14px] text-muted">{c.noneBody}</p>
      </div>
    )
  }
  const [start, end] = interval(event)
  const t = now.getTime()
  const live = t >= start && t < end
  const ms = live ? end - t : start - t
  const meta = EVENT_META[event.type]

  return (
    <div className="rise relative overflow-hidden rounded-2xl border-[1.5px] border-ink bg-ink text-paper shadow-[4px_4px_0_var(--marker)]">
      <Link to={`/events/${event.id}`} className="block px-5 pb-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/60">
            {live ? (
              <span className="flex items-center gap-2 text-marker">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-marker opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-marker" />
                </span>
                {c.live}
              </span>
            ) : (
              c.kicker
            )}
          </p>
          <span className={`stamp border-paper/30 text-paper/80`}>{meta.label}</span>
        </div>

        <div className="mt-3 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-wider text-paper/50">{live ? c.endsIn : c.startsIn}</p>
            <p className="font-mono text-[44px] font-medium leading-none tracking-[-0.04em] tabular-nums lg:text-[52px]">
              {countdown(ms)}
            </p>
          </div>
          {event.company && <CompanyTile company={event.company} size={48} />}
        </div>

        <div className="perf mt-4 opacity-30" />

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-[19px] font-semibold tracking-tight">
              {event.company?.name}
              <span className="font-sans text-[15px] font-normal text-paper/60"> · {event.title}</span>
            </p>
            <p className="mt-0.5 text-[13px] text-paper/60">
              {relDay(event.starts_at)}, {fmtIST(event.starts_at, 'HH:mm')}
              {event.ends_at && `–${fmtIST(event.ends_at, 'HH:mm')}`}
              {event.venue && (
                <>
                  {' · '}
                  <IconPin width={13} height={13} className="-mt-0.5 inline" /> {event.venue}
                </>
              )}
            </p>
          </div>
          {!event.link && <IconArrow width={20} height={20} className="shrink-0 text-paper/50" />}
        </div>
      </Link>
      {event.link && (
        <a
          href={event.link}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 items-center justify-center gap-2 border-t-[1.5px] border-paper/15 bg-marker font-medium text-marker-ink transition-opacity hover:opacity-90"
        >
          <IconLink width={17} height={17} /> {c.openLink}
        </a>
      )}
    </div>
  )
}

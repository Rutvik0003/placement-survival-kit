import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BackBar } from '../components/BackBar'
import { EmptyState } from '../components/EmptyState'
import { Loading } from '../components/Loading'
import { ConfirmSheet } from '../components/Sheet'
import { MoodPicker } from '../components/MoodPicker'
import { PptRatingForm } from '../components/PptRatingForm'
import { usePptRatings } from '../hooks/fun'
import { CompanyTile, StatusStamp, TypeTag } from '../components/Stamps'
import { useToast } from '../components/Toast'
import { IconAlert, IconChevron, IconEdit, IconLink, IconTrash } from '../components/Icons'
import { useDeleteEvent, useEvent, useEventsBetween, useSaveEvent } from '../hooks/queries'
import { useNow } from '../hooks/useNow'
import { clashesFor, interval } from '../lib/clash'
import { EVENT_META } from '../lib/meta'
import { supabase } from '../lib/supabase'
import { addISTDays, countdown, durationLabel, fmtIST, relDay, startOfISTDay } from '../lib/time'
import { checkinCopy, clashCopy, commonCopy, eventDetailCopy as c, nextUpCopy } from '../copy'

export default function EventDetail() {
  const { id } = useParams()
  const { data: event, isLoading } = useEvent(id)
  const del = useDeleteEvent()
  const navigate = useNavigate()
  const toast = useToast()
  const now = useNow(1000)
  const [confirm, setConfirm] = useState(false)
  const save = useSaveEvent()
  const { data: ratings = [] } = usePptRatings()

  // Opening the event counts as "seen" — cancels the escalating nag.
  useEffect(() => {
    if (!id) return
    supabase
      .from('notifications_sent')
      .update({ acknowledged_at: new Date().toISOString() })
      .eq('event_id', id)
      .is('acknowledged_at', null)
      .then(() => undefined)
  }, [id])

  const dayStart = useMemo(() => addISTDays(startOfISTDay(event?.starts_at ?? Date.now()), -1), [event?.starts_at])
  const { data: nearby = [] } = useEventsBetween(dayStart, addISTDays(dayStart, 3))

  if (isLoading) return <Loading />
  if (!event)
    return (
      <>
        <BackBar fallback="/" />
        <EmptyState title={c.notFound.title} body={c.notFound.body} />
      </>
    )

  const [start, end] = interval(event)
  const t = now.getTime()
  const live = t >= start && t < end
  const upcoming = t < start
  const mins = event.ends_at ? Math.round((end - start) / 60000) : null
  const clashes = clashesFor(event, nearby)
  const meta = EVENT_META[event.type]

  return (
    <div className="mx-auto max-w-2xl">
      <BackBar
        fallback="/"
        right={
          <>
            <Link to={`/events/${event.id}/edit`} className="btn btn-ghost h-10 px-3 text-[14px]">
              <IconEdit width={17} height={17} /> {c.edit}
            </Link>
            <button className="btn btn-ghost h-10 px-3 text-stamp-red" onClick={() => setConfirm(true)} aria-label="Delete">
              <IconTrash width={18} height={18} />
            </button>
          </>
        }
      />

      {/* The ticket */}
      <article className="relative mt-2 overflow-hidden rounded-2xl border-[1.5px] border-ink bg-card shadow-[5px_5px_0_var(--ink)]">
        <span aria-hidden className={`absolute inset-x-0 top-0 h-1.5 ${meta.bar}`} />
        <div className="px-5 pb-5 pt-6">
          <div className="flex items-center gap-2">
            <TypeTag type={event.type} />
            {event.reschedule_count > 0 && (
              <span className="stamp border-stamp-amber text-stamp-amber">{c.rescheduled(event.reschedule_count)}</span>
            )}
          </div>
          <h1 className="mt-3 font-display text-[30px] font-bold leading-[1.05] tracking-[-0.03em]">{event.title}</h1>

          {event.company && (
            <Link
              to={`/companies/${event.company.id}`}
              className="mt-4 flex items-center gap-3 rounded-xl border-[1.5px] border-line px-3 py-2 transition-colors hover:border-ink"
            >
              <CompanyTile company={event.company} size={36} />
              <span className="min-w-0 flex-1 truncate font-medium">{event.company.name}</span>
              <StatusStamp status={event.company.status} />
              <IconChevron width={16} height={16} className="text-muted" />
            </Link>
          )}
        </div>

        <div className="relative">
          <span aria-hidden className="absolute -left-[11px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-[1.5px] border-ink bg-paper" />
          <span aria-hidden className="absolute -right-[11px] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-[1.5px] border-ink bg-paper" />
          <div className="perf mx-5" />
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 px-5 pb-5 pt-5">
          <div className="col-span-2 sm:col-span-1">
            <dt className="label mb-0.5">{c.when}</dt>
            <dd className="font-display text-[18px] font-semibold">{relDay(event.starts_at, now)}</dd>
            <dd className="font-mono text-[14px] tabular-nums text-ink-2">
              {fmtIST(event.starts_at, 'EEE d MMM · HH:mm')}
              {event.ends_at && `–${fmtIST(event.ends_at, 'HH:mm')}`} IST
            </dd>
            {mins !== null && <dd className="text-[13px] text-muted">{durationLabel(mins)}</dd>}
          </div>
          {(live || upcoming) && (
            <div className="col-span-2 sm:col-span-1 sm:text-right">
              <dt className={`label mb-0.5 ${live ? 'text-marker' : ''}`}>{live ? nextUpCopy.endsIn : nextUpCopy.startsIn}</dt>
              <dd className="font-mono text-[34px] font-medium leading-none tracking-[-0.04em] tabular-nums">
                {countdown(live ? end - t : start - t)}
              </dd>
            </div>
          )}
          {event.venue && (
            <div className="col-span-2">
              <dt className="label mb-0.5">{c.venue}</dt>
              <dd className="text-[15px]">{event.venue}</dd>
            </div>
          )}
        </dl>

        {event.link && (
          <div className="flex border-t-[1.5px] border-ink">
            <a
              href={event.link}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 flex-1 items-center justify-center gap-2 bg-marker font-medium text-marker-ink hover:opacity-90"
            >
              <IconLink width={18} height={18} /> {c.openLink}
            </a>
            <button
              className="h-12 border-l-[1.5px] border-ink px-5 font-mono text-[12px] font-semibold uppercase tracking-wider hover:bg-paper-2"
              onClick={async () => {
                await navigator.clipboard?.writeText(event.link!)
                toast.show({ message: c.copied })
              }}
            >
              {c.copyLink}
            </button>
          </div>
        )}
      </article>

      {clashes.length > 0 && (
        <div className="mt-5 flex gap-3 rounded-xl border-[1.5px] border-stamp-red bg-stamp-red/10 px-4 py-3 text-stamp-red">
          <IconAlert width={20} height={20} className="mt-0.5 shrink-0" />
          <div className="text-[14px] leading-snug">
            <p className="font-semibold">{clashCopy.timeline}</p>
            <ul className="mt-1 space-y-0.5">
              {clashes.map((x) => (
                <li key={x.id}>
                  <Link to={`/events/${x.id}`} className="underline decoration-dotted underline-offset-2">
                    {x.company?.name} · {x.title} · {fmtIST(x.starts_at, 'HH:mm')}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!upcoming && event.type !== 'deadline' && (
        <section className="mt-6">
          <p className="label">{checkinCopy.current}</p>
          <MoodPicker
            value={event.mood}
            disabled={save.isPending}
            onPick={async (mood) => {
              await save.mutateAsync({ id: event.id, mood })
              toast.show({ message: checkinCopy.reply[mood], duration: 5000 })
            }}
          />
        </section>
      )}

      {!upcoming && event.type === 'ppt' && (
        <section className="mt-6">
          <PptRatingForm key={ratings.length} eventId={event.id} initial={ratings.find((r) => r.event_id === event.id)} />
        </section>
      )}

      {event.notes && (
        <section className="mt-6">
          <p className="label">{c.notes}</p>
          <p className="whitespace-pre-wrap rounded-2xl border-[1.5px] border-line bg-card px-4 py-3 text-[15px] leading-relaxed">
            {event.notes}
          </p>
        </section>
      )}

      <ConfirmSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title={c.deleteTitle}
        body={c.deleteBody}
        confirmLabel={c.delete}
        cancelLabel={c.cancel}
        busy={del.isPending}
        onConfirm={async () => {
          await del.mutateAsync(event.id)
          toast.show({ message: commonCopy.deleted })
          navigate('/', { replace: true })
        }}
      />
    </div>
  )
}

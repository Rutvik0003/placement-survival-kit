// Decides which notifications are due right now. Pure function — no I/O —
// so it can be tested without a database. The cron runs every 15 minutes;
// windows below are sized so each notification lands in exactly one tick,
// and the dedupe_key makes repeats impossible anyway.

import {
  checkin,
  checkinTitle,
  digestFormalsLine,
  digestNothing,
  digestNothingTitle,
  digestQuip,
  digestTitle,
  earlyMorning,
  headsUp,
  headsUpTitle,
  lateNight,
  nag,
  nagTitle,
  pickLine,
  typeWord,
  type Ctx,
  type NotifEventType,
} from './notificationCopy.ts'

const MIN = 60_000
const IST_OFFSET = 330 * MIN // IST is UTC+5:30, no daylight saving

/** Typical length when an event has no end time. Keep in sync with src/lib/meta.ts. */
const DEFAULT_MINUTES: Record<NotifEventType, number> = { ppt: 60, test: 60, gd: 30, interview: 45, deadline: 0, other: 60 }

export const WINDOWS = {
  headsUp: { from: 2 * MIN, to: 52.5 * MIN }, // first tick inside lands ~38–52 min before
  nag: { from: 2 * MIN, to: 22.5 * MIN, minGapAfterHeadsUp: 10 * MIN },
  checkin: { after: 60 * MIN, giveUpAfter: 12 * 60 * MIN },
  digest: { fromHour: 7, untilHour: 12 },
}

export type PlanEvent = {
  id: string
  type: NotifEventType
  title: string
  starts_at: string
  ends_at: string | null
  link: string | null
  mood: string | null
  company: { name: string } | null
}

export type SentRow = { dedupe_key: string; kind: string; event_id: string | null; sent_at: string; acknowledged_at: string | null }

export type PlanSettings = { quiet_start: string | null; quiet_end: string | null }

export type Planned = {
  kind: 'digest' | 'headsup' | 'nag' | 'checkin'
  event_id: string | null
  dedupe_key: string
  title: string
  body: string
  /** Absolute (event link) or app-relative ("/events/…"). */
  url: string
  tag: string
}

/** IST wall-clock parts for an instant. */
export function istParts(ms: number) {
  const d = new Date(ms + IST_OFFSET)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    hour: d.getUTCHours(),
    minuteOfDay: d.getUTCHours() * 60 + d.getUTCMinutes(),
    hhmm: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  }
}

/** Midnight IST (as a UTC instant) of the IST day containing `ms`. */
export function istDayStart(ms: number) {
  return Math.floor((ms + IST_OFFSET) / (1440 * MIN)) * 1440 * MIN - IST_OFFSET
}

function inQuietHours(ms: number, s: PlanSettings) {
  if (!s.quiet_start || !s.quiet_end) return false
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
  const m = istParts(ms).minuteOfDay
  const a = toMin(s.quiet_start)
  const b = toMin(s.quiet_end)
  return a <= b ? m >= a && m < b : m >= a || m < b
}

const endOf = (e: PlanEvent) =>
  e.ends_at ? Date.parse(e.ends_at) : Date.parse(e.starts_at) + DEFAULT_MINUTES[e.type] * MIN

function ctx(e: PlanEvent, now: number): Ctx {
  return {
    company: e.company?.name ?? 'Something',
    title: e.title,
    mins: Math.max(1, Math.round((Date.parse(e.starts_at) - now) / MIN)),
    time: istParts(Date.parse(e.starts_at)).hhmm,
  }
}

export function plan(now: number, events: PlanEvent[], sent: SentRow[], settings: PlanSettings): Planned[] {
  const out: Planned[] = []
  const sentKeys = new Set(sent.map((s) => s.dedupe_key))
  const add = (p: Planned) => {
    if (!sentKeys.has(p.dedupe_key)) {
      sentKeys.add(p.dedupe_key)
      out.push(p)
    }
  }
  const today = istParts(now)

  // Morning digest
  if (today.hour >= WINDOWS.digest.fromHour && today.hour < WINDOWS.digest.untilHour) {
    const start = istDayStart(now)
    const todays = events
      .filter((e) => Date.parse(e.starts_at) >= start && Date.parse(e.starts_at) < start + 1440 * MIN)
      .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
    const formals = todays.some((e) => e.type === 'ppt' || e.type === 'interview' || e.type === 'gd')
    add({
      kind: 'digest',
      event_id: null,
      dedupe_key: `digest:${today.date}`,
      title: todays.length ? digestTitle(todays.length) : digestNothingTitle,
      body: todays.length
        ? [
            todays
              .slice(0, 4)
              .map((e) => `${istParts(Date.parse(e.starts_at)).hhmm} ${e.company?.name ?? ''} ${e.type === 'other' ? e.title : typeWord[e.type]}`)
              .join(' · ') + (todays.length > 4 ? ` +${todays.length - 4}` : ''),
            pickLine(digestQuip(todays.length)),
            formals ? digestFormalsLine : '',
          ]
            .filter(Boolean)
            .join('\n')
        : pickLine(digestNothing),
      url: '/',
      tag: `digest-${today.date}`,
    })
  }

  for (const e of events) {
    const start = Date.parse(e.starts_at)
    const until = start - now
    const c = ctx(e, now)
    const eventUrl = `/events/${e.id}`

    // Heads-up
    const huKey = `headsup:${e.id}:${start}`
    if (until > WINDOWS.headsUp.from && until <= WINDOWS.headsUp.to) {
      const hour = istParts(start).hour
      const pool = hour < 8 ? [...headsUp[e.type], ...earlyMorning, ...earlyMorning] : hour >= 21 ? [...headsUp[e.type], ...lateNight] : headsUp[e.type]
      add({
        kind: 'headsup',
        event_id: e.id,
        dedupe_key: huKey,
        title: headsUpTitle(e.type, c),
        body: pickLine(pool)(c),
        url: e.link || eventUrl,
        tag: `event-${e.id}`,
      })
    }

    // Nag: heads-up went out a while ago and nobody acknowledged it
    if (until > WINDOWS.nag.from && until <= WINDOWS.nag.to) {
      const hu = sent.find((s) => s.dedupe_key === huKey)
      if (hu && !hu.acknowledged_at && now - Date.parse(hu.sent_at) >= WINDOWS.nag.minGapAfterHeadsUp) {
        add({
          kind: 'nag',
          event_id: e.id,
          dedupe_key: `nag:${e.id}:${start}`,
          title: nagTitle(e.type, c),
          body: pickLine(nag)(c),
          url: e.link || eventUrl,
          tag: `event-${e.id}`,
        })
      }
    }

    // Post-event check-in
    const sinceEnd = now - endOf(e)
    if (
      e.type !== 'deadline' &&
      !e.mood &&
      sinceEnd >= WINDOWS.checkin.after &&
      sinceEnd < WINDOWS.checkin.giveUpAfter &&
      !inQuietHours(now, settings)
    ) {
      add({
        kind: 'checkin',
        event_id: e.id,
        dedupe_key: `checkin:${e.id}`,
        title: checkinTitle(c),
        body: pickLine(checkin)(c),
        url: `/checkin/${e.id}`,
        tag: `checkin-${e.id}`,
      })
    }
  }
  return out
}

// Rules for badges, company nicknames, the chaos meter and Placement Wrapped.
// Pure functions over your data — the copy (names, jokes) lives in src/copy/fun.ts.
import { badgeDefs, nicknameDefs } from '../copy'
import { interval } from './clash'
import { dayKey, fmtIST } from './time'
import type { Company, EventRow } from './types'
import type { HistoryRow, PptRating } from '../hooks/fun'

const DAY = 86_400_000
const hourIST = (d: string) => Number(fmtIST(d, 'H'))
const weekdayIST = (d: string) => Number(fmtIST(d, 'i')) // 1 = Mon … 7 = Sun

// ─── Badges ──────────────────────────────────────────────────────────────

export type BadgeKey = keyof typeof badgeDefs
export const BADGE_KEYS = Object.keys(badgeDefs) as BadgeKey[]

/** Every badge the data currently qualifies for, with the company that triggered it. */
export function qualifyingBadges(companies: Company[], history: HistoryRow[]): Map<BadgeKey, string | null> {
  const out = new Map<BadgeKey, string | null>()
  const give = (k: BadgeKey, companyId: string | null = null) => !out.has(k) && out.set(k, companyId)
  const byId = new Map(companies.map((c) => [c.id, c]))

  // Only count companies that are *still* rejected/ghosted (undo-proof).
  const rejections = history.filter((h) => h.to_status === 'rejected' && byId.get(h.company_id)?.status === 'rejected')
  const ghostings = history.filter((h) => h.to_status === 'ghosted' && byId.get(h.company_id)?.status === 'ghosted')

  if (rejections.length) give('first_rejection', rejections[0].company_id)
  for (const r of rejections) {
    const h = hourIST(r.changed_at)
    const wd = weekdayIST(r.changed_at)
    if (h < 12 && h >= 5) give('rejected_before_lunch', r.company_id)
    if (wd === 1) give('rejected_monday', r.company_id)
    if (wd >= 6) give('rejected_weekend', r.company_id)
    if (h >= 22 || h < 5) give('rejected_night', r.company_id)
    const c = byId.get(r.company_id)
    if (c && dayKey(c.created_at) === dayKey(r.changed_at)) give('speedrun', r.company_id)
    const reachedInterview = history.some((x) => x.company_id === r.company_id && (x.to_status === 'interview' || x.from_status === 'interview'))
    if (reachedInterview) give('so_close', r.company_id)
  }
  const times = rejections.map((r) => Date.parse(r.changed_at)).sort((a, b) => a - b)
  for (let i = 2; i < times.length; i++) if (times[i] - times[i - 2] <= 7 * DAY) give('three_in_week', rejections[i].company_id)
  const perDay = new Map<string, number>()
  for (const r of rejections) perDay.set(dayKey(r.changed_at), (perDay.get(dayKey(r.changed_at)) ?? 0) + 1)
  if ([...perDay.values()].some((n) => n >= 2)) give('double_tap')
  if (rejections.length >= 5) give('frequent_flyer')
  if (rejections.length >= 10) give('loyalty_program')

  if (ghostings.length) give('seen_zoned', ghostings[0].company_id)
  for (const g of ghostings) if ((byId.get(g.company_id)?.ctc_lpa ?? 0) >= 20) give('ghosted_by_unicorn', g.company_id)
  if (ghostings.length >= 3) give('haunted_house')

  if (rejections.length >= 3 && companies.some((c) => c.status === 'offer')) give('plot_armour')
  return out
}

// ─── Company nicknames ───────────────────────────────────────────────────

export type NicknameKey = keyof typeof nicknameDefs

export function companyNicknames(
  company: Company,
  events: EventRow[],
  ratings: PptRating[],
  history: HistoryRow[] = [],
): NicknameKey[] {
  const evs = events.filter((e) => e.company_id === company.id)
  const rate = ratings.filter((r) => evs.some((e) => e.id === r.event_id))
  const out: NicknameKey[] = []
  if (evs.reduce((n, e) => n + e.reschedule_count, 0) >= 2) out.push('rescheduler')
  if (evs.some((e) => e.link_added_at && Date.parse(e.starts_at) - Date.parse(e.link_added_at) < 15 * 60_000))
    out.push('last_minute')
  if (rate.some((r) => r.ran_over)) out.push('monologue')
  if (rate.some((r) => r.could_be_email)) out.push('email')
  if (rate.some((r) => r.snacks_rating === 5)) out.push('snack_royalty')
  if (rate.some((r) => r.snacks_rating === 1)) out.push('snack_desert')
  if (evs.some((e) => e.type !== 'deadline' && hourIST(e.starts_at) >= 21)) out.push('night_shift')
  if (evs.some((e) => hourIST(e.starts_at) < 8)) out.push('early_bird')
  if (evs.length >= 4) out.push('clingy')
  if (company.status === 'ghosted' && history.some((h) => h.company_id === company.id && h.to_status === 'interview'))
    out.push('vanisher')
  return out
}

// ─── Chaos meter ─────────────────────────────────────────────────────────

/** 0–3 level from this week's load. Tests/interviews weigh more; clashes weigh most. */
export function chaosLevel(weekEvents: EventRow[], clashCount: number) {
  const weight = { ppt: 1, test: 1.5, gd: 1, interview: 1.5, deadline: 0.5, other: 0.5 }
  const score = weekEvents.reduce((s, e) => s + weight[e.type], 0) + clashCount * 2
  const level = score < 2 ? 0 : score < 5 ? 1 : score < 9 ? 2 : 3
  return { score, level, fraction: Math.min(1, score / 12) }
}

// ─── Placement Wrapped ───────────────────────────────────────────────────

export type PersonaKey = 'closer' | 'ghost_whisperer' | 'collector' | 'connoisseur' | 'night_owl' | 'optimist' | 'rookie'

export function wrappedStats(
  companies: Company[],
  events: EventRow[],
  history: HistoryRow[],
  ratings: PptRating[],
  formals: string[],
  badges: number,
  samosasPerPpt: number,
) {
  const now = Date.now()
  const past = events.filter((e) => interval(e)[0] <= now)
  const count = (t: EventRow['type']) => past.filter((e) => e.type === t).length

  const perDay = new Map<string, EventRow[]>()
  for (const e of events.filter((e) => e.type !== 'deadline')) perDay.set(dayKey(e.starts_at), [...(perDay.get(dayKey(e.starts_at)) ?? []), e])
  const busiest = [...perDay.entries()].sort((a, b) => b[1].length - a[1].length)[0]

  const ghostMonths = new Map<string, number>()
  for (const h of history.filter((h) => h.to_status === 'ghosted' && companies.find((c) => c.id === h.company_id)?.status === 'ghosted')) {
    const m = fmtIST(h.changed_at, 'MMMM')
    ghostMonths.set(m, (ghostMonths.get(m) ?? 0) + 1)
  }
  const ghostMonth = [...ghostMonths.entries()].sort((a, b) => b[1] - a[1])[0]

  const bestSnack = ratings
    .filter((r) => r.snacks_rating)
    .sort((a, b) => b.snacks_rating! - a.snacks_rating!)
    .map((r) => ({ rating: r.snacks_rating!, company: events.find((e) => e.id === r.event_id)?.company?.name ?? '?' }))[0]

  const moods = { nailed: 0, survived: 0, dont_ask: 0 }
  for (const e of events) if (e.mood) moods[e.mood]++

  const perCompany = new Map<string, number>()
  for (const e of events) perCompany.set(e.company_id, (perCompany.get(e.company_id) ?? 0) + 1)
  const topEntry = [...perCompany.entries()].sort((a, b) => b[1] - a[1])[0]
  const topCo = topEntry ? companies.find((co) => co.id === topEntry[0]) : undefined
  const odd = events.filter((e) => e.type !== 'deadline').filter((e) => {
    const h = hourIST(e.starts_at)
    return h >= 21 || h < 8
  }).length
  const offers = companies.filter((co) => co.status === 'offer').length
  const rejections = companies.filter((co) => co.status === 'rejected').length
  const ghosted = companies.filter((co) => co.status === 'ghosted').length
  const persona: PersonaKey =
    offers > 0
      ? 'closer'
      : ghosted >= 3 && ghosted >= rejections
        ? 'ghost_whisperer'
        : rejections >= 5
          ? 'collector'
          : count('ppt') >= 5
            ? 'connoisseur'
            : events.length >= 4 && odd / events.length >= 0.3
              ? 'night_owl'
              : companies.length >= 10
                ? 'optimist'
                : 'rookie'

  return {
    persona,
    totalEvents: past.length,
    topCompany: topCo && topEntry ? { name: topCo.name, emoji: topCo.emoji, count: topEntry[1] } : null,
    emailPpts: ratings.filter((r) => r.could_be_email).length,
    tiles: companies.slice(0, 12).map((co) => ({ name: co.name, emoji: co.emoji })),
    ghosted,
    companies: companies.length,
    ppt: count('ppt'),
    test: count('test'),
    interview: count('interview'),
    gd: count('gd'),
    busiest: busiest ? { day: busiest[0], count: busiest[1].length } : null,
    ghostMonth: ghostMonth ? { month: ghostMonth[0], count: ghostMonth[1] } : null,
    bestSnack: bestSnack ?? null,
    moods,
    formals: formals.length,
    samosas: count('ppt') * samosasPerPpt,
    rejections,
    badges,
    offers,
  }
}

// ─── Ghost suspects ──────────────────────────────────────────────────────

/** Open companies that have gone quiet for `afterDays`+ (and aren't snoozed). */
export function ghostSuspects(companies: Company[], afterDays: number, now = Date.now()) {
  return companies.filter(
    (c) =>
      !['offer', 'rejected', 'ghosted'].includes(c.status) &&
      now - Date.parse(c.last_contact_at) >= afterDays * DAY &&
      (!c.ghost_suggest_snoozed_until || Date.parse(c.ghost_suggest_snoozed_until) < now),
  )
}

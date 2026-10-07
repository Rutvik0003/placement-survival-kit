import { TZDate } from '@date-fns/tz'
import { addDays, differenceInCalendarDays, format, startOfDay } from 'date-fns'

/** Everything the user sees is in IST. Storage is UTC (timestamptz). */
export const IST = 'Asia/Kolkata'

export function nowIST(): TZDate {
  return TZDate.tz(IST)
}

export function toIST(d: Date | string | number): TZDate {
  return new TZDate(new Date(d).getTime(), IST)
}

/** format() wrapper that always renders in IST. */
export function fmtIST(d: Date | string | number, pattern: string): string {
  return format(toIST(d), pattern)
}

/** Midnight IST of the given instant's IST day. */
export function startOfISTDay(d: Date | string | number = Date.now()): TZDate {
  return startOfDay(toIST(d))
}

export function addISTDays(d: Date | string | number, n: number): TZDate {
  return addDays(toIST(d), n)
}

/** 'yyyy-MM-dd' of the IST calendar day. Handy as a grouping key. */
export function dayKey(d: Date | string | number): string {
  return fmtIST(d, 'yyyy-MM-dd')
}

/** Split an instant into IST form-field values. */
export function istParts(d: Date | string | number) {
  return { date: fmtIST(d, 'yyyy-MM-dd'), time: fmtIST(d, 'HH:mm') }
}

/** Build a real instant from IST form-field values ('2026-10-07', '14:30'). */
export function fromISTParts(date: string, time: string): Date {
  const [y, m, dd] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  return new Date(new TZDate(y, m - 1, dd, h, mi, 0, 0, IST).getTime())
}

/** "Today", "Tomorrow", "Thursday", "Mon, 20 Oct". */
export function relDay(d: Date | string | number, now: Date = nowIST()): string {
  const diff = differenceInCalendarDays(toIST(d), toIST(now))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff < 7) return fmtIST(d, 'EEEE')
  return fmtIST(d, 'EEE, d MMM')
}

export function daysBetween(a: Date | string | number, b: Date | string | number): number {
  return differenceInCalendarDays(toIST(b), toIST(a))
}

/** 2d 4h · 3h 12m · 14:07 (mm:ss under an hour). */
export function countdown(ms: number): string {
  if (ms <= 0) return '00:00'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/** "45 min", "1 h", "1 h 30 min". */
export function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${m} min` : `${h} h`
}

export function greetingIST(d: TZDate = nowIST()): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = d.getHours()
  if (h < 5) return 'night'
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  if (h < 22) return 'evening'
  return 'night'
}

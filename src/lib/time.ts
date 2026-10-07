import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'

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

export function greetingIST(d: TZDate = nowIST()): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = d.getHours()
  if (h < 5) return 'night'
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  if (h < 22) return 'evening'
  return 'night'
}

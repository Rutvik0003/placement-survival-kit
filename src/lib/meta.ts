import type { CompanyStatus, EventType } from './types'
import { statusLabels, eventTypeLabels } from '../copy'

/** The happy path. Rejected / Ghosted are exits, not stages. */
export const PIPELINE: CompanyStatus[] = ['applied', 'shortlisted', 'test', 'interview', 'offer']
export const EXITS: CompanyStatus[] = ['rejected', 'ghosted']
export const ALL_STATUSES: CompanyStatus[] = [...PIPELINE, ...EXITS]

export function nextStatus(s: CompanyStatus): CompanyStatus | null {
  const i = PIPELINE.indexOf(s)
  return i >= 0 && i < PIPELINE.length - 1 ? PIPELINE[i + 1] : null
}

export const isClosed = (s: CompanyStatus) => s === 'offer' || s === 'rejected' || s === 'ghosted'

/** Stamp colours: text + border classes. */
export const STATUS_META: Record<CompanyStatus, { label: string; cls: string; dot: string }> = {
  applied: { label: statusLabels.applied, cls: 'text-stamp-blue border-stamp-blue', dot: 'bg-stamp-blue' },
  shortlisted: { label: statusLabels.shortlisted, cls: 'text-stamp-green border-stamp-green', dot: 'bg-stamp-green' },
  test: { label: statusLabels.test, cls: 'text-stamp-amber border-stamp-amber', dot: 'bg-stamp-amber' },
  interview: { label: statusLabels.interview, cls: 'text-stamp-violet border-stamp-violet', dot: 'bg-stamp-violet' },
  offer: { label: statusLabels.offer, cls: 'text-marker border-marker', dot: 'bg-marker' },
  rejected: { label: statusLabels.rejected, cls: 'text-stamp-red border-stamp-red', dot: 'bg-stamp-red' },
  ghosted: { label: statusLabels.ghosted, cls: 'text-ghost border-ghost', dot: 'bg-ghost' },
}

export const EVENT_TYPES: EventType[] = ['ppt', 'test', 'gd', 'interview', 'deadline', 'other']

export const EVENT_META: Record<EventType, { label: string; cls: string; bar: string }> = {
  ppt: { label: eventTypeLabels.ppt, cls: 'text-stamp-amber border-stamp-amber', bar: 'bg-stamp-amber' },
  test: { label: eventTypeLabels.test, cls: 'text-stamp-blue border-stamp-blue', bar: 'bg-stamp-blue' },
  gd: { label: eventTypeLabels.gd, cls: 'text-stamp-green border-stamp-green', bar: 'bg-stamp-green' },
  interview: { label: eventTypeLabels.interview, cls: 'text-stamp-violet border-stamp-violet', bar: 'bg-stamp-violet' },
  deadline: { label: eventTypeLabels.deadline, cls: 'text-stamp-red border-stamp-red', bar: 'bg-stamp-red' },
  other: { label: eventTypeLabels.other, cls: 'text-muted border-muted', bar: 'bg-muted' },
}

/** Assumed length when an event has no end time (used for clashes + "happening now"). */
export const DEFAULT_MINUTES: Record<EventType, number> = {
  ppt: 60,
  test: 60,
  gd: 30,
  interview: 45,
  deadline: 0,
  other: 60,
}

/** Deterministic tile colour for a company without an emoji. */
const TILE_COLORS = ['#F4E04D', '#FFB4A2', '#B8E0C2', '#BFD3FF', '#E3C8FF', '#FFD59E', '#C9E7F2']
export function tileColor(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return TILE_COLORS[h % TILE_COLORS.length]
}
export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()
}

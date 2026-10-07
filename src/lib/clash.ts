import { DEFAULT_MINUTES } from './meta'
import type { EventRow, EventType } from './types'

type Timed = Pick<EventRow, 'id' | 'type' | 'starts_at' | 'ends_at'>

/** [start, end] in ms. Events without an end get a typical length for their type. */
export function interval(e: Pick<EventRow, 'type' | 'starts_at' | 'ends_at'>): [number, number] {
  const s = new Date(e.starts_at).getTime()
  const end = e.ends_at ? new Date(e.ends_at).getTime() : s + DEFAULT_MINUTES[e.type as EventType] * 60_000
  return [s, Math.max(s, end)]
}

/** Deadlines are a moment, not a slot — they never clash with anything. */
const canClash = (e: Timed) => e.type !== 'deadline'

function overlaps(a: Timed, b: Timed) {
  const [as, ae] = interval(a)
  const [bs, be] = interval(b)
  return as < be && bs < ae
}

/** eventId → the events it overlaps with. Only events with at least one clash are present. */
export function findClashes<T extends Timed>(events: T[]): Map<string, T[]> {
  const out = new Map<string, T[]>()
  const list = events.filter(canClash).sort((a, b) => interval(a)[0] - interval(b)[0])
  for (let i = 0; i < list.length; i++) {
    const [, ie] = interval(list[i])
    for (let j = i + 1; j < list.length; j++) {
      if (interval(list[j])[0] >= ie) break
      if (overlaps(list[i], list[j])) {
        out.set(list[i].id, [...(out.get(list[i].id) ?? []), list[j]])
        out.set(list[j].id, [...(out.get(list[j].id) ?? []), list[i]])
      }
    }
  }
  return out
}

/** Clashes for a draft event that isn't saved yet (or is being edited). */
export function clashesFor<T extends Timed>(draft: Omit<Timed, 'id'> & { id?: string }, others: T[]): T[] {
  if (draft.type === 'deadline') return []
  const d = { ...draft, id: draft.id ?? '__draft__' }
  return others.filter((o) => o.id !== d.id && canClash(o) && overlaps(d, o))
}

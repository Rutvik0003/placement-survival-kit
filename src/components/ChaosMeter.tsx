import { chaosLevel } from '../lib/fun'
import type { EventRow } from '../lib/types'
import { chaosCopy as c } from '../copy'

const SEGMENTS = ['var(--stamp-green)', 'var(--stamp-blue)', 'var(--stamp-amber)', 'var(--stamp-red)']

/** Half-dial gauge of this week's load. */
export function ChaosMeter({ events, clashes }: { events: EventRow[]; clashes: number }) {
  const { level, fraction } = chaosLevel(events, clashes)
  const angle = -90 + fraction * 180
  const r = 34
  const arc = (i: number) => {
    const a0 = Math.PI + (i / 4) * Math.PI + 0.04
    const a1 = Math.PI + ((i + 1) / 4) * Math.PI - 0.04
    return `M ${40 + r * Math.cos(a0)} ${42 + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${40 + r * Math.cos(a1)} ${42 + r * Math.sin(a1)}`
  }
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-card px-4 py-3">
      <svg width="80" height="48" viewBox="0 0 80 48" aria-hidden className="shrink-0">
        {SEGMENTS.map((col, i) => (
          <path key={i} d={arc(i)} fill="none" stroke={col} strokeWidth="7" strokeLinecap="round" opacity={i <= level ? 1 : 0.25} />
        ))}
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '40px 42px', transition: 'transform .8s cubic-bezier(.2,.8,.2,1)' }}>
          <line x1="40" y1="42" x2="40" y2="16" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <circle cx="40" cy="42" r="4" fill="var(--ink)" />
      </svg>
      <div className="min-w-0">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">{c.label}</p>
        <p className="font-display text-[17px] font-semibold leading-tight tracking-tight">{c.levels[level].name}</p>
        <p className="truncate text-[13px] text-muted">{c.detail(events.length, clashes)}</p>
      </div>
    </div>
  )
}

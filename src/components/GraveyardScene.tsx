import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { Company } from '../lib/types'
import { graveyardCopy as c } from '../copy'

/*
 * A moonlit graveyard in CSS 3D (no WebGL, no extra library).
 * Each gravestone is a stack of thin layers in 3D space, so it has real
 * thickness when the scene turns. Drag sideways to orbit; tap a grave.
 */

export type Grave = { company: Company; days: number }

const LAYERS = 9
const LAYER_GAP = 2.2

function hash(s: string) {
  let h = 0
  for (const ch of s) h = (h * 33 + ch.charCodeAt(0)) >>> 0
  return h
}
export const epitaphFor = (id: string) => c.epitaphs[hash(id) % c.epitaphs.length]

// Deterministic starfield, generated once.
const STARS = (() => {
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  return Array.from({ length: 80 }, () => `${Math.round(rnd() * 1400)}px ${Math.round(rnd() * 380)}px 0 ${rnd() > 0.85 ? 1 : 0}px rgba(255,255,255,${(0.35 + rnd() * 0.6).toFixed(2)})`).join(',')
})()

function Stone({
  grave,
  x,
  z,
  w,
  h,
  party,
  index,
}: {
  grave: Grave
  x: number
  z: number
  w: number
  h: number
  party: boolean
  index: number
}) {
  const { company, days } = grave
  const seed = hash(company.id)
  const lean = ((seed % 9) - 4) * 1.1 // a little crooked, like real old graves
  const turn = ((seed >> 3) % 11) - 5
  const shape: CSSProperties = { width: w, height: h, borderRadius: `${w / 2}px ${w / 2}px 5px 5px` }
  return (
    <>
      {/* Shadow on the ground */}
      <div
        aria-hidden
        className="absolute rounded-[50%]"
        style={{
          width: w * 1.5,
          height: w * 0.7,
          left: -w * 0.75,
          top: -w * 0.35,
          background: 'radial-gradient(ellipse, rgba(0,0,0,.55), transparent 70%)',
          transform: `translate3d(${x}px, -1px, ${z}px) rotateX(90deg)`,
        }}
      />
      {/* Dirt mound */}
      <div
        aria-hidden
        className="absolute rounded-[50%]"
        style={{
          width: w * 1.05,
          height: w * 1.25,
          left: -w * 0.525,
          top: 0,
          background: 'radial-gradient(ellipse at 50% 40%, #4a3b2c, #2e251c 60%, transparent 72%)',
          transform: `translate3d(${x}px, -2px, ${z + w * 0.15}px) rotateX(90deg)`,
          transformOrigin: 'top',
        }}
      />
      <button
        data-grave={company.id}
        aria-label={`${company.name}, ${c.daysSilent(days)}`}
        className="grave-stone absolute block cursor-pointer outline-none"
        style={{
          ...shape,
          left: -w / 2,
          top: -h,
          transformStyle: 'preserve-3d',
          transformOrigin: '50% 100%',
          transform: `translate3d(${x}px, 0, ${z}px) rotateY(${turn}deg) rotateZ(${lean}deg)`,
          animationDelay: `${index * 90}ms`,
        }}
      >
        {/* Back layers = thickness */}
        {Array.from({ length: LAYERS }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute inset-0"
            style={{
              ...shape,
              transform: `translateZ(${-(i + 1) * LAYER_GAP}px)`,
              background: i === LAYERS - 1 ? '#4c505c' : `hsl(228 7% ${44 - i * 1.6}%)`,
            }}
          />
        ))}
        {/* Front face */}
        <span
          className="grave-face absolute inset-0 flex flex-col items-center overflow-hidden px-2 text-center"
          style={{ ...shape, paddingTop: h * 0.2 }}
        >
          <span className="font-mono font-bold tracking-[0.3em] text-[#383c47]" style={{ fontSize: Math.max(9, w * 0.1) }}>
            {c.rip}
          </span>
          <span
            className="mt-1 line-clamp-2 font-display font-bold leading-[1.05] tracking-tight text-[#2b2f39]"
            style={{ fontSize: Math.max(11, w * 0.15) }}
          >
            {company.name}
          </span>
          <span className="mt-auto mb-2.5 font-mono text-[#3b3f4a]" style={{ fontSize: Math.max(8.5, w * 0.085) }}>
            {days}d silent
          </span>
          {/* moss */}
          <span aria-hidden className="absolute bottom-0 left-0 h-1/4 w-full bg-[radial-gradient(ellipse_at_20%_100%,#4d6b3c99,transparent_55%),radial-gradient(ellipse_at_85%_100%,#4d6b3c77,transparent_45%)]" />
        </span>
        {party && (
          <svg
            aria-hidden
            viewBox="0 0 40 46"
            className="absolute left-1/2 -translate-x-1/2 -rotate-12"
            style={{ width: w * 0.42, top: -w * 0.36, transform: 'translateZ(2px)' }}
          >
            <path d="M20 2 L37 42 Q20 47 3 42 Z" fill="#ff4f1f" stroke="#16140f" strokeWidth="1.5" />
            <path d="M11 22 L29 22 M7 32 L33 32" stroke="#f4e04d" strokeWidth="3.5" />
            <circle cx="20" cy="3" r="3.5" fill="#f4e04d" stroke="#16140f" strokeWidth="1.2" />
          </svg>
        )}
      </button>
    </>
  )
}

function Sign({ w }: { w: number }) {
  const shape: CSSProperties = { width: w * 1.6, height: w * 0.7, borderRadius: 6 }
  return (
    <>
      <div aria-hidden className="absolute" style={{ width: 8, height: w * 1.1, left: -4, top: -w * 1.1, background: '#5a3e26', transform: 'translateZ(-4px)' }} />
      <div className="absolute" style={{ ...shape, left: -w * 0.8, top: -w * 1.25, transformStyle: 'preserve-3d' }}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="absolute inset-0" style={{ ...shape, transform: `translateZ(${-(i + 1) * 2}px)`, background: '#5a3e26' }} />
        ))}
        <span className="absolute inset-0 grid place-items-center bg-[#8a5f3a] px-2 text-center font-display text-[14px] font-bold leading-tight text-[#2a1a0c]" style={shape}>
          {c.emptySign}
        </span>
      </div>
    </>
  )
}

export function GraveyardScene({ graves, party, onPick }: { graves: Grave[]; party: boolean; onPick: (g: Grave) => void }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(375)
  const [ry, setRy] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ x: number; ry: number; moved: boolean } | null>(null)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const layout = useMemo(() => {
    const cols = width < 520 ? 3 : width < 820 ? 4 : 5
    const shown = graves.slice(0, cols * 4)
    const rows = Math.max(1, Math.ceil(shown.length / cols))
    const sx = Math.min(150, (width / cols) * 0.9)
    const sz = Math.min(170, sx * 1.25)
    const w = Math.min(104, sx * 0.72)
    return {
      w,
      h: w * 1.32,
      items: shown.map((g, i) => {
        const row = Math.floor(i / cols)
        const inRow = Math.min(cols, shown.length - row * cols)
        const col = i % cols
        // Back rows a bit offset so stones don't hide each other.
        const stagger = row % 2 ? sx * 0.25 : 0
        return { g, x: (col - (inRow - 1) / 2) * sx + stagger, z: (rows - 1) * sz * 0.5 - row * sz, i }
      }),
    }
  }, [graves, width])

  return (
    <div
      ref={wrap}
      className="grave-scene relative h-[440px] touch-pan-y select-none overflow-hidden rounded-3xl sm:h-[520px]"
      style={{ perspective: 900, perspectiveOrigin: '50% 30%' }}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, ry, moved: false }
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d) return
        const dx = e.clientX - d.x
        if (Math.abs(dx) > 6) {
          if (!d.moved) {
            d.moved = true
            setDragging(true)
            ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          }
          setRy(Math.max(-40, Math.min(40, d.ry + dx * 0.25)))
        }
      }}
      onPointerUp={(e) => {
        const d = drag.current
        drag.current = null
        setDragging(false)
        if (d && !d.moved) {
          const id = (e.target as HTMLElement).closest('[data-grave]')?.getAttribute('data-grave')
          const g = graves.find((x) => x.company.id === id)
          if (g) onPick(g)
        }
      }}
      onPointerCancel={() => {
        drag.current = null
        setDragging(false)
      }}
    >
      {/* Sky */}
      <div aria-hidden className={`absolute inset-0 ${party ? 'bg-[linear-gradient(#170d2e,#2b1450_55%,#3a1d4a)]' : 'bg-[linear-gradient(#070a16,#141a33_55%,#232a44)]'}`} />
      <div aria-hidden className="grave-stars absolute left-0 top-0 h-px w-px" style={{ boxShadow: STARS }} />
      <div aria-hidden className="absolute right-[9%] top-[8%] h-14 w-14 rounded-full bg-[#f3efdc] shadow-[0_0_40px_10px_#f3efdc55,0_0_120px_40px_#f3efdc22] sm:h-16 sm:w-16">
        <span className="absolute left-3 top-4 h-2.5 w-2.5 rounded-full bg-[#ddd6bd]" />
        <span className="absolute bottom-3 right-4 h-3.5 w-3.5 rounded-full bg-[#ddd6bd]" />
      </div>
      {/* Distant hills */}
      <div aria-hidden className="absolute inset-x-0 top-[44%] h-24 bg-[radial-gradient(ellipse_at_20%_100%,#10162a_60%,transparent_61%),radial-gradient(ellipse_at_75%_100%,#0d1224_55%,transparent_56%)]" />

      {party && (
        <>
          <div aria-hidden className="grave-beams pointer-events-none absolute -inset-[30%] mix-blend-screen" />
          <div aria-hidden className="absolute left-1/2 top-0 h-10 w-px -translate-x-1/2 bg-white/40" />
          <div aria-hidden className="grave-disco absolute left-1/2 top-9 -translate-x-1/2 text-[40px] leading-none">🪩</div>
        </>
      )}

      {/* The 3D world. Origin = centre of the ground. */}
      <div
        className="absolute left-1/2 top-[62%] h-0 w-0"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(-16deg) rotateY(${ry}deg)`,
          transition: dragging ? 'none' : 'transform .6s cubic-bezier(.2,.8,.2,1)',
        }}
      >
        <div className={`${dragging || ry !== 0 ? '' : 'grave-sway'} absolute`} style={{ transformStyle: 'preserve-3d' }}>
          {/* Ground */}
          <div
            aria-hidden
            className="absolute"
            style={{
              width: 1400,
              height: 1400,
              left: -700,
              top: -700,
              transform: 'rotateX(90deg)',
              background: party
                ? 'radial-gradient(circle, #2f3d2a 0%, #1d2a1c 35%, #121a14 55%, transparent 70%)'
                : 'radial-gradient(circle, #26331f 0%, #18231a 35%, #0f1612 55%, transparent 70%)',
            }}
          />
          {layout.items.length === 0 ? (
            <Sign w={layout.w} />
          ) : (
            layout.items.map(({ g, x, z, i }) => (
              <Stone key={g.company.id} grave={g} x={x} z={z} w={layout.w} h={layout.h} party={party} index={i} />
            ))
          )}
        </div>
      </div>

      {/* Fog + ghosts */}
      <div aria-hidden className="grave-fog pointer-events-none absolute inset-x-[-20%] bottom-0 h-[38%]" />
      <div aria-hidden className="grave-fog grave-fog-2 pointer-events-none absolute inset-x-[-20%] bottom-[-6%] h-[30%]" />
      {graves.length > 0 &&
        [18, 52, 80].map((left, n) => (
          <span key={n} aria-hidden className="grave-ghost pointer-events-none absolute bottom-[22%] text-[26px]" style={{ left: `${left}%`, animationDelay: `${n * 3.3}s` }}>
            👻
          </span>
        ))}

      <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center font-mono text-[10.5px] uppercase tracking-[0.2em] text-white/45">
        {graves.length ? c.dragHint : ''}
      </p>
    </div>
  )
}

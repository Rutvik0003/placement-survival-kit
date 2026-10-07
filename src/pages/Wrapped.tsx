import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loading } from '../components/Loading'
import { CompanyTile } from '../components/Stamps'
import { useCompanies } from '../hooks/queries'
import { useAllEvents, useBadges, useFormals, useHistory, usePptRatings } from '../hooks/fun'
import { useSettings } from '../hooks/useSettings'
import { celebrate } from '../lib/confetti'
import { wrappedStats } from '../lib/fun'
import { fmtIST } from '../lib/time'
import { checkinCopy, personas, wrappedCopy as c, wrappedMore as m } from '../copy'

const SLIDE_MS = 7000

// Fixed colours so every slide looks identical in light & dark mode.
const BG = {
  ink: 'bg-[#16140f] text-[#f2eee4]',
  marker: 'bg-[#ff4f1f] text-[#16140f]',
  yellow: 'bg-[#f4e04d] text-[#16140f]',
  blue: 'bg-[#2f5bd3] text-white',
  violet: 'bg-[#6d3fd0] text-white',
  green: 'bg-[#2c7a4b] text-white',
  paper: 'bg-[#f2eee4] text-[#16140f]',
  red: 'bg-[#c8352a] text-white',
  dusk: 'bg-[linear-gradient(160deg,#6d3fd0,#ff4f1f)] text-white',
}
type Theme = keyof typeof BG

// ─── Building blocks ─────────────────────────────────────────────────────

function CountUp({ to, ms = 1300, delay = 250 }: { to: number; ms?: number; delay?: number }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now() + delay
    const tick = (t: number) => {
      const p = Math.max(0, Math.min(1, (t - start) / ms))
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, ms, delay])
  return <>{v}</>
}

/** Staggered entrance. */
function In({ d = 0, children, className = '', as = 'div', style }: { d?: number; children: ReactNode; className?: string; as?: 'div' | 'p' | 'span'; style?: CSSProperties }) {
  const Tag = as
  return (
    <Tag className={`wr-in ${className}`} style={{ animationDelay: `${d}s`, ...style }}>
      {children}
    </Tag>
  )
}

const Kicker = ({ children, d = 0 }: { children: ReactNode; d?: number }) => (
  <In d={d} as="p" className="font-mono text-[12px] font-semibold uppercase tracking-[0.22em] opacity-75">
    {children}
  </In>
)
const Huge = ({ children, d = 0.1, className = '' }: { children: ReactNode; d?: number; className?: string }) => (
  <In d={d} as="p" className={`font-display text-[clamp(96px,30vw,200px)] font-extrabold leading-[0.82] tracking-[-0.065em] ${className}`}>
    {children}
  </In>
)
const H = ({ children, d = 0.2 }: { children: ReactNode; d?: number }) => (
  <In d={d} as="p" className="font-display text-[clamp(28px,7vw,46px)] font-bold leading-[1.02] tracking-[-0.035em]">
    {children}
  </In>
)
const Sub = ({ children, d = 0.45 }: { children: ReactNode; d?: number }) => (
  <In d={d} as="p" className="mt-4 max-w-[30ch] text-[17px] leading-snug opacity-80">
    {children}
  </In>
)

function Blob({ className, style }: { className: string; style?: CSSProperties }) {
  return <div aria-hidden className={`wr-blob pointer-events-none absolute rounded-full ${className}`} style={style} />
}

function Marquee({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute left-[-10%] w-[120%] -rotate-6 overflow-hidden whitespace-nowrap py-2 ${className}`}>
      <div className="wr-marquee inline-block font-display text-[22px] font-extrabold uppercase tracking-tight">
        {Array.from({ length: 8 }, () => text).join(' ✦ ')} ✦ {Array.from({ length: 8 }, () => text).join(' ✦ ')}
      </div>
    </div>
  )
}

function Sticker({ text, className = '' }: { text: string; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 120" className={`wr-spin pointer-events-none absolute ${className}`}>
      <defs>
        <path id="wr-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
      </defs>
      <circle cx="60" cy="60" r="58" fill="currentColor" opacity=".12" />
      <text fontSize="11.5" fontWeight="700" letterSpacing="2.4" fill="currentColor" fontFamily="Geist Mono Variable, monospace">
        <textPath href="#wr-circle">{text.repeat(2)}</textPath>
      </text>
      <text x="60" y="68" textAnchor="middle" fontSize="26">✦</text>
    </svg>
  )
}

// ─── The player ──────────────────────────────────────────────────────────

type Slide = { theme: Theme; body: ReactNode; final?: boolean; confetti?: boolean }

export default function Wrapped() {
  const navigate = useNavigate()
  const companies = useCompanies()
  const events = useAllEvents()
  const history = useHistory()
  const ratings = usePptRatings()
  const formals = useFormals()
  const badges = useBadges()
  const { data: settings } = useSettings()
  const ready = [companies, events, history, ratings, formals, badges].every((q) => q.data)

  const slides = useMemo<Slide[]>(() => {
    if (!ready) return []
    const s = wrappedStats(companies.data!, events.data!, history.data!, ratings.data!, formals.data!, badges.data!.length, settings?.samosas_per_ppt ?? 2)
    const totalMoods = s.moods.nailed + s.moods.survived + s.moods.dont_ask
    const topMood = (['nailed', 'survived', 'dont_ask'] as ('nailed' | 'survived' | 'dont_ask')[]).sort((a, b) => s.moods[b] - s.moods[a])[0]
    const bars = [
      { k: 'ppt' as const, v: s.ppt, col: '#f4e04d' },
      { k: 'test' as const, v: s.test, col: '#ffffff' },
      { k: 'interview' as const, v: s.interview, col: '#ff4f1f' },
      { k: 'gd' as const, v: s.gd, col: '#b8e0c2' },
    ]
    const maxBar = Math.max(1, ...bars.map((b) => b.v))
    const persona = personas[s.persona]
    const busyDate = s.busiest ? s.busiest.day + 'T12:00:00+05:30' : null

    return [
      {
        theme: 'ink',
        body: (
          <>
            <Blob className="-right-16 top-16 h-56 w-56 bg-[#ff4f1f]" />
            <Blob className="-left-10 bottom-24 h-40 w-40 bg-[#f4e04d]" style={{ animationDelay: '-3s' }} />
            <Blob className="right-10 bottom-48 h-16 w-16 bg-[#6d3fd0]" style={{ animationDelay: '-5s' }} />
            <Sticker text={m.sticker} className="left-6 top-24 h-24 w-24 text-[#f2eee4]" />
            <div className="relative">
              {m.introLines.map((line, n) => (
                <In key={line} d={0.15 + n * 0.18} as="p" className={`font-display text-[clamp(56px,17vw,120px)] font-extrabold leading-[0.88] tracking-[-0.06em] ${n === 1 ? 'wr-outline' : ''}`}>
                  {line}
                </In>
              ))}
              <Sub d={0.8}>{c.intro.sub}</Sub>
            </div>
          </>
        ),
      },
      {
        theme: 'marker',
        body: (
          <>
            <Marquee text="Applied · Applied · Applied" className="bottom-24 bg-[#16140f] text-[#ff4f1f]" />
            <Kicker>{m.companiesKicker}</Kicker>
            <Huge><CountUp to={s.companies} /></Huge>
            <H>{s.companies === 1 ? 'company.' : 'companies.'}</H>
            <div className="mt-6 flex max-w-sm flex-wrap gap-2">
              {s.tiles.map((t, n) => (
                <span key={n} className="wr-pop" style={{ animationDelay: `${0.5 + n * 0.06}s` }}>
                  <CompanyTile company={t} size={40} />
                </span>
              ))}
            </div>
          </>
        ),
      },
      {
        theme: 'blue',
        body: (
          <>
            <Kicker>{c.events.title}</Kicker>
            <div className="mt-8 flex h-[260px] items-end gap-3">
              {bars.map((b, n) => (
                <div key={b.k} className="flex flex-1 flex-col items-center">
                  <span className="mb-2 font-display text-[clamp(32px,9vw,52px)] font-extrabold leading-none">
                    <CountUp to={b.v} delay={300 + n * 120} />
                  </span>
                  <div
                    className="wr-bar w-full rounded-t-xl"
                    style={{ height: `${Math.max(8, (b.v / maxBar) * 190)}px`, background: b.col, animationDelay: `${0.2 + n * 0.12}s` }}
                  />
                  <span className="mt-2 font-mono text-[11px] uppercase tracking-widest opacity-80">{c.events[b.k]}</span>
                </div>
              ))}
            </div>
            <Sub d={0.9}>{m.eventsSub(s.totalEvents)}</Sub>
          </>
        ),
      },
      {
        theme: 'yellow',
        body: s.topCompany ? (
          <>
            <Blob className="-right-20 -top-10 h-64 w-64 bg-[#ff4f1f]/25" />
            <Kicker>{m.topKicker}</Kicker>
            <In d={0.15} className="wr-pop mt-6 w-fit -rotate-6">
              <CompanyTile company={s.topCompany} size={128} />
            </In>
            <div className="mt-6">
              <H d={0.35}>{s.topCompany.name}</H>
            </div>
            <Sub>{m.topSub(s.topCompany.count)}</Sub>
          </>
        ) : (
          <>
            <Kicker>{m.topKicker}</Kicker>
            <H>{m.topNone}</H>
          </>
        ),
      },
      {
        theme: 'paper',
        body: (
          <>
            <Kicker>{c.busiest.title}</Kicker>
            {busyDate ? (
              <>
                <In d={0.15} className="wr-tear mt-6 w-[210px] overflow-hidden rounded-2xl border-[3px] border-[#16140f] bg-white text-center shadow-[8px_8px_0_#16140f]">
                  <div className="bg-[#c8352a] py-2 font-mono text-[14px] font-bold uppercase tracking-[0.3em] text-white">{fmtIST(busyDate, 'MMM')}</div>
                  <div className="py-3 font-display text-[110px] font-extrabold leading-[0.9] tracking-[-0.06em]">{fmtIST(busyDate, 'd')}</div>
                  <div className="border-t-2 border-dashed border-[#16140f]/20 py-2 font-mono text-[13px] uppercase tracking-widest">{fmtIST(busyDate, 'EEEE')}</div>
                </In>
                <Sub d={0.6}>{c.busiest.sub(s.busiest!.count)}</Sub>
              </>
            ) : (
              <H>Nothing yet. A calm season, or an empty app.</H>
            )}
          </>
        ),
      },
      {
        theme: 'violet',
        body: (
          <>
            {[12, 70, 40, 85, 25].map((left, n) => (
              <span key={n} aria-hidden className="wr-ghost pointer-events-none absolute text-[40px]" style={{ left: `${left}%`, top: `${15 + n * 14}%`, animationDelay: `${n * -1.3}s` }}>
                👻
              </span>
            ))}
            <Kicker>{c.ghosts.title}</Kicker>
            {s.ghostMonth ? (
              <>
                <Huge className="text-[clamp(64px,19vw,140px)]">{s.ghostMonth.month}</Huge>
                <Sub>{c.ghosts.sub(s.ghostMonth.count)}</Sub>
              </>
            ) : (
              <H>{c.ghosts.none}</H>
            )}
          </>
        ),
      },
      {
        theme: 'yellow',
        body: (
          <>
            {Array.from({ length: 16 }, (_, n) => (
              <span
                key={n}
                aria-hidden
                className="wr-rain pointer-events-none absolute top-0 text-[30px]"
                style={{ left: `${(n * 61) % 100}%`, animationDelay: `${(n * 0.37) % 3}s`, animationDuration: `${2.6 + (n % 4) * 0.5}s` }}
              >
                🥟
              </span>
            ))}
            <Kicker>{c.snacks.title}</Kicker>
            {s.bestSnack ? (
              <>
                <In d={0.1} as="p" className="mt-4 text-[clamp(40px,11vw,64px)] leading-none">
                  {'🥟'.repeat(s.bestSnack.rating)}
                  <span className="opacity-25">{'🥟'.repeat(5 - s.bestSnack.rating)}</span>
                </In>
                <div className="mt-4">
                  <H>{s.bestSnack.company}</H>
                </div>
                <Sub>{c.snacks.sub(s.bestSnack.rating)}</Sub>
                {s.emailPpts > 0 && (
                  <In d={0.7} as="p" className="mt-6 w-fit rotate-[-2deg] rounded-xl bg-[#16140f] px-4 py-2 font-medium text-[#f4e04d]">
                    📧 {m.emailLine(s.emailPpts)}
                  </In>
                )}
              </>
            ) : (
              <H>{c.snacks.none}</H>
            )}
          </>
        ),
      },
      {
        theme: 'green',
        body: (
          <>
            <Kicker>{c.moods.title}</Kicker>
            {totalMoods ? (
              <>
                <In d={0.1} as="p" className="wr-pop mt-4 text-[110px] leading-none">
                  {checkinCopy.moods[topMood].emoji}
                </In>
                <H d={0.3}>{m.moodsTop[topMood]}</H>
                <div className="mt-8 space-y-3">
                  {(['nailed', 'survived', 'dont_ask'] as const).map((k, n) => (
                    <div key={k} className="flex items-center gap-3">
                      <span className="w-9 text-[28px] leading-none">{checkinCopy.moods[k].emoji}</span>
                      <div className="h-8 flex-1 overflow-hidden rounded-full bg-white/15">
                        <div
                          className="wr-grow flex h-full items-center justify-end rounded-full bg-white px-3 font-mono text-[13px] font-bold text-[#2c7a4b]"
                          style={{ width: `${Math.max(12, (s.moods[k] / totalMoods) * 100)}%`, animationDelay: `${0.5 + n * 0.15}s` }}
                        >
                          {s.moods[k]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <H>{c.moods.none}</H>
            )}
          </>
        ),
      },
      {
        theme: 'ink',
        body: (
          <>
            <Marquee text="Iron · Shirt · Tie · Repeat" className="top-28 bg-[#f4e04d] text-[#16140f]" />
            <In d={0.05} as="p" className="wr-bounce text-[72px] leading-none">👔</In>
            <Huge><CountUp to={s.formals} /></Huge>
            <H>{c.formals.title}</H>
            <Sub>{c.formals.sub(s.formals)}</Sub>
          </>
        ),
      },
      {
        theme: 'marker',
        body: (
          <>
            <Kicker>{c.samosas.title}</Kicker>
            <Huge><CountUp to={s.samosas} ms={1600} /></Huge>
            <div className="mt-4 flex max-w-sm flex-wrap gap-0.5 text-[22px] leading-none">
              {Array.from({ length: Math.min(40, s.samosas) }, (_, n) => (
                <span key={n} className="wr-pop" style={{ animationDelay: `${0.3 + n * 0.035}s` }}>
                  🥟
                </span>
              ))}
            </div>
            <Sub d={0.9}>{c.samosas.sub}</Sub>
          </>
        ),
      },
      {
        theme: 'red',
        body: (
          <>
            {Array.from({ length: Math.min(6, s.rejections) }, (_, n) => (
              <span
                key={n}
                aria-hidden
                className="wr-slam pointer-events-none absolute rounded-md border-[3px] border-white/70 px-3 py-1 font-mono text-[20px] font-extrabold tracking-[0.2em] text-white/70"
                style={{ left: `${8 + ((n * 37) % 55)}%`, top: `${10 + ((n * 23) % 30)}%`, rotate: `${((n * 47) % 40) - 20}deg`, animationDelay: `${0.4 + n * 0.22}s` }}
              >
                {m.stamp}
              </span>
            ))}
            <div className="mt-auto" />
            <Huge><CountUp to={s.rejections} /></Huge>
            <H>{c.rejections.title}</H>
            <Sub>{c.rejections.sub(s.badges)}</Sub>
          </>
        ),
      },
      {
        theme: 'dusk',
        body: (
          <>
            <Sticker text="PERSONA · PERSONA · " className="right-6 top-24 h-24 w-24 text-white" />
            <Kicker>{m.personaKicker}</Kicker>
            <In d={0.15} as="p" className="wr-pop mt-4 text-[120px] leading-none">{persona.emoji}</In>
            <div className="mt-4">
              <H d={0.35}>{persona.name}</H>
            </div>
            <Sub d={0.55}>{persona.line}</Sub>
          </>
        ),
      },
      {
        theme: 'ink',
        final: true,
        confetti: s.offers > 0,
        body: (
          <In d={0.05} className="wr-card mx-auto w-full max-w-sm rotate-[-1.5deg] rounded-3xl bg-[#f2eee4] p-6 text-[#16140f] shadow-[10px_10px_0_#ff4f1f]">
            <div className="flex items-center justify-between font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] opacity-60">
              <span>{c.kicker}</span>
              <span>{new Date().getFullYear()}</span>
            </div>
            <p className="mt-4 text-[44px] leading-none">{persona.emoji}</p>
            <p className="mt-2 font-display text-[28px] font-extrabold leading-tight tracking-[-0.03em]">{persona.name}</p>
            <div className="mt-5 grid grid-cols-3 gap-y-4 border-t-2 border-dashed border-[#16140f]/20 pt-4">
              {(
                [
                  ['companies', s.companies],
                  ['events', s.totalEvents],
                  ['offers', s.offers],
                  ['rejections', s.rejections],
                  ['samosas', s.samosas],
                  ['formals', s.formals],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <p className="font-display text-[30px] font-extrabold leading-none tracking-tight">{v}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest opacity-60">{m.summaryLabels[k]}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[14px] leading-snug opacity-75">{c.outro.sub(s.offers)}</p>
            <p className="mt-4 font-display text-[13px] font-bold">Placement Survival Kit ✦</p>
          </In>
        ),
      },
    ]
  }, [ready]) // eslint-disable-line react-hooks/exhaustive-deps

  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const start = useRef<{ x: number; t: number } | null>(null)
  const last = slides.length - 1
  const go = useCallback((n: number) => setI((cur) => Math.max(0, Math.min(last, cur + n))), [last])

  useEffect(() => {
    if (!slides.length || paused || i === last) return
    const t = setTimeout(() => go(1), SLIDE_MS)
    return () => clearTimeout(t)
  }, [i, paused, slides.length, last, go])

  useEffect(() => {
    if (slides[i]?.final) {
      const t = setTimeout(() => slides[i].confetti && celebrate(), 500)
      return () => clearTimeout(t)
    }
  }, [i, slides])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') go(1)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'Escape') navigate(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, navigate])

  if (!ready) return <Loading fullscreen />
  const slide = slides[i]

  return (
    <div
      className={`fixed inset-0 z-50 flex select-none flex-col overflow-hidden transition-colors duration-500 ${BG[slide.theme]}`}
      onPointerDown={(e) => {
        start.current = { x: e.clientX, t: Date.now() }
        setPaused(true)
      }}
      onPointerUp={(e) => {
        setPaused(false)
        const s = start.current
        start.current = null
        if (!s || (e.target as HTMLElement).closest('button')) return
        const dx = e.clientX - s.x
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
        else if (Date.now() - s.t < 400) go(e.clientX < window.innerWidth / 3 ? -1 : 1)
      }}
    >
      <div className="pt-safe relative z-10 px-3 pt-3">
        <div className="flex gap-1">
          {slides.map((_, n) => (
            <div key={n} className="h-[3px] flex-1 overflow-hidden rounded-full bg-current/25">
              <div
                key={`${n}-${i}`}
                className="h-full rounded-full bg-current"
                style={{
                  width: n < i || (n === i && i === last) ? '100%' : n > i ? '0%' : undefined,
                  animation: n === i && i !== last ? `wrapped-progress ${SLIDE_MS}ms linear forwards` : undefined,
                  animationPlayState: paused ? 'paused' : 'running',
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-70">{c.kicker}</p>
          <button aria-label={c.outro.close} className="grid h-9 w-9 place-items-center rounded-full text-[22px] hover:bg-black/10" onClick={() => navigate(-1)}>
            ×
          </button>
        </div>
      </div>

      <div key={i} className="relative mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-7 pb-14">
        {slide.body}
        {slide.final && (
          <div className="wr-in relative mt-8 flex justify-center gap-3" style={{ animationDelay: '.6s' }}>
            <button className="btn bg-[#ff4f1f] font-semibold text-[#16140f]" onClick={() => setI(0)}>
              ↺ {c.outro.again}
            </button>
            <button className="btn border border-current" onClick={() => navigate(-1)}>
              {c.outro.close}
            </button>
          </div>
        )}
      </div>
      {i === 0 && <p className="pb-safe relative pb-6 text-center font-mono text-[11px] uppercase tracking-widest opacity-60">{c.tapHint}</p>}
    </div>
  )
}

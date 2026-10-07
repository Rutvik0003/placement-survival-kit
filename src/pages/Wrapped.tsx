import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loading } from '../components/Loading'
import { useCompanies } from '../hooks/queries'
import { useAllEvents, useBadges, useFormals, useHistory, usePptRatings } from '../hooks/fun'
import { useSettings } from '../hooks/useSettings'
import { celebrate } from '../lib/confetti'
import { wrappedStats } from '../lib/fun'
import { fmtIST } from '../lib/time'
import { checkinCopy, wrappedCopy as c } from '../copy'

const SLIDE_MS = 6500

// Fixed colours (not theme tokens) so every slide looks the same in light & dark.
const THEMES = {
  ink: 'bg-[#16140f] text-[#f2eee4]',
  marker: 'bg-[#ff4f1f] text-[#16140f]',
  yellow: 'bg-[#f4e04d] text-[#16140f]',
  blue: 'bg-[#2f5bd3] text-white',
  violet: 'bg-[#7b4fd6] text-white',
  green: 'bg-[#2c7a4b] text-white',
  paper: 'bg-[#f2eee4] text-[#16140f]',
  red: 'bg-[#c8352a] text-white',
}

type Slide = { theme: keyof typeof THEMES; body: ReactNode; final?: boolean }

function Big({ children }: { children: ReactNode }) {
  return <p className="font-display text-[clamp(88px,26vw,180px)] font-extrabold leading-[0.85] tracking-[-0.06em]">{children}</p>
}
function Title({ children }: { children: ReactNode }) {
  return <p className="font-display text-[clamp(26px,6.5vw,44px)] font-bold leading-[1.05] tracking-[-0.03em]">{children}</p>
}
function Sub({ children }: { children: ReactNode }) {
  return <p className="mt-4 max-w-[30ch] text-[17px] leading-snug opacity-75">{children}</p>
}

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
    const s = wrappedStats(
      companies.data!,
      events.data!,
      history.data!,
      ratings.data!,
      formals.data!,
      badges.data!.length,
      settings?.samosas_per_ppt ?? 2,
    )
    const totalMoods = s.moods.nailed + s.moods.survived + s.moods.dont_ask
    const co = c.companies(s.companies)
    return [
      { theme: 'ink', body: <><Title>{c.intro.title}</Title><Sub>{c.intro.sub}</Sub></> },
      { theme: 'marker', body: <><Big>{co.big}</Big><Title>{co.title}</Title><Sub>{co.sub}</Sub></> },
      {
        theme: 'blue',
        body: (
          <>
            <Title>{c.events.title}</Title>
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6">
              {(['ppt', 'test', 'interview', 'gd'] as const).map((k) => (
                <div key={k}>
                  <p className="font-display text-[clamp(56px,15vw,96px)] font-extrabold leading-none tracking-[-0.05em]">{s[k]}</p>
                  <p className="font-mono text-[13px] uppercase tracking-widest opacity-80">{c.events[k]}</p>
                </div>
              ))}
            </div>
          </>
        ),
      },
      {
        theme: 'yellow',
        body: s.busiest ? (
          <>
            <p className="font-mono text-[13px] uppercase tracking-widest opacity-70">{c.busiest.title}</p>
            <p className="mt-3 font-display text-[clamp(52px,14vw,104px)] font-extrabold leading-[0.9] tracking-[-0.05em]">
              {fmtIST(s.busiest.day + 'T12:00:00+05:30', 'EEE')}
              <br />
              {fmtIST(s.busiest.day + 'T12:00:00+05:30', 'd MMM')}
            </p>
            <Sub>{c.busiest.sub(s.busiest.count)}</Sub>
          </>
        ) : (
          <><Title>{c.busiest.title}</Title><Sub>Nothing yet. A calm season, or an empty app.</Sub></>
        ),
      },
      {
        theme: 'violet',
        body: (
          <>
            <p className="font-mono text-[13px] uppercase tracking-widest opacity-70">{c.ghosts.title}</p>
            {s.ghostMonth ? (
              <>
                <p className="mt-3 font-display text-[clamp(60px,16vw,120px)] font-extrabold leading-[0.9] tracking-[-0.05em]">👻 {s.ghostMonth.month}</p>
                <Sub>{c.ghosts.sub(s.ghostMonth.count)}</Sub>
              </>
            ) : (
              <Title>{c.ghosts.none}</Title>
            )}
          </>
        ),
      },
      {
        theme: 'paper',
        body: (
          <>
            <p className="font-mono text-[13px] uppercase tracking-widest opacity-70">{c.snacks.title}</p>
            {s.bestSnack ? (
              <>
                <p className="mt-3 text-[clamp(44px,12vw,80px)] leading-none">{'🥟'.repeat(s.bestSnack.rating)}</p>
                <Title>{s.bestSnack.company}</Title>
                <Sub>{c.snacks.sub(s.bestSnack.rating)}</Sub>
              </>
            ) : (
              <Title>{c.snacks.none}</Title>
            )}
          </>
        ),
      },
      {
        theme: 'green',
        body: (
          <>
            <Title>{c.moods.title}</Title>
            {totalMoods ? (
              <div className="mt-8 space-y-4">
                {(['nailed', 'survived', 'dont_ask'] as const).map((m) => (
                  <div key={m} className="flex items-center gap-3">
                    <span className="w-10 text-[34px] leading-none">{checkinCopy.moods[m].emoji}</span>
                    <div className="h-9 flex-1 overflow-hidden rounded-full bg-white/15">
                      <div
                        className="flex h-full items-center rounded-full bg-white/90 px-3 font-mono text-[14px] font-semibold text-[#2c7a4b]"
                        style={{ width: `${Math.max(14, (s.moods[m] / totalMoods) * 100)}%` }}
                      >
                        {s.moods[m]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Sub>{c.moods.none}</Sub>
            )}
          </>
        ),
      },
      { theme: 'ink', body: <><p className="text-[56px] leading-none">👔</p><Big>{s.formals}</Big><Title>{c.formals.title}</Title><Sub>{c.formals.sub(s.formals)}</Sub></> },
      { theme: 'yellow', body: <><Big>{s.samosas}</Big><Title>🥟 {c.samosas.title}</Title><Sub>{c.samosas.sub}</Sub></> },
      { theme: 'red', body: <><Big>{s.rejections}</Big><Title>{c.rejections.title}</Title><Sub>{c.rejections.sub(s.badges)}</Sub></> },
      { theme: 'marker', final: true, body: <><Title>{c.outro.offers(s.offers)}</Title><Sub>{c.outro.sub(s.offers)}</Sub></> },
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
    if (i === last && slides[last]?.final) celebrate()
  }, [i, last, slides])

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
      className={`fixed inset-0 z-50 flex select-none flex-col transition-colors duration-500 ${THEMES[slide.theme]}`}
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
      {/* Story progress */}
      <div className="pt-safe px-3 pt-3">
        <div className="flex gap-1">
          {slides.map((_, n) => (
            <div key={n} className="h-[3px] flex-1 overflow-hidden rounded-full bg-current/25">
              <div
                key={`${n}-${i}`}
                className="h-full rounded-full bg-current"
                style={{
                  width: n < i ? '100%' : n > i ? '0%' : undefined,
                  animation: n === i && i !== last ? `wrapped-progress ${SLIDE_MS}ms linear forwards` : undefined,
                  animationPlayState: paused ? 'paused' : 'running',
                  ...(n === i && i === last ? { width: '100%' } : {}),
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

      <div key={i} className="rise mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-7 pb-16">
        {slide.body}
        {slide.final && (
          <div className="mt-10 flex gap-3">
            <button className="btn bg-[#16140f] text-white" onClick={() => setI(0)}>
              {c.outro.again}
            </button>
            <button className="btn border border-current" onClick={() => navigate(-1)}>
              {c.outro.close}
            </button>
          </div>
        )}
      </div>
      {i === 0 && <p className="pb-safe pb-6 text-center font-mono text-[11px] uppercase tracking-widest opacity-60">{c.tapHint}</p>}
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import type { AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { authCopy as c } from '../copy'
import { Ticket } from '../components/Ticket'
import { LogoMark } from '../components/Logo'
import { IconArrow } from '../components/Icons'
import { fmtIST, nowIST } from '../lib/time'

function explain(err: AuthError) {
  const msg = err.message.toLowerCase()
  if (msg.includes('invalid login credentials')) return c.errors.badLogin
  if (msg.includes('email not confirmed')) return c.errors.notConfirmed
  if (msg.includes('api key') || err.status === 401) return c.errors.badKey
  if (err.status === 429 || msg.includes('rate')) return c.errors.rate
  if (msg.includes('fetch') || msg.includes('network')) return c.errors.network
  return `${c.errors.generic} (${err.message})`
}

const stamps = [
  { label: 'Applied', cls: 'text-stamp-blue border-stamp-blue', rot: '-rotate-6' },
  { label: 'Shortlisted', cls: 'text-stamp-green border-stamp-green', rot: 'rotate-3' },
  { label: 'Ghosted', cls: 'text-ghost border-ghost', rot: '-rotate-2' },
  { label: 'Rejected', cls: 'text-stamp-red border-stamp-red', rot: 'rotate-6' },
  { label: 'Offer', cls: 'text-marker border-marker', rot: '-rotate-3' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setError(explain(error))
    // On success, AuthProvider picks up the session and the app renders.
  }

  return (
    <main className="pt-safe pb-safe mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:px-12">
      {/* Left: the poster */}
      <section className="rise">
        <div className="flex items-center gap-2.5">
          <LogoMark size={28} />
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{c.kicker}</p>
        </div>
        <h1 className="mt-6 font-display text-[clamp(44px,11vw,96px)] font-extrabold leading-[0.9] tracking-[-0.045em]">
          Placement
          <br />
          <span className="hl">Survival</span>
          <br />
          Kit<span className="text-marker">.</span>
        </h1>
        <p className="mt-6 max-w-[42ch] text-[16px] leading-relaxed text-ink-2 lg:text-[17px]">{c.subtitle}</p>
        <ul className="mt-7 flex flex-wrap gap-x-3 gap-y-3" aria-hidden>
          {stamps.map((s, i) => (
            <li
              key={s.label}
              className={`stamp stamp-in bg-card/60 ${s.cls} ${s.rot}`}
              style={{ animationDelay: `${250 + i * 90}ms` }}
            >
              {s.label}
            </li>
          ))}
        </ul>
      </section>

      {/* Right: the admit card */}
      <section className="rise mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end" style={{ animationDelay: '120ms' }}>
        <Ticket notchAt="76px" className="shadow-[6px_6px_0_var(--ink)]">
          <div className="flex items-center justify-between px-6 pb-5 pt-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Admit one</p>
              <p className="mt-0.5 font-display text-lg font-semibold">Candidate login</p>
            </div>
            <div className="text-right font-mono text-[11px] leading-tight text-muted">
              <p>SEAT 001</p>
              <p>{fmtIST(nowIST(), 'dd MMM yy').toUpperCase()}</p>
            </div>
          </div>
          <div className="perf mx-4" />

          <form onSubmit={signIn} className="space-y-4 px-6 pb-6 pt-5">
            <div>
              <label htmlFor="email" className="label">
                {c.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                required
                className="field"
                placeholder={c.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="label">
                {c.passwordLabel}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-marker w-full" disabled={busy || !email || !password}>
              {busy ? c.submitting : c.submit}
              {!busy && <IconArrow width={18} height={18} />}
            </button>
          </form>

          {error && (
            <p role="alert" className="mx-6 mb-6 -mt-1 rounded-lg border-[1.5px] border-stamp-red/40 bg-stamp-red/8 px-3 py-2.5 text-[14px] text-stamp-red">
              {error}
            </p>
          )}
        </Ticket>
        <p className="mt-6 text-center font-mono text-[11px] text-muted lg:text-right">{c.footer}</p>
      </section>
    </main>
  )
}

import { useState, type FormEvent } from 'react'
import type { AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { authCopy as c } from '../copy'
import { Ticket } from '../components/Ticket'
import { LogoMark } from '../components/Logo'
import { IconArrow } from '../components/Icons'
import { fmtIST, nowIST } from '../lib/time'

function explain(err: AuthError, stage: 'send' | 'verify') {
  const msg = err.message.toLowerCase()
  if (err.status === 429 || msg.includes('rate')) return c.errors.rate
  if (msg.includes('signup') || msg.includes('not allowed')) return c.errors.signupsClosed
  if (stage === 'verify') return c.errors.badCode
  return c.errors.generic
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
  const [code, setCode] = useState('')
  const [stage, setStage] = useState<'email' | 'code'>('email')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendCode(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setBusy(false)
    if (error) return setError(explain(error, 'send'))
    setStage('code')
  }

  async function verify(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
    setBusy(false)
    if (error) setError(explain(error, 'verify'))
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

          {stage === 'email' ? (
            <form onSubmit={sendCode} className="space-y-4 px-6 pb-6 pt-5">
              <div>
                <label htmlFor="email" className="label">
                  {c.emailLabel}
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  className="field"
                  placeholder={c.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-marker w-full" disabled={busy || !email}>
                {busy ? c.sending : c.send}
                {!busy && <IconArrow width={18} height={18} />}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4 px-6 pb-6 pt-5">
              <div>
                <p className="font-display text-lg font-semibold">{c.codeSentTitle}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-muted">{c.codeSentBody(email.trim())}</p>
              </div>
              <div>
                <label htmlFor="code" className="label">
                  {c.codeLabel}
                </label>
                <input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6,10}"
                  maxLength={10}
                  required
                  autoFocus
                  className="field text-center font-mono text-2xl tracking-[0.4em]"
                  placeholder="••••••"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button type="submit" className="btn btn-marker w-full" disabled={busy || code.length < 6}>
                {busy ? c.verifying : c.verify}
              </button>
              <button
                type="button"
                className="btn btn-ghost h-9 w-full text-[14px]"
                onClick={() => {
                  setStage('email')
                  setCode('')
                  setError(null)
                }}
              >
                {c.resend}
              </button>
            </form>
          )}

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

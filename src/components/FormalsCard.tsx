import { useState } from 'react'
import { useFormals, useLogFormals } from '../hooks/fun'
import { formalsCopy as c } from '../copy'

/** Asks "Formals today?" on PPT/GD/interview days. One tap logs it. */
export function FormalsCard({ today }: { today: string }) {
  const { data: days = [] } = useFormals()
  const log = useLogFormals()
  const key = `psk-formals-no-${today}`
  const [declined, setDeclined] = useState(() => {
    try {
      return localStorage.getItem(key) === '1'
    } catch {
      return false
    }
  })
  const logged = days.includes(today)
  if (declined && !logged) return null

  if (logged) {
    const n = days.length
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3">
        <span className="text-[26px] leading-none">👔</span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{c.count(n)}</p>
          {c.milestones[n] && <p className="text-[13px] text-muted">{c.milestones[n]}</p>}
        </div>
        <button className="shrink-0 rounded-lg px-2 py-1 text-[12px] text-muted hover:bg-paper-2" onClick={() => log.mutate({ day: today, on: false })}>
          Undo
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-3 sm:flex sm:items-center sm:gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="text-[26px] leading-none">👔</span>
        <div className="min-w-0">
          <p className="font-medium">{c.ask}</p>
          <p className="text-[13px] text-muted">{c.askHint}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-0 sm:flex sm:shrink-0">
        <button
          className="btn h-9 border border-line px-3 text-[13px] text-muted hover:bg-paper-2"
          onClick={() => {
            setDeclined(true)
            try {
              localStorage.setItem(key, '1')
            } catch {
              /* ignore */
            }
          }}
        >
          {c.no}
        </button>
        <button className="btn btn-primary h-9 px-3 text-[13px]" onClick={() => log.mutate({ day: today, on: true })}>
          {c.yes}
        </button>
      </div>
    </div>
  )
}

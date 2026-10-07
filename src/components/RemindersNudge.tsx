import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconBell } from './Icons'
import { usePushState } from '../hooks/usePush'
import { notifCopy as c } from '../copy'

const KEY = 'psk-nudge-dismissed'

/** One quiet line on Today when this device won't get reminders. */
export function RemindersNudge() {
  const { state } = usePushState()
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1'
    } catch {
      return false
    }
  })
  if (hidden || (state !== 'off' && state !== 'ios-needs-install')) return null
  return (
    <div className="rise mb-5 flex items-center gap-3 rounded-xl border border-line bg-card py-2 pl-3 pr-1.5 text-[14px]">
      <IconBell width={17} height={17} className="shrink-0 text-marker" />
      <span className="min-w-0 flex-1 text-ink-2">{state === 'off' ? c.nudge.text : c.nudge.ios}</span>
      <Link to="/settings#notifications" className="shrink-0 rounded-lg px-2.5 py-1.5 font-medium text-ink hover:bg-paper-2">
        {c.nudge.cta}
      </Link>
      <button
        aria-label="Dismiss"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-paper-2"
        onClick={() => {
          setHidden(true)
          try {
            localStorage.setItem(KEY, '1')
          } catch {
            /* ignore */
          }
        }}
      >
        ×
      </button>
    </div>
  )
}

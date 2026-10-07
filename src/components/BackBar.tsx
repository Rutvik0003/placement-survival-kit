import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { IconBack } from './Icons'
import { commonCopy } from '../copy'

/** Back button that falls back to `fallback` when the page was opened directly (e.g. from a notification). */
export function BackBar({ fallback = '/', right }: { fallback?: string; right?: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <div className="-mx-2 flex h-12 items-center justify-between">
      <button
        onClick={() => (location.key === 'default' ? navigate(fallback, { replace: true }) : navigate(-1))}
        className="flex h-10 items-center gap-1 rounded-lg px-2 text-[15px] font-medium text-ink-2 hover:bg-paper-2"
      >
        <IconBack width={20} height={20} />
        {commonCopy.back}
      </button>
      {right && <div className="flex items-center gap-1">{right}</div>}
    </div>
  )
}

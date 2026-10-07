import { Sheet } from './Sheet'
import { EXITS, PIPELINE, STATUS_META } from '../lib/meta'
import type { CompanyStatus } from '../lib/types'
import { statusCopy } from '../copy'

export function StatusPicker({
  open,
  onClose,
  current,
  onPick,
  companyName,
}: {
  open: boolean
  onClose: () => void
  current: CompanyStatus
  onPick: (s: CompanyStatus) => void
  companyName: string
}) {
  const row = (s: CompanyStatus, i?: number) => {
    const m = STATUS_META[s]
    const active = s === current
    return (
      <li key={s}>
        <button
          onClick={() => {
            onPick(s)
            onClose()
          }}
          aria-pressed={active}
          className={`flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-medium transition-colors ${
            active ? 'bg-ink text-paper' : 'hover:bg-paper-2'
          }`}
        >
          <span className="w-5 font-mono text-[11px] text-muted">{i !== undefined ? String(i + 1).padStart(2, '0') : ''}</span>
          <span className={`h-2.5 w-2.5 rounded-full ${m.dot}`} />
          <span className="flex-1">{m.label}</span>
          {active && <span className="font-mono text-[11px] uppercase tracking-wider opacity-70">current</span>}
        </button>
      </li>
    )
  }
  return (
    <Sheet open={open} onClose={onClose} title={<>{statusCopy.pickerTitle} <span className="text-muted">{companyName}</span></>}>
      <ul className="space-y-1">{PIPELINE.map((s, i) => row(s, i))}</ul>
      <p className="label mt-4 px-3">{statusCopy.pickerExits}</p>
      <ul className="space-y-1">{EXITS.map((s) => row(s))}</ul>
    </Sheet>
  )
}

import { EVENT_META, STATUS_META, initials, tileColor } from '../lib/meta'
import type { CompanyLite, CompanyStatus, EventType } from '../lib/types'

export function StatusStamp({ status, className = '' }: { status: CompanyStatus; className?: string }) {
  const m = STATUS_META[status]
  return <span className={`stamp ${m.cls} ${className}`}>{m.label}</span>
}

export function TypeTag({ type, className = '' }: { type: EventType; className?: string }) {
  const m = EVENT_META[type]
  return <span className={`stamp border-[1.5px] ${m.cls} ${className}`}>{m.label}</span>
}

/** Square tile: emoji if set, else initials on a colour derived from the name. */
export function CompanyTile({
  company,
  size = 44,
}: {
  company: Pick<CompanyLite, 'name' | 'emoji'>
  size?: number
}) {
  const style = { width: size, height: size }
  if (company.emoji) {
    return (
      <span
        style={{ ...style, fontSize: size * 0.5 }}
        className="grid shrink-0 place-items-center rounded-xl border-[1.5px] border-ink bg-paper-2 leading-none"
        aria-hidden
      >
        {company.emoji}
      </span>
    )
  }
  return (
    <span
      style={{ ...style, background: tileColor(company.name), fontSize: size * 0.36 }}
      className="grid shrink-0 place-items-center rounded-xl border-[1.5px] border-ink font-display font-bold tracking-tight text-[#16140f]"
      aria-hidden
    >
      {initials(company.name)}
    </span>
  )
}

import { Link } from 'react-router-dom'
import { fmtIST } from '../lib/time'
import type { Company } from '../lib/types'
import { graveyardCopy as c } from '../copy'

function hash(s: string) {
  let h = 0
  for (const ch of s) h = (h * 33 + ch.charCodeAt(0)) >>> 0
  return h
}

export function Tombstone({ company, days, party }: { company: Company; days: number; party?: boolean }) {
  const h = hash(company.id)
  const epitaph = c.epitaphs[h % c.epitaphs.length]
  const tilt = ((h % 7) - 3) * 0.6
  return (
    <Link to={`/companies/${company.id}`} className="group relative block pt-6" style={{ transform: `rotate(${tilt}deg)` }}>
      {party && (
        <svg
          aria-hidden
          viewBox="0 0 40 46"
          className="absolute left-1/2 top-0 z-10 h-12 w-11 -translate-x-1/2 -rotate-[14deg] drop-shadow-sm transition-transform group-hover:-rotate-6"
        >
          <path d="M20 2 L37 42 Q20 47 3 42 Z" fill="var(--marker)" stroke="var(--ink)" strokeWidth="1.5" />
          <path d="M11 22 L29 22 M7 32 L33 32" stroke="var(--highlight)" strokeWidth="3.5" />
          <circle cx="20" cy="3" r="3.5" fill="var(--highlight)" stroke="var(--ink)" strokeWidth="1.2" />
        </svg>
      )}
      <div className="relative rounded-t-[999px] rounded-b-md border border-line bg-gradient-to-b from-card to-paper-2 px-4 pb-4 pt-9 text-center shadow-[0_6px_0_-2px_var(--line)] transition-[transform,border-color] group-hover:-translate-y-0.5 group-hover:border-ink/30">
        <p className="font-mono text-[11px] font-semibold tracking-[0.3em] text-muted">{c.rip}</p>
        <p className="mt-1 truncate font-display text-[19px] font-bold tracking-tight">
          {company.emoji && <span className="mr-1">{company.emoji}</span>}
          {company.name}
        </p>
        <p className="font-mono text-[11px] text-muted">
          {fmtIST(company.created_at, 'd MMM')} – {fmtIST(company.last_contact_at, 'd MMM')}
        </p>
        <p className="mx-auto mt-3 max-w-[22ch] text-[13px] italic leading-snug text-ink-2">“{epitaph}”</p>
        <p className="mt-3 inline-block rounded-full bg-paper px-2.5 py-1 font-mono text-[11px] text-ghost">{c.daysSilent(days)}</p>
      </div>
      <div aria-hidden className="mx-auto h-2 w-[110%] -translate-x-[4.5%] rounded-full bg-stamp-green/25" />
    </Link>
  )
}

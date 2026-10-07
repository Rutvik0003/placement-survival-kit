import { BackBar } from '../components/BackBar'
import { PageHeader } from '../components/PageHeader'
import { Loading } from '../components/Loading'
import { useCompanies } from '../hooks/queries'
import { useBadges } from '../hooks/fun'
import { BADGE_KEYS } from '../lib/fun'
import { fmtIST } from '../lib/time'
import { badgeDefs, badgesCopy as c } from '../copy'

export default function Badges() {
  const { data: earned = [], isLoading } = useBadges()
  const { data: companies = [] } = useCompanies()
  if (isLoading) return <Loading />

  const got = new Map(earned.map((b) => [b.badge_key, b]))
  const total = BADGE_KEYS.length
  // Earned first (newest first), then locked in definition order.
  const keys = [
    ...BADGE_KEYS.filter((k) => got.has(k)).sort((a, b) => Date.parse(got.get(b)!.earned_at) - Date.parse(got.get(a)!.earned_at)),
    ...BADGE_KEYS.filter((k) => !got.has(k)),
  ]

  return (
    <div className="mx-auto max-w-4xl">
      <BackBar fallback="/season" />
      <PageHeader kicker={c.kicker} title={c.title} />

      <div className="mb-6">
        <div className="flex items-baseline justify-between text-[14px]">
          <span className="font-medium">{c.progress(got.size, total)}</span>
          <span className="font-mono text-[12px] text-muted">{Math.round((got.size / total) * 100)}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-2">
          <div className="h-full rounded-full bg-marker transition-[width] duration-700" style={{ width: `${(got.size / total) * 100}%` }} />
        </div>
        {got.size === 0 && <p className="mt-3 text-[14px] text-muted">{c.emptyHint}</p>}
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {keys.map((k) => {
          const d = badgeDefs[k as keyof typeof badgeDefs]
          const b = got.get(k)
          const company = b?.company_id ? companies.find((co) => co.id === b.company_id) : null
          return (
            <li
              key={k}
              className={`relative flex flex-col items-center rounded-2xl border px-3 pb-4 pt-5 text-center ${
                b ? 'border-line bg-card' : 'border-dashed border-line bg-transparent'
              }`}
            >
              <span
                className={`grid h-16 w-16 place-items-center rounded-full text-[34px] leading-none ${
                  b ? 'bg-highlight/40 shadow-[inset_0_0_0_2px_var(--ink)]' : 'bg-paper-2 opacity-40 grayscale'
                }`}
                aria-hidden
              >
                {d.emoji}
              </span>
              <p className={`mt-3 font-display text-[15px] font-semibold leading-tight ${b ? '' : 'text-muted'}`}>{d.name}</p>
              <p className="mt-1 text-[12.5px] leading-snug text-muted">{d.how}</p>
              <p className="mt-2 font-mono text-[10.5px] uppercase tracking-wider text-muted">
                {b ? `${fmtIST(b.earned_at, 'd MMM')}${company ? ` · ${company.name}` : ''}` : c.locked}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

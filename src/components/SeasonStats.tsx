import { useCompanies } from '../hooks/queries'
import { useAllEvents, useHistory } from '../hooks/fun'
import { seasonStats } from '../lib/fun'
import { STATUS_META } from '../lib/meta'
import { statsCopy as c } from '../copy'

const TILE_TONE: Record<string, string> = {
  offers: 'text-marker',
  rejections: 'text-stamp-red',
  ghosts: 'text-ghost',
}

export function SeasonStats() {
  const { data: companies = [] } = useCompanies()
  const { data: events = [] } = useAllEvents()
  const { data: history = [] } = useHistory()
  const s = seasonStats(companies, events, history)
  const tiles = ['applied', 'tests', 'interviews', 'offers', 'rejections', 'ghosts'] as const
  const top = Math.max(1, s.funnel[0].count)

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
        {tiles.map((k) => (
          <div key={k} className="bg-card px-3 py-3">
            <p className={`font-display text-[30px] font-bold leading-none tracking-tight tabular-nums ${TILE_TONE[k] ?? ''}`}>{s[k]}</p>
            <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">{c.tiles[k]}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-card p-4">
        <p className="font-display text-[17px] font-semibold tracking-tight">{c.funnelTitle}</p>
        <p className="text-[13px] text-muted">{c.funnelHint}</p>
        {s.applied === 0 ? (
          <p className="mt-3 text-[14px] text-muted">{c.empty}</p>
        ) : (
          <ol className="mt-4 space-y-2">
            {s.funnel.map(({ stage, count }, i) => {
              const pct = Math.round((count / top) * 100)
              return (
                <li key={stage} className="grid grid-cols-[86px_1fr_64px] items-center gap-3">
                  <span className="text-[13px] font-medium text-ink-2">{STATUS_META[stage].label}</span>
                  <div className="flex h-8 justify-center">
                    <div
                      className={`funnel-bar flex h-full items-center justify-center rounded-lg ${STATUS_META[stage].dot}`}
                      style={{ width: `${Math.max(8, pct)}%`, animationDelay: `${i * 90}ms`, opacity: count ? 1 : 0.25 }}
                    >
                      <span className="font-mono text-[13px] font-bold text-white mix-blend-normal drop-shadow-[0_1px_0_rgb(0_0_0/0.25)]">{count}</span>
                    </div>
                  </div>
                  <span className="text-right font-mono text-[12px] tabular-nums text-muted">{c.ofApplied(pct)}</span>
                </li>
              )
            })}
          </ol>
        )}
        <p className="mt-4 border-t border-dashed border-line pt-3 text-[13.5px] text-muted">{c.verdict(s.applied, s.offers)}</p>
      </div>
    </section>
  )
}

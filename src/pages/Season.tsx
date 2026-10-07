import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { IconChevron } from '../components/Icons'
import { useCompanies } from '../hooks/queries'
import { useBadges, useFormals } from '../hooks/fun'
import { useSettings } from '../hooks/useSettings'
import { BADGE_KEYS, ghostSuspects } from '../lib/fun'
import { formalsCopy, graveyardCopy, seasonCopy as c, wrappedCopy } from '../copy'

function HubCard({ to, emoji, title, body, extra }: { to: string; emoji: string; title: string; body: string; extra?: ReactNode }) {
  return (
    <Link to={to} className="group flex items-center gap-4 rounded-2xl border border-line bg-card px-4 py-4 transition-colors hover:border-ink/40">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-paper-2 text-[26px]">{emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[17px] font-semibold tracking-tight">{title}</p>
        <p className="text-[13.5px] text-muted">{body}</p>
        {extra}
      </div>
      <IconChevron width={18} height={18} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

export default function Season() {
  const { data: companies = [] } = useCompanies()
  const { data: badges = [] } = useBadges()
  const { data: formals = [] } = useFormals()
  const { data: settings } = useSettings()
  const ghosts = companies.filter((co) => co.status === 'ghosted').length
  const suspects = ghostSuspects(companies, settings?.ghost_after_days ?? 14).length

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader kicker={c.kicker} title={c.title} />

      <Link
        to="/wrapped"
        className="group relative mb-4 block overflow-hidden rounded-2xl bg-[#16140f] px-5 pb-5 pt-5 text-[#f2eee4]"
      >
        <div aria-hidden className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[#ff4f1f]" />
        <div aria-hidden className="absolute -bottom-10 right-16 h-24 w-24 rounded-full bg-[#f4e04d]" />
        <div aria-hidden className="absolute right-4 top-16 h-14 w-14 rounded-full bg-[#7b4fd6]" />
        <p className="relative font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">{wrappedCopy.kicker}</p>
        <p className="relative mt-2 max-w-[13ch] font-display text-[26px] font-bold leading-[1.05] tracking-[-0.03em]">{wrappedCopy.hubBody}</p>
        <span className="relative mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[14px] font-semibold text-[#16140f] transition-transform group-hover:scale-[1.03]">
          ▶ {wrappedCopy.open}
        </span>
      </Link>

      <div className="space-y-3">
        <HubCard
          to="/graveyard"
          emoji="🪦"
          title={c.graveyard.title}
          body={c.graveyard.body(ghosts)}
          extra={suspects > 0 && <p className="mt-1 text-[12.5px] font-medium text-ghost">{graveyardCopy.suspectsLine(suspects)}</p>}
        />
        <HubCard to="/badges" emoji="🏅" title={c.badges.title} body={c.badges.body(badges.length, BADGE_KEYS.length)} />
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-card px-4 py-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-paper-2 text-[26px]">👔</span>
          <div className="min-w-0">
            <p className="font-display text-[17px] font-semibold tracking-tight">{formalsCopy.count(formals.length)}</p>
            <p className="text-[13.5px] text-muted">
              {formalsCopy.milestones[[30, 20, 15, 10, 5, 3, 1].find((m) => formals.length >= m) ?? 0] ?? 'Logged from the home screen on PPT / GD / interview days.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

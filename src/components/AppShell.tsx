import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Suspense, useEffect, useState, type ComponentType, type SVGProps } from 'react'
import { IconCompanies, IconPlus, IconSettings, IconStats, IconToday } from './Icons'
import { LogoMark } from './Logo'
import { BadgeWatcher } from './BadgeWatcher'
import { Loading } from './Loading'
import { AddSheet } from './AddSheet'
import { addCopy, offlineCopy } from '../copy'
import { useNow } from '../hooks/useNow'
import { fmtIST } from '../lib/time'
import { resyncPush } from '../lib/push'

type NavItem = { to: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }

const nav: NavItem[] = [
  { to: '/', label: 'Today', icon: IconToday },
  { to: '/companies', label: 'Companies', icon: IconCompanies },
  { to: '/season', label: 'Season', icon: IconStats },
  { to: '/settings', label: 'Settings', icon: IconSettings },
]

function Clock() {
  const now = useNow()
  return (
    <div className="rounded-xl border-[1.5px] border-line bg-card px-3.5 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">IST</p>
      <p className="font-mono text-2xl font-medium tabular-nums tracking-tight">{fmtIST(now, 'HH:mm')}</p>
      <p className="text-[13px] text-muted">{fmtIST(now, 'EEEE, d MMM')}</p>
    </div>
  )
}

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

export function AppShell() {
  const online = useOnline()
  const { pathname } = useLocation()
  useEffect(() => {
    resyncPush()
  }, [])
  // No floating "+" on forms — the save button lives there.
  const showFab = !/\/(new|edit)$/.test(pathname) && !/^\/(checkin|offer|wrapped)/.test(pathname)
  const [adding, setAdding] = useState(false)
  // On a company's page, "Event" is prefilled with that company.
  const companyHere = pathname.match(/^\/companies\/([0-9a-f-]{36})$/)?.[1]
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <BadgeWatcher />
      {!online && (
        <div role="status" className="pt-safe fixed inset-x-0 top-0 z-50 bg-ink text-center text-[12.5px] text-paper lg:left-[248px]">
          <p className="py-1.5">{offlineCopy}</p>
        </div>
      )}
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r-[1.5px] border-line px-4 py-6 lg:flex">
        <div className="flex items-center gap-2.5 px-2">
          <LogoMark size={30} />
          <div className="leading-none">
            <p className="font-display text-[17px] font-bold tracking-tight">Survival Kit</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Placement season</p>
          </div>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-2">
          <Link to="/companies/new" className="btn btn-primary h-10 px-2 text-[14px]">
            <IconPlus width={16} height={16} /> {addCopy.sidebarCompany}
          </Link>
          <Link to={companyHere ? `/events/new?company=${companyHere}` : '/events/new'} className="btn btn-marker h-10 px-2 text-[14px]">
            <IconPlus width={16} height={16} /> {addCopy.sidebarEvent}
          </Link>
        </div>
        <nav className="mt-6 flex flex-col gap-1" aria-label="Main">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group flex h-10 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors ${
                  isActive ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-paper-2'
                }`
              }
            >
              <Icon width={19} height={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto">
          <Clock />
        </div>
      </aside>

      {/* Content */}
      <main className="pt-safe mx-auto w-full max-w-5xl px-4 pb-28 sm:px-6 lg:px-10 lg:pb-12 lg:pt-6">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Mobile: floating add button */}
      {showFab && (
        <button
          onClick={() => setAdding(true)}
          aria-label={addCopy.title}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-4 z-30 grid h-14 w-14 place-items-center rounded-2xl border-[1.5px] border-ink bg-marker text-marker-ink shadow-[3px_3px_0_var(--ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_var(--ink)] lg:hidden"
        >
          <IconPlus width={26} height={26} strokeWidth={2.2} />
        </button>
      )}
      <AddSheet open={adding} onClose={() => setAdding(false)} companyId={companyHere} />

      {/* Mobile bottom bar */}
      <nav
        aria-label="Main"
        className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t-[1.5px] border-line bg-paper/90 backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {nav.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-ink' : 'text-muted'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden
                      className={`absolute top-0 h-[3px] w-8 rounded-b-full bg-marker transition-opacity ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <Icon width={22} height={22} strokeWidth={isActive ? 2.1 : 1.8} />
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

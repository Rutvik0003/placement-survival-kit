import { useState, type ComponentType, type ReactNode, type SVGProps } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../components/PageHeader'
import { IconAuto, IconMoon, IconSun } from '../components/Icons'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { getThemePref, setThemePref, type ThemePref } from '../lib/theme'
import { settingsCopy as c } from '../copy'

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-t-[1.5px] border-line py-6 md:grid-cols-[220px_1fr] md:gap-8">
      <div>
        <h2 className="font-display text-[17px] font-semibold tracking-tight">{title}</h2>
        {hint && <p className="mt-1 text-[14px] leading-snug text-muted">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

const themes: { value: ThemePref; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { value: 'light', label: 'Light', icon: IconSun },
  { value: 'dark', label: 'Dark', icon: IconMoon },
  { value: 'system', label: 'System', icon: IconAuto },
]

export default function Settings() {
  const { session } = useAuth()
  const qc = useQueryClient()
  const [theme, setTheme] = useState<ThemePref>(getThemePref)

  return (
    <>
      <PageHeader kicker={c.kicker} title={c.title} />

      <Section title={c.appearance.title} hint={c.appearance.hint}>
        <div role="radiogroup" aria-label="Theme" className="inline-grid grid-cols-3 rounded-xl border-[1.5px] border-line bg-card p-1">
          {themes.map(({ value, label, icon: Icon }) => {
            const active = theme === value
            return (
              <button
                key={value}
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setTheme(value)
                  setThemePref(value)
                }}
                className={`flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-[14px] font-medium transition-colors ${
                  active ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-paper-2'
                }`}
              >
                <Icon width={17} height={17} />
                {label}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title={c.account.title} hint={c.account.hint}>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-[1.5px] border-line bg-card px-4 py-3">
          <div className="min-w-0">
            <p className="label mb-0.5">Signed in as</p>
            <p className="truncate font-mono text-[14px]">{session?.user.email}</p>
          </div>
          <button
            className="btn btn-ghost h-10 border-[1.5px] border-line"
            onClick={async () => {
              await supabase.auth.signOut()
              qc.clear()
            }}
          >
            {c.account.signOut}
          </button>
        </div>
      </Section>

      <Section title={c.notifications.title} hint={c.notifications.hint}>
        <p className="rounded-xl border-[1.5px] border-dashed border-line px-4 py-3 text-[14px] text-muted">
          {c.notifications.later}
        </p>
      </Section>

      <p className="border-t-[1.5px] border-line pt-6 font-mono text-[11px] text-muted">
        Placement Survival Kit · v{__APP_VERSION__} · all times IST
      </p>
    </>
  )
}

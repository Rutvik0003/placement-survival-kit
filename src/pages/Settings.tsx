import { useEffect, useState, type ComponentType, type ReactNode, type SVGProps } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../components/PageHeader'
import { IconAuto, IconBell, IconMoon, IconSun } from '../components/Icons'
import { IosInstallGuide } from '../components/InstallGuide'
import { Switch } from '../components/Switch'
import { useToast } from '../components/Toast'
import { useAuth } from '../auth/AuthProvider'
import { useInstall, usePushState } from '../hooks/usePush'
import { useSaveSettings, useSettings } from '../hooks/useSettings'
import { sendTestPush, type PushState } from '../lib/push'
import { supabase } from '../lib/supabase'
import { getThemePref, setThemePref, type ThemePref } from '../lib/theme'
import { installCopy, notifCopy as n, settingsCopy as c } from '../copy'

function Section({ id, title, hint, children }: { id?: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section id={id} className="grid scroll-mt-6 gap-3 border-t border-line py-6 md:grid-cols-[220px_1fr] md:gap-8">
      <div>
        <h2 className="font-display text-[17px] font-semibold tracking-tight">{title}</h2>
        {hint && <p className="mt-1 text-[14px] leading-snug text-muted">{hint}</p>}
      </div>
      <div className="min-w-0 space-y-3">{children}</div>
    </section>
  )
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-card px-4 py-3.5 ${className}`}>{children}</div>
}

const themes: { value: ThemePref; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { value: 'light', label: 'Light', icon: IconSun },
  { value: 'dark', label: 'Dark', icon: IconMoon },
  { value: 'system', label: 'System', icon: IconAuto },
]

const deviceText: Record<PushState, { title: string; body: string }> = {
  on: n.device.on,
  off: n.device.off,
  denied: n.device.denied,
  unsupported: n.device.unsupported,
  'no-key': n.device.noKey,
  'ios-needs-install': n.device.iosInstall,
}

function NotificationsSection() {
  const push = usePushState()
  const { data: settings } = useSettings()
  const save = useSaveSettings()
  const toast = useToast()
  const [testing, setTesting] = useState(false)
  const [quietOn, setQuietOn] = useState(false)
  const [from, setFrom] = useState('23:00')
  const [to, setTo] = useState('07:00')

  useEffect(() => {
    if (!settings) return
    setQuietOn(!!settings.quiet_start)
    if (settings.quiet_start) setFrom(settings.quiet_start.slice(0, 5))
    if (settings.quiet_end) setTo(settings.quiet_end.slice(0, 5))
  }, [settings])

  const saveQuiet = (on: boolean, f = from, t = to) =>
    save.mutate(on ? { quiet_start: f, quiet_end: t } : { quiet_start: null, quiet_end: null }, {
      onSuccess: () => toast.show({ message: n.quiet.saved }),
    })

  const state = push.state
  const text = state ? deviceText[state] : null

  return (
    <Section id="notifications" title={n.sectionTitle} hint={n.sectionHint}>
      <Card className={state === 'on' ? 'border-stamp-green/50' : ''}>
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
              state === 'on' ? 'bg-stamp-green/15 text-stamp-green' : 'bg-paper-2 text-muted'
            }`}
          >
            <IconBell width={18} height={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{text?.title ?? '…'}</p>
            <p className="mt-0.5 text-[13.5px] leading-snug text-muted">{text?.body}</p>
          </div>
          {(state === 'on' || state === 'off') && (
            <button
              className={`btn h-9 shrink-0 px-3.5 text-[14px] ${state === 'on' ? 'btn-ghost border border-line' : 'btn-primary'}`}
              onClick={state === 'on' ? push.turnOff : push.turnOn}
              disabled={push.busy}
            >
              {push.busy ? n.device.working : state === 'on' ? n.device.turnOff : n.device.turnOn}
            </button>
          )}
        </div>
        {state === 'ios-needs-install' && (
          <div className="mt-4 border-t border-dashed border-line pt-4">
            <IosInstallGuide />
          </div>
        )}
        {push.error && <p className="mt-2 text-[13px] text-stamp-red">{push.error}</p>}
      </Card>

      {state === 'on' && (
        <button
          className="btn btn-ghost h-10 w-full border border-line text-[14px] sm:w-auto"
          disabled={testing}
          onClick={async () => {
            setTesting(true)
            try {
              const r = await sendTestPush()
              toast.show({ message: r.delivered ? n.test.sent(r.delivered) : r.errors[0] ?? n.test.none })
            } catch {
              toast.show({ message: n.test.failed })
            } finally {
              setTesting(false)
            }
          }}
        >
          {testing ? n.test.sending : n.test.button}
        </button>
      )}

      <Card>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{n.master.title}</p>
            <p className="text-[13.5px] text-muted">{n.master.hint}</p>
          </div>
          <Switch
            label={n.master.title}
            checked={settings?.push_enabled ?? true}
            disabled={!settings}
            onChange={(v) => save.mutate({ push_enabled: v })}
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{n.quiet.title}</p>
            <p className="text-[13.5px] leading-snug text-muted">{n.quiet.hint}</p>
          </div>
          <Switch
            label={n.quiet.title}
            checked={quietOn}
            disabled={!settings}
            onChange={(v) => {
              setQuietOn(v)
              saveQuiet(v)
            }}
          />
        </div>
        {quietOn && (
          <div className="mt-3 flex items-center gap-2 border-t border-dashed border-line pt-3 text-[14px]">
            <span className="text-muted">{n.quiet.from}</span>
            <input
              type="time"
              className="field h-9 w-28 font-mono text-[14px]"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              onBlur={() => saveQuiet(true)}
            />
            <span className="text-muted">{n.quiet.to}</span>
            <input
              type="time"
              className="field h-9 w-28 font-mono text-[14px]"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              onBlur={() => saveQuiet(true)}
            />
          </div>
        )}
      </Card>

      <div className="pt-1">
        <p className="label">{n.schedule.title}</p>
        <ul className="divide-y divide-line rounded-xl border border-line">
          {n.schedule.items.map((it) => (
            <li key={it.when} className="flex items-baseline gap-3 px-4 py-2.5 text-[14px]">
              <span className="w-20 shrink-0 font-mono text-[12px] text-muted">{it.when}</span>
              <span>{it.what}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}

function InstallSection() {
  const install = useInstall()
  if (install.installed)
    return (
      <Section title={installCopy.title}>
        <p className="text-[14.5px] text-muted">{installCopy.installed}</p>
      </Section>
    )
  return (
    <Section title={installCopy.title} hint={installCopy.hint}>
      {install.ios ? (
        <Card>
          <IosInstallGuide />
        </Card>
      ) : install.canPrompt ? (
        <button className="btn btn-primary" onClick={install.prompt}>
          {installCopy.button}
        </button>
      ) : (
        <p className="text-[14.5px] text-muted">{installCopy.other}</p>
      )}
    </Section>
  )
}

export default function Settings() {
  const { session } = useAuth()
  const qc = useQueryClient()
  const [theme, setTheme] = useState<ThemePref>(getThemePref)

  useEffect(() => {
    if (location.hash) document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader kicker={c.kicker} title={c.title} />

      <NotificationsSection />
      <InstallSection />

      <Section title={c.appearance.title} hint={c.appearance.hint}>
        <div role="radiogroup" aria-label="Theme" className="inline-grid grid-cols-3 rounded-xl border border-line bg-card p-1">
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
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="label mb-0.5">Signed in as</p>
            <p className="truncate font-mono text-[14px]">{session?.user.email}</p>
          </div>
          <button
            className="btn btn-ghost h-10 border border-line"
            onClick={async () => {
              await supabase.auth.signOut()
              qc.clear()
            }}
          >
            {c.account.signOut}
          </button>
        </Card>
      </Section>

      <p className="border-t border-line pt-6 font-mono text-[11px] text-muted">
        Placement Survival Kit · v{__APP_VERSION__} · all times IST
      </p>
    </div>
  )
}

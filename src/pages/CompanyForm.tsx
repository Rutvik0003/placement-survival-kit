import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackBar } from '../components/BackBar'
import { PageHeader } from '../components/PageHeader'
import { Loading } from '../components/Loading'
import { CompanyTile } from '../components/Stamps'
import { useToast } from '../components/Toast'
import { useCompany, useSaveCompany } from '../hooks/queries'
import { ALL_STATUSES, STATUS_META } from '../lib/meta'
import type { CompanyStatus } from '../lib/types'
import { commonCopy, companyFormCopy as c } from '../copy'

const EMOJIS = ['💻', '🏦', '🚀', '🏭', '⚙️', '📊', '🛒', '🧪', '🏗️', '✈️', '🔌', '🦄']

type Form = {
  name: string
  emoji: string
  nickname: string
  role: string
  ctc: string
  cgpa: string
  location: string
  status: CompanyStatus
  notes: string
}

const blank: Form = { name: '', emoji: '', nickname: '', role: '', ctc: '', cgpa: '', location: '', status: 'applied', notes: '' }

const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
const txt = (s: string) => s.trim() || null
/** Keep only the last typed emoji (handles multi-part emoji like 👩‍💻). */
const lastGrapheme = (s: string) => [...new Intl.Segmenter().segment(s.trim())].at(-1)?.segment ?? ''

export default function CompanyForm() {
  const { id } = useParams()
  const editing = !!id
  const { data: company, isLoading } = useCompany(id)
  const save = useSaveCompany()
  const navigate = useNavigate()
  const toast = useToast()
  const [f, setF] = useState<Form>(blank)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (company)
      setF({
        name: company.name,
        emoji: company.emoji ?? '',
        nickname: company.nickname ?? '',
        role: company.role ?? '',
        ctc: company.ctc_lpa?.toString() ?? '',
        cgpa: company.cgpa_cutoff?.toString() ?? '',
        location: company.location ?? '',
        status: company.status,
        notes: company.notes ?? '',
      })
  }, [company])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!f.name.trim()) return setError(c.nameRequired)
    setError(null)
    try {
      const saved = await save.mutateAsync({
        id,
        name: f.name.trim(),
        emoji: txt(f.emoji),
        nickname: txt(f.nickname),
        role: txt(f.role),
        ctc_lpa: num(f.ctc),
        cgpa_cutoff: num(f.cgpa),
        location: txt(f.location),
        status: f.status,
        notes: txt(f.notes),
      })
      toast.show({ message: commonCopy.saved })
      navigate(`/companies/${saved.id}`, { replace: true })
    } catch {
      setError(commonCopy.error)
    }
  }

  if (editing && isLoading) return <Loading />

  return (
    <div className="mx-auto max-w-2xl">
      <BackBar fallback={editing ? `/companies/${id}` : '/companies'} />
      <PageHeader kicker={c.kicker} title={editing ? c.editTitle : c.newTitle} />

      <form onSubmit={submit} className="space-y-5">
        <div className="flex items-end gap-3">
          <CompanyTile company={{ name: f.name || '?', emoji: f.emoji || null }} size={48} />
          <div className="flex-1">
            <label htmlFor="name" className="label">
              {c.name}
            </label>
            <input
              id="name"
              className="field font-display text-[18px] font-semibold"
              placeholder={c.namePlaceholder}
              value={f.name}
              onChange={(e) => set('name', e.target.value)}
              autoFocus={!editing}
              autoComplete="off"
              required
            />
          </div>
        </div>

        <div>
          <span className="label">{c.emoji}</span>
          <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {EMOJIS.map((em) => (
              <button
                type="button"
                key={em}
                onClick={() => set('emoji', f.emoji === em ? '' : em)}
                aria-pressed={f.emoji === em}
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border-[1.5px] text-[20px] transition-colors ${
                  f.emoji === em ? 'border-ink bg-highlight/60' : 'border-line bg-card hover:border-ink'
                }`}
              >
                {em}
              </button>
            ))}
            <input
              aria-label="Custom emoji"
              className="field h-10 w-16 shrink-0 px-2 text-center text-[18px]"
              placeholder="✍️"
              value={EMOJIS.includes(f.emoji) ? '' : f.emoji}
              onChange={(e) => set('emoji', lastGrapheme(e.target.value))}
            />
          </div>
        </div>

        <div>
          <span className="label">{c.status}</span>
          <div className="flex flex-wrap gap-1.5">
            {ALL_STATUSES.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => set('status', s)}
                aria-pressed={f.status === s}
                className={`flex h-9 items-center gap-1.5 rounded-full border-[1.5px] px-3 text-[14px] font-medium transition-colors ${
                  f.status === s ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:border-ink'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`} />
                {STATUS_META[s].label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="role" label={c.role} placeholder={c.rolePlaceholder} value={f.role} onChange={(v) => set('role', v)} />
          <Field
            id="location"
            label={c.location}
            placeholder={c.locationPlaceholder}
            value={f.location}
            onChange={(v) => set('location', v)}
          />
          <Field id="ctc" label={c.ctc} placeholder="12" inputMode="decimal" value={f.ctc} onChange={(v) => set('ctc', v)} />
          <Field id="cgpa" label={c.cgpa} placeholder="7.0" inputMode="decimal" value={f.cgpa} onChange={(v) => set('cgpa', v)} />
        </div>

        <Field
          id="nickname"
          label={c.nickname}
          placeholder={c.nicknamePlaceholder}
          value={f.nickname}
          onChange={(v) => set('nickname', v)}
        />

        <div>
          <label htmlFor="notes" className="label">
            {c.notes}
          </label>
          <textarea
            id="notes"
            rows={4}
            className="field h-auto resize-y py-3 leading-relaxed"
            placeholder={c.notesPlaceholder}
            value={f.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg border-[1.5px] border-stamp-red/40 bg-stamp-red/10 px-3 py-2.5 text-[14px] text-stamp-red">
            {error}
          </p>
        )}

        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-10 -mx-4 bg-gradient-to-t from-paper via-paper to-transparent px-4 pb-2 pt-4 lg:bottom-0">
          <button type="submit" className="btn btn-marker w-full" disabled={save.isPending}>
            {save.isPending ? c.saving : c.save}
          </button>
        </div>
      </form>
    </div>
  )
}

export function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  type = 'text',
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  type?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        className="field"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </div>
  )
}

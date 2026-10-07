/**
 * DEV ONLY. `npm run dev` then open http://localhost:5173/?demo
 * Fakes just enough of the Supabase client (auth + the query chains this app
 * uses) over in-memory sample data, so screens can be checked without logging
 * in. Never included in production builds (guarded by import.meta.env.DEV).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>

export function isDemo() {
  try {
    if (new URLSearchParams(location.search).has('demo')) sessionStorage.setItem('psk-demo', '1')
    return sessionStorage.getItem('psk-demo') === '1'
  } catch {
    return false
  }
}

const uid = () => crypto.randomUUID()
const USER = '00000000-0000-0000-0000-00000000demo'
const iso = (ms: number) => new Date(ms).toISOString()

function seed() {
  const now = Date.now()
  const H = 3_600_000
  const D = 24 * H
  // Midnight IST today, in ms.
  const istOffset = 5.5 * H
  const dayStart = Math.floor((now + istOffset) / D) * D - istOffset
  const at = (day: number, h: number, m = 0) => dayStart + day * D + h * H + m * 60_000

  const mk = (name: string, status: string, extra: Row = {}): Row => ({
    id: uid(),
    user_id: USER,
    name,
    nickname: null,
    emoji: null,
    role: null,
    ctc_lpa: null,
    cgpa_cutoff: null,
    location: null,
    notes: null,
    status,
    status_changed_at: iso(now - 3 * D),
    last_contact_at: iso(now - 3 * D),
    ghost_suggest_snoozed_until: null,
    created_at: iso(now - 20 * D),
    updated_at: iso(now - 2 * D),
    ...extra,
  })
  const companies = [
    mk('Acme Systems', 'test', { role: 'SDE', ctc_lpa: 14, location: 'Bengaluru', emoji: '💻', cgpa_cutoff: 7 }),
    mk('Globex Bank', 'shortlisted', { role: 'Analyst', ctc_lpa: 9.5, location: 'Mumbai', emoji: '🏦' }),
    mk('Initech', 'interview', { role: 'GET', ctc_lpa: 7, location: 'Pune', nickname: 'The Rescheduler' }),
    mk('Umbrella Labs', 'applied', { role: 'Data Scientist', ctc_lpa: 18, location: 'Hyderabad', emoji: '🧪' }),
    mk('Hooli', 'applied', { role: 'SDE-1', ctc_lpa: 24, location: 'Remote', emoji: '🦄' }),
    mk('Stark Industries', 'offer', { role: 'Design Engineer', ctc_lpa: 12, location: 'Chennai', emoji: '⚙️' }),
    mk('Wayne Enterprises', 'rejected', { role: 'Consultant', ctc_lpa: 11 }),
    mk('Soylent Corp', 'ghosted', { role: 'Sales Trainee', last_contact_at: iso(now - 26 * D) }),
  ]
  const C = Object.fromEntries(companies.map((c) => [c.name, c.id]))
  const ev = (company: string, type: string, title: string, start: number, end: number | null, extra: Row = {}): Row => ({
    id: uid(),
    user_id: USER,
    company_id: C[company],
    type,
    title,
    starts_at: iso(start),
    ends_at: end ? iso(end) : null,
    venue: null,
    link: null,
    notes: null,
    reschedule_count: 0,
    link_added_at: null,
    mood: null,
    checked_in_at: null,
    created_at: iso(now - 5 * D),
    updated_at: iso(now - 5 * D),
    ...extra,
  })
  const hNow = new Date(now + istOffset).getUTCHours()
  const events = [
    ev('Acme Systems', 'ppt', 'Pre-placement talk', at(0, Math.max(8, hNow - 2)), at(0, Math.max(9, hNow - 1)), { venue: 'Seminar Hall A' }),
    ev('Acme Systems', 'test', 'Online assessment', now + 47 * 60_000, now + 107 * 60_000, {
      link: 'https://example.com/test',
      venue: 'Lab 3',
    }),
    ev('Globex Bank', 'ppt', 'Pre-placement talk', now + 80 * 60_000, now + 140 * 60_000, { venue: 'Auditorium' }),
    ev('Initech', 'interview', 'Technical round 1', at(1, 10, 30), at(1, 11, 15), { reschedule_count: 2, link: 'https://meet.example.com/x' }),
    ev('Umbrella Labs', 'deadline', 'Application deadline', at(1, 23, 59), null),
    ev('Globex Bank', 'gd', 'Group discussion', at(2, 14), at(2, 14, 30)),
    ev('Hooli', 'test', 'Coding round', at(3, 18), at(3, 19, 30), { link: 'https://example.com/hooli' }),
    ev('Initech', 'interview', 'HR round', at(5, 11), null),
    ev('Stark Industries', 'interview', 'Final round', at(-6, 15), at(-6, 16)),
  ]
  const history = companies.flatMap((c) => [
    { id: uid(), user_id: USER, company_id: c.id, from_status: null, to_status: 'applied', changed_at: c.created_at },
    ...(c.name === 'Wayne Enterprises'
      ? [{ id: uid(), user_id: USER, company_id: c.id, from_status: 'applied', to_status: 'interview', changed_at: c.created_at }]
      : []),
  ])
  return { companies, events, company_status_history: history } as Record<string, Row[]>
}

const db = seed()

class Query {
  private filters: ((r: Row) => boolean)[] = []
  private sort?: { col: string; asc: boolean }
  private mode: 'many' | 'single' | 'maybe' = 'many'
  private cols = '*'
  constructor(
    private table: string,
    private op: 'select' | 'insert' | 'update' | 'delete',
    private payload?: Row,
  ) {}
  select(cols = '*') {
    this.cols = cols
    return this
  }
  eq(c: string, v: unknown) {
    this.filters.push((r) => r[c] === v)
    return this
  }
  gte(c: string, v: string) {
    this.filters.push((r) => r[c] >= v)
    return this
  }
  lt(c: string, v: string) {
    this.filters.push((r) => r[c] < v)
    return this
  }
  order(col: string, opts: { ascending?: boolean } = {}) {
    this.sort = { col, asc: opts.ascending !== false }
    return this
  }
  single() {
    this.mode = 'single'
    return this
  }
  maybeSingle() {
    this.mode = 'maybe'
    return this
  }
  then<T>(res: (v: { data: any; error: null }) => T, rej?: (e: unknown) => T) {
    return new Promise<{ data: any; error: null }>((r) => setTimeout(() => r(this.run()), 120)).then(res, rej)
  }
  private run() {
    const rows = (db[this.table] ??= [])
    const match = (r: Row) => this.filters.every((f) => f(r))
    const now = new Date().toISOString()
    let out: Row[] = []
    if (this.op === 'insert') {
      const r: Row = { id: uid(), user_id: USER, created_at: now, updated_at: now, ...this.payload }
      if (this.table === 'companies') {
        Object.assign(r, { status: r.status ?? 'applied', status_changed_at: now, last_contact_at: now }, { ...this.payload })
        for (const k of ['nickname', 'emoji', 'role', 'ctc_lpa', 'cgpa_cutoff', 'location', 'notes']) r[k] ??= null
        db.company_status_history.push({ id: uid(), company_id: r.id, from_status: null, to_status: r.status, changed_at: now })
      }
      if (this.table === 'events') {
        Object.assign(r, { reschedule_count: 0, mood: null, checked_in_at: null, link_added_at: r.link ? now : null })
        const co = db.companies.find((c) => c.id === r.company_id)
        if (co) co.last_contact_at = now
      }
      rows.push(r)
      out = [r]
    } else if (this.op === 'update') {
      out = rows.filter(match)
      for (const r of out) {
        const p = this.payload!
        if (this.table === 'events' && p.starts_at && p.starts_at !== r.starts_at) r.reschedule_count++
        if (this.table === 'companies' && p.status && p.status !== r.status) {
          db.company_status_history.push({ id: uid(), company_id: r.id, from_status: r.status, to_status: p.status, changed_at: now })
          r.status_changed_at = r.last_contact_at = now
        }
        Object.assign(r, p, { updated_at: now })
      }
    } else if (this.op === 'delete') {
      const gone = rows.filter(match)
      db[this.table] = rows.filter((r) => !match(r))
      if (this.table === 'companies') db.events = db.events.filter((e) => !gone.some((c) => c.id === e.company_id))
      return { data: null, error: null }
    } else {
      out = rows.filter(match)
    }
    if (this.sort) {
      const { col, asc } = this.sort
      out = [...out].sort((a, b) => (a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0) * (asc ? 1 : -1))
    }
    let data: Row[] = out.map((r) => ({ ...r }))
    if (this.cols.includes('company:companies')) {
      data = data.map((r) => {
        const c = db.companies.find((x) => x.id === r.company_id)
        return { ...r, company: c && { id: c.id, name: c.name, emoji: c.emoji, nickname: c.nickname, status: c.status } }
      })
    }
    if (this.mode === 'single') return { data: data[0], error: null }
    if (this.mode === 'maybe') return { data: data[0] ?? null, error: null }
    return { data, error: null }
  }
}

const session = {
  access_token: 'demo',
  refresh_token: 'demo',
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  user: { id: USER, email: 'demo@survival.kit' },
}

export function createDemoClient() {
  return {
    from: (table: string) => ({
      select: (cols?: string) => new Query(table, 'select').select(cols),
      insert: (p: Row) => new Query(table, 'insert', p),
      update: (p: Row) => new Query(table, 'update', p),
      delete: () => new Query(table, 'delete'),
    }),
    auth: {
      getSession: async () => ({ data: { session } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => {
        sessionStorage.removeItem('psk-demo')
        location.href = '/'
        return { error: null }
      },
      signInWithPassword: async () => ({ data: { session }, error: null }),
    },
  }
}

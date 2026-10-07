# Placement Survival Kit — Plan

A personal, single-user placement-season tracker. PWA (installable on phone + laptop), free tiers only, IST everywhere.
No prep features, no motivational quotes, no CallMeBot/WhatsApp. Web Push is the only notification channel.

---

## 1. Stack (confirmed)

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | Fast dev, one codebase for phone + laptop |
| Styling | Tailwind CSS (class-based dark mode) | Quick mobile-first UI, light/dark |
| PWA | `vite-plugin-pwa` in **injectManifest** mode | Lets us write our own service worker with `push` + `notificationclick` handlers |
| Routing | `react-router-dom` | Screens: home, companies, graveyard, badges, etc. |
| Data fetching | `@supabase/supabase-js` + `@tanstack/react-query` | Caching, instant UI updates after edits |
| Dates | `date-fns` + `@date-fns/tz` | All display/scheduling in `Asia/Kolkata` |
| Confetti | `canvas-confetti` | Offer day mode |
| Charts | Hand-made with Tailwind (funnel = stacked bars) | No chart library needed |
| Backend | Supabase free: Postgres, Auth (email + password), RLS | |
| Scheduler | Supabase `pg_cron` + `pg_net` → Edge Function `tick` | Runs while app is closed |
| Push sending | Edge Function (Deno) using a Web Push library (`jsr:@negrel/webpush` or `npm:web-push` — whichever works cleanly in Supabase's Deno runtime; decided in Phase 4) | |
| Hosting | Vercel Hobby (free) | Auto-deploy from GitHub |

### Changes vs. the original brief
- **CallMeBot removed.** Web Push only.
- **Paste-to-add removed** (no `chrono-node`). Adding an event is a fast manual form instead.
- **Cron every 15 min** (as briefed). Because ticks are 15 min apart, reminder copy uses the *actual* minutes left ("in 12 minutes") rather than promising exactly 45/10.
- **Added `company_status_history` table.** Needed for: "Rejected on a Monday", "Three in one week", "most-ghosted month", and a correct funnel (a company that reached Interview then got Rejected still counts as an interview).
- **Check-ins folded into `events`** (`mood`, `checked_in_at` columns) instead of a separate `checkins` table — it's always exactly one per event.
- **Company nicknames are computed, not stored** — derived from event data (reschedule count, when the link was added, PPT "ran over" flag). DB triggers record the raw facts automatically.

---

## 2. Folder structure

```
Placement Tracker/
├─ index.html
├─ package.json
├─ vite.config.ts              # Vite + PWA manifest config
├─ tailwind.config.ts
├─ vercel.json                 # SPA rewrite so /company/123 works on refresh
├─ .env.local                  # your keys (never committed)
├─ .env.example                # template showing which keys are needed
├─ public/
│  └─ icons/                   # app icons, apple-touch-icon
├─ src/
│  ├─ main.tsx / App.tsx       # entry + routes
│  ├─ sw.ts                    # service worker: offline shell, push, notification taps
│  ├─ copy/                    # ★ ALL funny text lives here — edit freely
│  │  ├─ index.ts
│  │  ├─ loading.ts            # random loading messages
│  │  ├─ empty.ts              # empty-state jokes
│  │  ├─ chaos.ts              # chaos meter labels
│  │  ├─ badges.ts             # badge names + descriptions
│  │  ├─ nicknames.ts          # company titles
│  │  ├─ formals.ts            # formals milestones
│  │  ├─ ghosts.ts             # graveyard epitaphs
│  │  ├─ offer.ts              # award ceremony
│  │  └─ wrapped.ts            # Placement Wrapped slides
│  ├─ lib/
│  │  ├─ supabase.ts           # client
│  │  ├─ time.ts               # IST helpers (format, start/end of IST day, etc.)
│  │  ├─ clash.ts              # overlap detection
│  │  ├─ badges.ts             # badge unlock rules
│  │  ├─ nicknames.ts          # company title rules
│  │  ├─ stats.ts              # season stats + Wrapped numbers
│  │  └─ push.ts               # subscribe/unsubscribe, iOS detection
│  ├─ hooks/                   # useCompanies, useEvents, useSettings...
│  ├─ components/              # EventCard, Countdown, ChaosMeter, StatusPill, Tombstone...
│  └─ pages/                   # Home, Companies, Company, EventForm, CheckIn,
│                              # PptRating, Graveyard, Badges, Stats, Wrapped, Settings, Login
└─ supabase/
   ├─ migrations/
   │  ├─ 0001_schema.sql       # tables, enums, triggers
   │  ├─ 0002_rls.sql          # row level security
   │  └─ 0003_cron.sql         # pg_cron job (Phase 4)
   └─ functions/
      ├─ _shared/
      │  └─ notificationCopy.ts  # ★ push notification copy (8+ variants per type).
      │                          #   Re-exported from src/copy so it's still "one place".
      ├─ tick/                 # runs every 15 min: digest, heads-up, nag, check-in
      ├─ ack/                  # marks a notification as acknowledged (stops the nag)
      └─ send-test/            # "Send test notification" button
```

Why push copy lives under `supabase/functions/_shared/`: the Edge Function can only bundle files inside `supabase/functions/`. The app imports the same file, so there's still a single source of truth.

---

## 3. Database schema

All timestamps are `timestamptz` (stored UTC). Every table has `user_id uuid references auth.users` and RLS policy `user_id = auth.uid()` for select/insert/update/delete. The cron Edge Function uses the service-role key (bypasses RLS, server-side only — never shipped to the browser).

### Enums
```sql
company_status: applied | shortlisted | test | interview | offer | rejected | ghosted
event_type:     ppt | test | gd | interview | deadline | other
checkin_mood:   nailed | survived | dont_ask
```

### `settings` (one row per user)
| column | type | notes |
|---|---|---|
| user_id | uuid PK | |
| push_enabled | bool default true | |
| quiet_start / quiet_end | time null | e.g. 23:00–06:30 IST |
| ghost_after_days | int default 14 | suggest "Ghosted" after X days of silence |
| samosas_per_ppt | int default 2 | for Wrapped |
| updated_at | timestamptz | |

### `companies`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| name | text | |
| nickname | text null | your own nickname |
| emoji | text null | |
| role | text null | |
| ctc_lpa | numeric null | |
| cgpa_cutoff | numeric null | |
| location | text null | |
| notes | text null | |
| status | company_status default 'applied' | |
| status_changed_at | timestamptz | set by trigger |
| last_contact_at | timestamptz | bumped on status change / new event; drives ghost suggestion |
| ghost_suggest_snoozed_until | timestamptz null | "not yet, they'll call" |
| created_at / updated_at | timestamptz | |

### `company_status_history` (written automatically by trigger)
| id | user_id | company_id | from_status | to_status | changed_at |

### `events`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id, company_id | uuid | |
| type | event_type | |
| title | text | |
| starts_at | timestamptz | |
| ends_at | timestamptz null | |
| venue | text null | |
| link | text null | opened directly from the heads-up notification |
| notes | text null | |
| reschedule_count | int default 0 | trigger: +1 whenever `starts_at` changes |
| link_added_at | timestamptz null | trigger: set when link goes empty → filled ("Last-Minute Larry") |
| mood | checkin_mood null | post-event check-in |
| checked_in_at | timestamptz null | |
| created_at / updated_at | timestamptz | |

### `ppt_ratings`
| event_id PK | user_id | snacks_rating 1–5 | length_rating 1–5 | could_be_email bool | ran_over bool | created_at |

### `formals_log`
| user_id | day date (IST) | PK (user_id, day) |

### `badges_earned`
| id | user_id | badge_key text | company_id null | earned_at | unique (user_id, badge_key) |

### `push_subscriptions`
| id | user_id | endpoint text unique | p256dh | auth | device_label | created_at | last_success_at | fail_count |
Dead subscriptions (HTTP 404/410 from the push service) are deleted automatically.

### `notifications_sent` (idempotency ledger)
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| kind | text | digest / headsup / nag / checkin / test |
| event_id | uuid null | |
| dedupe_key | text **unique** | see below |
| title, body, url | text | what was sent (handy for debugging) |
| ack_token | uuid | random, used by the "ack" function |
| acknowledged_at | timestamptz null | |
| sent_at | timestamptz | |
| delivered | int | how many devices accepted it |
| error | text null | |

**Dedupe keys**
- digest → `digest:2026-10-07` (IST date)
- heads-up → `headsup:<event_id>:<starts_at>`
- nag → `nag:<event_id>:<starts_at>`
- check-in → `checkin:<event_id>`

Including `starts_at` means a **rescheduled** event gets fresh reminders for its new time, while the same time never gets two.

**Idempotency method:** the function first does `INSERT … ON CONFLICT (dedupe_key) DO NOTHING RETURNING id`. Only if a row comes back does it send. Two overlapping cron runs can't both win.

---

## 4. Notification rules (cron tick every 15 min)

| Notification | Fires when | Notes |
|---|---|---|
| Morning digest | IST time ≥ 07:00, no digest yet today, and before 12:00 | Lists today's events or a "nothing today" joke. Asks "Formals today?" if PPT/GD/Interview today. |
| Heads-up | first tick where the event starts in 15–52 min (lands ~38–52 min before) | Tap → opens the event link (or the event screen if no link) |
| Nag | first tick where the event starts in 2–22 min, heads-up sent ≥10 min earlier and **not acknowledged** | More panicked copy |
| Check-in | 60 min after `ends_at` (or `starts_at` if no end), up to 6 h later, no mood yet | Tap → check-in screen (PPTs also get the rating screen). Not sent for deadlines. |

**Acknowledged** = you tapped the heads-up, tapped its "On it" button (Android), or opened that event in the app.

**Quiet hours** delay only check-ins. Heads-ups and nags always go through — missing a 6 am OA is worse than being woken up.

---

## 5. What you create manually (all free, no credit card)

| # | Thing | When | Used for |
|---|---|---|---|
| 1 | GitHub account | before Phase 2 | stores the code; Vercel deploys from it |
| 2 | Supabase account + 1 project (region: Mumbai) | Phase 2 | DB, auth, cron, edge functions |
| 3 | Vercel account (sign in with GitHub) | Phase 2 | hosting |
| 4 | VAPID keys | Phase 4 | generated on your laptop with one command — no account |

I'll give click-by-click steps at each phase.

---

## 6. Known free-tier gotchas

- **Supabase pauses free projects after ~7 days with no activity.** During placement season you'll use it daily, so this shouldn't bite. If you stop opening it for a week+, it may pause and reminders stop until you click "Restore" in the dashboard.
- **iPhone push** requires iOS 16.4+ and the app added to the Home Screen. The app will detect iOS Safari and show an "Add to Home Screen first" guide.
- **Login is email + password, not magic link.** Supabase now requires your own SMTP server to customise emails, and magic links open in Safari instead of the iPhone home-screen app. Password login needs no email at all; your single user is created by hand in the dashboard.
- **Sign-ups get locked** after your first login (a Supabase toggle), so nobody else can create an account on your app.

---

## 7. Phases

1. **Plan** — this document. ✅
2. **Foundation** — scaffold Vite/React/TS/Tailwind/PWA, Supabase project, email + password login, schema + RLS migrations, deploy to Vercel.
3. **Core tracking** — companies, events, status pipeline (tap/swipe), Today/This-week timeline with pinned countdown, clash detector.
4. **Notifications** — push subscription, service worker, `tick`/`ack`/`send-test` functions, pg_cron, digest/heads-up/nag/check-in, idempotency, iOS install prompt, quiet hours, settings.
5. **Fun layer** — snarky copy bank, check-ins, ghost graveyard, rejection badges, company nicknames, chaos meter, PPT ratings, nag escalation, offer day mode, Placement Wrapped, formals counter.
6. **Polish** — season stats + funnel, dark mode pass, empty states, loading messages, final Android + iPhone test checklist, how-it-works walkthrough, free-tier list.

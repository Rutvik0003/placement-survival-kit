# Placement Survival Kit

A personal placement-season tracker with a sarcastic streak. Companies, PPTs, tests, interviews and deadlines — with reminders on your phone even when the app is closed. Installable on phone and laptop (PWA). Single user. 100% free tiers. All times IST.

---

## How it works (plain English)

There are three pieces, and none of them is a server you have to look after.

```
 Your phone / laptop                     Supabase (free)                         Push service
 ──────────────────                      ───────────────                         ────────────
 The app (React PWA)  ◄── data ──►  Postgres database + login             (Google / Apple / Mozilla —
 + service worker                     │  (row-level security:                 chosen by your browser,
   (runs even when the                │   only you can read your rows)        free, no account)
    app is closed)                    │                                           │
        ▲                             │  pg_cron: every 15 minutes ──►            │
        │                             │  "tick" Edge Function                     │
        │                             │   1. reads your events + settings          │
        │                             │   2. works out what's due                  │
        │                             │   3. writes it to notifications_sent       │
        │                             │      (so nothing is ever sent twice)       │
        │                             │   4. encrypts + sends it ───────────────► │
        └──────────── notification ◄──┴────────────────────────────────────────────┘
```

**The app** lives on Vercel. When you open it, your browser downloads it once and the *service worker* keeps a copy, so it opens instantly (even offline). Everything you add — companies, events, check-ins — is saved straight to your Supabase database. Row-level security means the database itself refuses to show your rows to anyone but your login.

**How a reminder gets to your phone:**

1. When you tap *Turn on* in Settings, your browser creates a private "address" for your device (a push subscription) and the app stores it in the `push_subscriptions` table.
2. Every 15 minutes, Supabase's built-in scheduler (`pg_cron`) calls the `tick` function.
3. `tick` looks at your events: is something starting in ~45 minutes? Did an event end an hour ago? Is it 7 AM? It picks a joke from the copy bank.
4. Before sending, it writes the notification into `notifications_sent` with a unique key (e.g. `headsup:<event>:<start time>`). If that key already exists, it skips — that's what makes double-sends impossible.
5. It encrypts the message for your device and hands it to your browser's push service (Google for Chrome/Android, Apple for iPhone).
6. The push service wakes the service worker on your phone, which shows the notification.
7. When you tap it, the service worker tells the `ack` function "seen" (this cancels the 10-minute nag) and opens the Meet/test link or the right screen.

**Nag logic:** if a heads-up hasn't been tapped (or the event opened in the app) and the event is ~10 minutes away, `tick` sends a louder one.

---

## Free services used

| Service | What it does here | Free-tier limits (check their pricing page — they change) | Your usage |
|---|---|---|---|
| **Supabase** (Free plan) | Database, login, scheduler (`pg_cron`), Edge Functions | 2 projects · 500 MB database · 5 GB egress/month · 500,000 Edge Function calls/month · 50,000 monthly users · **pauses after ~7 days without activity** | ~2,900 function calls/month (0.6%), a few MB of data |
| **Vercel** (Hobby) | Hosts the app, auto-deploys on every `git push` | Personal / non-commercial use · 100 GB bandwidth/month · up to 100 deployments/day | A few MB/month |
| **GitHub** (Free) | Stores the code; Vercel deploys from it | Unlimited private repos | 1 repo |
| **Browser push services** (Google FCM, Apple Push, Mozilla) | Deliver notifications to your devices | Free, no sign-up — your browser picks one automatically | — |

No credit card anywhere. Fonts are bundled in the app (no Google Fonts calls).

**If reminders ever stop:** Supabase dashboard → if the project says *Paused*, click **Restore**. Using the app regularly keeps it awake.

---

## Final test checklist

### Android (Chrome)
- [ ] Open the Vercel URL → log in → ⋮ menu → **Install app** → open from home screen (full-screen, ticket icon)
- [ ] Settings → **Turn on** notifications → Allow → **Send test notification** arrives (also with the screen locked)
- [ ] Add an event ~55 min ahead with a Meet link → heads-up arrives at the next :00/:15/:30/:45 → tap opens the link
- [ ] Ignore a heads-up → the "Bro. The test." nag arrives ~10–20 min before start
- [ ] Add an event that ended 1–2 h ago → "How did it go?" arrives → tap → pick a mood
- [ ] Next morning 7:00 → digest arrives
- [ ] Swipe a company right (advance) and left (reject) → Undo works → badge pop-up appears
- [ ] Turn on airplane mode → app still opens, shows the offline bar

### iPhone (Safari, iOS 16.4+)
- [ ] Safari → Settings shows the "Add to Home Screen" guide (not a Turn-on button)
- [ ] Share → **Add to Home Screen** → open it from the Home Screen
- [ ] Log in again inside the home-screen app (it has its own storage)
- [ ] Settings → **Turn on** → Allow → **Send test notification** arrives
- [ ] Repeat the heads-up / nag / check-in tests above

### Laptop
- [ ] Sidebar layout, live IST clock, Add event
- [ ] Optional: Chrome/Edge address bar → Install icon → get reminders on the laptop too

---

## Editing the jokes

All copy is in plain text files — no code knowledge needed, just keep the quotes and commas:

| File | What's in it |
|---|---|
| `supabase/functions/_shared/notificationCopy.ts` | Every push notification (heads-ups, nags, digest, check-ins) |
| `src/copy/fun.ts` | Graveyard epitaphs, badges, nicknames, chaos meter, Wrapped, formals, personas |
| `src/copy/core.ts` | Companies, events, timeline, clashes |
| `src/copy/loading.ts` | Random loading messages |
| `src/copy/*.ts` | Everything else |

App copy goes live on the next `git push`. Notification copy also needs the functions redeployed:

```bash
npx supabase functions deploy --no-verify-jwt --use-api
```

---

## Development

```bash
npm install
npm run dev            # http://localhost:5173
```

- `http://localhost:5173/?demo` — runs on fake in-memory data, no login (dev only; never shipped to production).
- `.env.local` needs `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, `VITE_VAPID_PUBLIC_KEY` (see `.env.example`).
- Edge Function secrets live in `supabase/functions/.env` (git-ignored) and are uploaded with `npx supabase secrets set --env-file supabase/functions/.env`.
- Database: `supabase/migrations/` — run new files in the Supabase SQL Editor in order.

### Project layout

```
src/
  pages/        screens (Home, Companies, EventForm, Graveyard, Wrapped, …)
  components/   UI pieces (EventCard, NextUp, GraveyardScene, BadgeUnlock, …)
  hooks/        data loading (React Query + Supabase)
  lib/          pure logic: IST time, clashes, badges, nicknames, stats, push
  copy/         all user-facing text
  sw.ts         service worker: offline cache + push + notification taps
supabase/
  migrations/   database schema, security rules, cron job
  functions/    tick (scheduler), ack (stop the nag), send-test
    _shared/    planner, Web Push sender, notification copy
```

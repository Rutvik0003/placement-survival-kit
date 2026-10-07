// Runs every 15 minutes (pg_cron → pg_net → here). Works out what's due and
// sends it. Safe to run twice: each notification is claimed in
// notifications_sent (unique dedupe_key) *before* it is sent.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { plan, istDayStart, type PlanEvent, type SentRow } from '../_shared/plan.ts'
import { deliver, json, vapidFromEnv } from '../_shared/deliver.ts'

const HOUR = 3_600_000

Deno.serve(async (req) => {
  if (req.headers.get('authorization') !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return json({ error: 'unauthorized' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const db = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })
  const vapid = vapidFromEnv()
  const now = Date.now()
  const report: Record<string, unknown>[] = []

  const { data: users, error } = await db
    .from('settings')
    .select('user_id, quiet_start, quiet_end')
    .eq('push_enabled', true)
  if (error) return json({ error: error.message }, 500)

  for (const u of users ?? []) {
    // Everything that could matter: today's events (digest), the next hour (reminders),
    // and the last ~15 hours (check-ins for long or late events).
    const from = Math.min(istDayStart(now), now - 15 * HOUR)
    const to = Math.max(istDayStart(now) + 24 * HOUR, now + 2 * HOUR)
    const [{ data: events }, { data: sent }] = await Promise.all([
      db
        .from('events')
        .select('id, type, title, starts_at, ends_at, link, mood, company:companies(name)')
        .eq('user_id', u.user_id)
        .gte('starts_at', new Date(from).toISOString())
        .lt('starts_at', new Date(to).toISOString()),
      db
        .from('notifications_sent')
        .select('dedupe_key, kind, event_id, sent_at, acknowledged_at')
        .eq('user_id', u.user_id)
        .gte('sent_at', new Date(now - 48 * HOUR).toISOString()),
    ])

    const due = plan(now, (events ?? []) as unknown as PlanEvent[], (sent ?? []) as SentRow[], u)

    for (const p of due) {
      // Claim it. If another run already did, the insert is ignored and we skip.
      const { data: claimed, error: claimErr } = await db
        .from('notifications_sent')
        .upsert(
          {
            user_id: u.user_id,
            kind: p.kind,
            event_id: p.event_id,
            dedupe_key: p.dedupe_key,
            title: p.title,
            body: p.body,
            url: p.url,
          },
          { onConflict: 'dedupe_key', ignoreDuplicates: true },
        )
        .select('id, ack_token')
      if (claimErr || !claimed?.length) continue

      const row = claimed[0]
      const result = await deliver(
        db,
        u.user_id,
        {
          title: p.title,
          body: p.body,
          url: p.url,
          tag: p.tag,
          kind: p.kind,
          ack: `${supabaseUrl}/functions/v1/ack?t=${row.ack_token}`,
        },
        vapid,
      )
      await db
        .from('notifications_sent')
        .update({ delivered: result.delivered, error: result.errors.join(' | ') || null })
        .eq('id', row.id)
      report.push({ key: p.dedupe_key, ...result })
    }
  }

  return json({ ok: true, at: new Date(now).toISOString(), sent: report })
})

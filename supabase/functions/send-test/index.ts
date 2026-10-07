// "Send test notification" button in Settings. Requires the logged-in user's token.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { cors, deliver, json, vapidFromEnv } from '../_shared/deliver.ts'
import { pickLine, testBody, testTitle } from '../_shared/notificationCopy.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })
  const jwt = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data, error } = await db.auth.getUser(jwt)
  if (error || !data.user) return json({ error: 'not signed in' }, 401)

  const body = pickLine(testBody)
  const { data: row } = await db
    .from('notifications_sent')
    .insert({
      user_id: data.user.id,
      kind: 'test',
      dedupe_key: `test:${crypto.randomUUID()}`,
      title: testTitle,
      body,
      url: '/settings',
    })
    .select('id')
    .single()

  const result = await deliver(db, data.user.id, { title: testTitle, body, url: '/settings', tag: 'test', kind: 'test' }, vapidFromEnv())
  if (row) await db.from('notifications_sent').update({ delivered: result.delivered, error: result.errors.join(' | ') || null }).eq('id', row.id)
  return json(result)
})

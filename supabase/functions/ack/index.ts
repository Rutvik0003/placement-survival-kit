// Marks a notification as seen (stops the nag). Called by the service worker
// when a notification is tapped. The token is a random UUID per notification.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { cors, json } from '../_shared/deliver.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const token = new URL(req.url).searchParams.get('t') ?? ''
  if (!UUID.test(token)) return json({ error: 'bad token' }, 400)

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })
  await db
    .from('notifications_sent')
    .update({ acknowledged_at: new Date().toISOString() })
    .eq('ack_token', token)
    .is('acknowledged_at', null)
  return json({ ok: true })
})

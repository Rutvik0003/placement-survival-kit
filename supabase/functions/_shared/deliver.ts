// Sends one notification to every device a user has registered, and keeps the
// subscription table tidy (dead devices are removed).
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { sendPush, type Vapid } from './webpush.ts'

export function vapidFromEnv(): Vapid {
  return {
    publicKey: Deno.env.get('VAPID_PUBLIC_KEY')!,
    privateKey: Deno.env.get('VAPID_PRIVATE_KEY')!,
    subject: Deno.env.get('VAPID_SUBJECT') ?? 'https://placement-survival-kit.vercel.app',
  }
}

export type Payload = {
  title: string
  body: string
  url: string
  tag: string
  kind: string
  ack?: string
}

export async function deliver(db: SupabaseClient, userId: string, payload: Payload, vapid: Vapid) {
  const { data: subs, error } = await db.from('push_subscriptions').select('*').eq('user_id', userId)
  if (error) return { delivered: 0, errors: [error.message] }
  let delivered = 0
  const errors: string[] = []
  await Promise.all(
    (subs ?? []).map(async (s) => {
      const r = await sendPush(s, payload, vapid, { ttl: payload.kind === 'digest' ? 6 * 3600 : 3600, urgency: 'high' })
      if (r.ok) {
        delivered++
        await db.from('push_subscriptions').update({ last_success_at: new Date().toISOString(), fail_count: 0 }).eq('id', s.id)
      } else if (r.status === 404 || r.status === 410) {
        // The browser threw this subscription away (app uninstalled, permission revoked…).
        await db.from('push_subscriptions').delete().eq('id', s.id)
      } else {
        errors.push(`${r.status}: ${r.error}`)
        await db.from('push_subscriptions').update({ fail_count: (s.fail_count ?? 0) + 1 }).eq('id', s.id)
      }
    }),
  )
  return { delivered, errors }
}

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

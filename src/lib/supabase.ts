import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createDemoClient, isDemo } from '../dev/demo'

// Tolerate a pasted "…/rest/v1/" ending or trailing slash.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim().replace(/\/(rest\/v1\/?)?$/, '')
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined

const demo = import.meta.env.DEV && isDemo()

export const isConfigured = demo || Boolean(url && key)

export const supabase: SupabaseClient = demo
  ? (createDemoClient() as unknown as SupabaseClient)
  : createClient(url ?? 'http://localhost', key ?? 'missing', {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })

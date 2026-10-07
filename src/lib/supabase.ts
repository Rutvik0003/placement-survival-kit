import { createClient } from '@supabase/supabase-js'

// Tolerate a pasted "…/rest/v1/" ending or trailing slash.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim().replace(/\/(rest\/v1\/?)?$/, '')
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined

export const isConfigured = Boolean(url && key)

export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

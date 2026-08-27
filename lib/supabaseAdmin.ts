import { createClient } from '@supabase/supabase-js'

// SERVER-ONLY. Never import this file from a 'use client' component —
// the service role key bypasses RLS and email verification entirely,
// and must never reach the browser bundle.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase service role environment variables')
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

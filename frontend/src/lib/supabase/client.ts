import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Uses placeholder defaults to prevent crashing locally before env vars are injected
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
  )
}

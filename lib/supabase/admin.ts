import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Admin client — uses service role key. Server-side only. Never import in Client Components.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

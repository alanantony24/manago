import { createClient } from "@supabase/supabase-js"

/** Browser anon Supabase client for public reads (amenity/feature lists, etc.). */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

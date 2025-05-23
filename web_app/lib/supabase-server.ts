import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

export function createServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log("Attempting to create Supabase client in createServerClient.")
  console.log("SUPABASE_URL from env:", supabaseUrl ? "Loaded" : "MISSING or empty")
  console.log(
    "SUPABASE_SERVICE_ROLE_KEY from env:",
    supabaseKey ? "Loaded (first 5 chars: " + (supabaseKey ? supabaseKey.substring(0, 5) : "N/A") + ")" : "MISSING or empty"
  )

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "CRITICAL ERROR in createServerClient: Missing Supabase environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Please check .env.local and restart the server."
    )
    throw new Error("Missing Supabase environment variables")
  }

  return createClient<Database>(supabaseUrl, supabaseKey)
}

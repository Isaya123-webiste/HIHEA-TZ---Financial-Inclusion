import { createClient } from "@supabase/supabase-js"
import type { Database } from "./supabase"

function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing Supabase admin environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    )
  }
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Lazy proxy — client is created on first use, not at module load time
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdmin>, {
  get(_t, prop) {
    return (createSupabaseAdmin() as any)[prop]
  },
})

// Helper function to check if user exists
export async function checkUserExists(userId: string) {
  try {
    const { data, error } = await supabaseAdmin.from("profiles").select("id").eq("id", userId).single()

    return { exists: !!data, error }
  } catch (error) {
    console.error("Check user exists error:", error)
    return { exists: false, error }
  }
}

// Helper function to get user profile with admin privileges
export async function getAdminUserProfile(userId: string) {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        *,
        branches (
          id,
          name
        )
      `)
      .eq("id", userId)
      .single()

    if (error) {
      return { error: error.message }
    }

    return { profile }
  } catch (error) {
    console.error("Get admin user profile error:", error)
    return { error: "Failed to get user profile" }
  }
}

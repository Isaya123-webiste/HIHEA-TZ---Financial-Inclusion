"use server"

import { createClient } from "@supabase/supabase-js"
import { signIn, signOut } from "./auth"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Admin client with service role (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Regular client for auth
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey)

export async function signInAndRedirect(formData: FormData) {
  try {
    const result = await signIn(formData)

    if (result.error) {
      return { error: result.error }
    }

    if (result.success && result.redirectUrl) {
      return { success: true, redirectUrl: result.redirectUrl }
    }

    return { success: true }
  } catch (error) {
    console.error("Sign in and redirect error:", error)
    return { error: "An unexpected error occurred during sign in" }
  }
}

export async function signOutAndRedirect() {
  try {
    const result = await signOut()

    if (result.error) {
      return { error: result.error }
    }

    return { success: true, redirectUrl: "/" }
  } catch (error) {
    console.error("Sign out and redirect error:", error)
    return { error: "An unexpected error occurred during sign out" }
  }
}

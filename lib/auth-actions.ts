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
  console.log("[v0] signInAndRedirect called")

  try {
    const result = await signIn(formData)

    console.log("[v0] signIn result:", result)

    if (result.error) {
      console.log("[v0] Sign in failed:", result.error)
      return { error: result.error }
    }

    if (result.success && result.redirectUrl) {
      console.log("[v0] Sign in successful, redirect URL:", result.redirectUrl)
      return { success: true, redirectUrl: result.redirectUrl }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Sign in and redirect error:", error)
    return { error: `An unexpected error occurred: ${error.message || "Please try again"}` }
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

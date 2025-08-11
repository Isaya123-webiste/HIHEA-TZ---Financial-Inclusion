"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side Supabase client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function createUserProfile(userId: string, fullName: string, email: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        full_name: fullName,
        email: email,
      })
      .select()
      .single()

    if (error) {
      console.error("Profile creation error:", error)
      return { error: error.message }
    }

    return { success: true, profile: data }
  } catch (error) {
    console.error("Profile creation error:", error)
    return { error: "Failed to create user profile" }
  }
}

export async function getUserProfile(userId: string) {
  try {
    const { data: profile, error } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      return { error: error.message }
    }

    return { profile }
  } catch (error) {
    console.error("Get profile error:", error)
    return { error: "Failed to get user profile" }
  }
}

export async function updateUserProfile(userId: string, updates: { full_name?: string; email?: string }) {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    return { profile: data, success: true }
  } catch (error) {
    console.error("Update profile error:", error)
    return { error: "Failed to update user profile" }
  }
}

"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function debugAdminUser(userId: string) {
  try {
    console.log("Debugging admin user:", userId)

    // Check if user exists in auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
    console.log("Auth user:", authUser, "Error:", authError)

    // Check profiles table
    const { data: allProfiles, error: allProfilesError } = await supabaseAdmin.from("profiles").select("*").limit(10)

    console.log("All profiles sample:", allProfiles, "Error:", allProfilesError)

    // Check specific user profile
    const { data: specificUser, error: specificError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    console.log("Specific user profile:", specificUser, "Error:", specificError)

    // Check by email if we know it
    const { data: userByEmail, error: emailError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", "isayaamos123@gmail.com")
      .single()

    console.log("User by email:", userByEmail, "Error:", emailError)

    return {
      authUser: authUser?.user,
      allProfiles: allProfiles?.slice(0, 3), // Just first 3 for debugging
      specificUser,
      userByEmail,
      errors: {
        authError,
        allProfilesError,
        specificError,
        emailError,
      },
    }
  } catch (error) {
    console.error("Debug error:", error)
    return { error: "Debug failed" }
  }
}

export async function fixAdminRole(userId: string) {
  try {
    console.log("Fixing admin role for user:", userId)

    // First, get the user's email from auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (authError || !authUser.user) {
      return { error: "User not found in auth system" }
    }

    const userEmail = authUser.user.email
    console.log("User email:", userEmail)

    // Update or insert profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: userEmail,
          full_name: authUser.user.user_metadata?.full_name || "Admin User",
          role: "admin",
          status: "active",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      )
      .select()
      .single()

    if (profileError) {
      console.error("Profile upsert error:", profileError)
      return { error: `Failed to update profile: ${profileError.message}` }
    }

    console.log("Profile updated:", profile)
    return { success: true, profile }
  } catch (error) {
    console.error("Fix admin role error:", error)
    return { error: "Failed to fix admin role" }
  }
}

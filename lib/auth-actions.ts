"use server"

import { createClient } from "@supabase/supabase-js"

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
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  try {
    console.log("Attempting to sign in user:", email)

    // Authenticate with regular client
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error("Auth error:", authError)
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: "Authentication failed" }
    }

    console.log("User authenticated successfully:", authData.user.id)

    // Use admin client to get profile (bypasses RLS)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, status, full_name")
      .eq("id", authData.user.id)
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)

      // If profile doesn't exist, create one for the admin user
      if (email === "isayaamos123@gmail.com") {
        console.log("Creating admin profile...")

        const { data: newProfile, error: createError } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: authData.user.id,
            email: email,
            full_name: "Administrator",
            role: "admin",
            status: "active",
          })
          .select("role, status, full_name")
          .single()

        if (createError) {
          console.error("Failed to create admin profile:", createError)
          return { error: "Failed to create admin profile" }
        }

        console.log("Admin profile created successfully")
        return { success: true, redirectUrl: "/admin" }
      } else {
        return { error: `Profile not found for ${email}. Please contact administrator.` }
      }
    }

    if (!profileData) {
      return { error: "Profile data not found" }
    }

    console.log("Profile found:", profileData)

    // Check if account is active
    if (profileData.status !== "active") {
      return { error: "Your account is not active. Please contact administrator." }
    }

    // Determine redirect URL based on role
    let redirectUrl = "/program-officer" // Default

    switch (profileData.role) {
      case "admin":
        redirectUrl = "/admin"
        break
      case "branch_manager":
        redirectUrl = "/branch-manager"
        break
      case "program_officer":
        redirectUrl = "/program-officer"
        break
      case "branch_report_officer":
        redirectUrl = "/branch-report-officer" // Changed from "/report-officer"
        break
      case "report_officer": // Legacy support
        redirectUrl = "/branch-report-officer"
        break
      default:
        console.log(`Unknown role: ${profileData.role}`)
        break
    }

    console.log(`User ${email} with role ${profileData.role} should redirect to ${redirectUrl}`)

    // Return success and the redirect URL
    return { success: true, redirectUrl }
  } catch (error) {
    console.error("Sign in error:", error)
    return { error: "An unexpected error occurred during sign in" }
  }
}

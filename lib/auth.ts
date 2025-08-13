"use server"

import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side Supabase client with service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Regular client for auth operations
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const confirmPassword = formData.get("confirmPassword") as string

  // Validation
  if (!email || !password || !fullName || !confirmPassword) {
    return { error: "All fields are required" }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" }
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long" }
  }

  try {
    // Sign up the user using Supabase Auth API
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    // Create profile in our profiles table using admin client
    if (data.user) {
      const { error: profileError } = await supabaseAdmin.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
        email: email,
      })

      if (profileError) {
        console.error("Profile creation error:", profileError)
        // Don't return error here as user is already created
      }
    }

    return {
      success: true,
      message: data.user?.email_confirmed_at
        ? "Account created successfully! You can now sign in."
        : "Account created successfully! Please check your email to verify your account before signing in.",
    }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred during registration" }
  }
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  try {
    // Sign in using Supabase Auth API
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }

    if (data.user) {
      // Get user profile to determine role-based redirect
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("role, status")
        .eq("id", data.user.id)
        .single()

      if (profileError || !profile) {
        return { error: "User profile not found. Please contact administrator." }
      }

      // Check if user account is active
      if (profile.status !== "active") {
        await supabase.auth.signOut()
        return { error: "Your account is not active. Please contact administrator." }
      }

      // Redirect based on role to specific paths
      switch (profile.role) {
        case "admin":
          redirect("/admin")
          break
        case "branch_manager":
          redirect("/branch-manager")
          break
        case "program_officer":
          redirect("/program-officer")
          break
        case "branch_report_officer":
          redirect("/branch-report-officer") // FIXED: Changed from "/report-officer"
          break
        // Legacy support for old role name
        case "report_officer":
          redirect("/branch-report-officer")
          break
        default:
          return { error: "Invalid user role. Please contact administrator." }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Sign in error:", error)
    return { error: "An unexpected error occurred during sign in" }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      return { error: error.message }
    }
  } catch (error) {
    console.error("Sign out error:", error)
    return { error: "An unexpected error occurred during sign out" }
  }

  redirect("/")
}

export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      return { error: error.message }
    }

    return { user }
  } catch (error) {
    console.error("Get user error:", error)
    return { error: "An unexpected error occurred" }
  }
}

export async function getUserProfile(userId: string) {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        *,
        branches!profiles_branch_id_fkey (
          id,
          name
        )
      `)
      .eq("id", userId)
      .single()

    if (error) {
      return { error: error.message }
    }

    return {
      profile: {
        ...profile,
        branch_name: profile.branches?.name || "No Branch",
      },
    }
  } catch (error) {
    console.error("Get profile error:", error)
    return { error: "An unexpected error occurred" }
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
    return { error: "An unexpected error occurred" }
  }
}

// Helper function to check user role and redirect if necessary
export async function checkUserRoleAndRedirect(requiredRole: string) {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      redirect("/")
      return { error: "Not authenticated" }
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      redirect("/")
      return { error: "Profile not found" }
    }

    if (profile.status !== "active") {
      redirect("/")
      return { error: "Account not active" }
    }

    // Handle both old and new role names
    const normalizedRole = profile.role === "report_officer" ? "branch_report_officer" : profile.role
    const normalizedRequiredRole = requiredRole === "report_officer" ? "branch_report_officer" : requiredRole

    if (normalizedRole !== normalizedRequiredRole) {
      // Redirect to appropriate dashboard based on actual role
      switch (normalizedRole) {
        case "admin":
          redirect("/admin")
          break
        case "branch_manager":
          redirect("/branch-manager")
          break
        case "program_officer":
          redirect("/program-officer")
          break
        case "branch_report_officer":
          redirect("/branch-report-officer") // FIXED: Changed from "/report-officer"
          break
        default:
          redirect("/")
      }
      return { error: "Insufficient permissions" }
    }

    return { user, profile, success: true }
  } catch (error) {
    console.error("Check user role error:", error)
    redirect("/")
    return { error: "An unexpected error occurred" }
  }
}

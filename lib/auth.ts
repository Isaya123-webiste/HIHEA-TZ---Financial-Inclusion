"use server"

import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

const createAuthClient = () => {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

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
    const supabase = await createClient()

    // Sign up the user using Supabase Auth API
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
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

  console.log("[v0] Sign in attempt for:", email)

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  try {
    const supabase = await createClient()

    console.log("[v0] Calling Supabase signInWithPassword...")
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.log("[v0] Supabase auth error:", error.message)
      return { error: error.message }
    }

    console.log("[v0] Auth successful, user ID:", data.user?.id)

    if (data.user) {
      console.log("[v0] Fetching user profile...")

      try {
        // Get user profile to determine role-based redirect
        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("role, status")
          .eq("id", data.user.id)
          .single()

        console.log("[v0] Profile query result:", { profile, error: profileError })

        if (profileError) {
          console.error("[v0] Profile fetch error:", profileError)
          await supabase.auth.signOut()
          return { error: `Profile error: ${profileError.message || "Could not fetch user profile"}` }
        }

        if (!profile) {
          console.error("[v0] No profile found for user")
          await supabase.auth.signOut()
          return { error: "User profile not found. Please contact administrator." }
        }

        console.log("[v0] Profile found - Role:", profile.role, "Status:", profile.status)

        // Check if user account is active
        if (profile.status !== "active") {
          console.log("[v0] User account is not active")
          await supabase.auth.signOut()
          return { error: "Your account is not active. Please contact administrator." }
        }

        // Return redirect URL based on role
        let redirectUrl = "/program-officer" // Default

        switch (profile.role) {
          case "admin":
            redirectUrl = "/admin"
            break
          case "branch_manager":
            redirectUrl = "/branch-manager"
            break
          case "program_officer":
            redirectUrl = "/program-officer"
            break
          case "assistance_program_officer":
            redirectUrl = "/assistance-program-officer"
            break
          case "branch_report_officer":
            redirectUrl = "/branch-report-officer"
            break
          case "report_officer":
            redirectUrl = "/branch-report-officer"
            break
          default:
            console.error("[v0] Invalid role:", profile.role)
            await supabase.auth.signOut()
            return { error: "Invalid user role. Please contact administrator." }
        }

        console.log("[v0] Login successful, redirecting to:", redirectUrl)
        return { success: true, redirectUrl }
      } catch (profileFetchError: any) {
        console.error("[v0] Unexpected error fetching profile:", profileFetchError)
        await supabase.auth.signOut()
        return {
          error: `Failed to load user profile: ${profileFetchError.message || "Unknown error"}. Please try again.`,
        }
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Sign in error:", error)
    return { error: `An unexpected error occurred: ${error.message || "Please try again"}` }
  }
}

export async function signOut() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      return { error: error.message }
    }
    return { success: true, redirectUrl: "/" }
  } catch (error) {
    console.error("Sign out error:", error)
    return { error: "An unexpected error occurred during sign out" }
  }
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient()
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

export async function checkUserRoleAndRedirect(requiredRole: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return { error: "Not authenticated", redirectUrl: "/" }
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return { error: "Profile not found", redirectUrl: "/" }
    }

    if (profile.status !== "active") {
      return { error: "Account not active", redirectUrl: "/" }
    }

    const normalizedRole = profile.role === "report_officer" ? "branch_report_officer" : profile.role
    const normalizedRequiredRole = requiredRole === "report_officer" ? "branch_report_officer" : requiredRole

    if (normalizedRole !== normalizedRequiredRole) {
      let redirectUrl = "/"

      switch (normalizedRole) {
        case "admin":
          redirectUrl = "/admin"
          break
        case "branch_manager":
          redirectUrl = "/branch-manager"
          break
        case "program_officer":
          redirectUrl = "/program-officer"
          break
        case "assistance_program_officer":
          redirectUrl = "/assistance-program-officer"
          break
        case "branch_report_officer":
          redirectUrl = "/branch-report-officer"
          break
        default:
          redirectUrl = "/"
      }

      return { error: "Insufficient permissions", redirectUrl }
    }

    return { user, profile, success: true }
  } catch (error) {
    console.error("Check user role error:", error)
    return { error: "An unexpected error occurred", redirectUrl: "/" }
  }
}

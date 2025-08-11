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

// Validate invitation token and get user data
export async function validateInvitationToken(token: string) {
  try {
    // Get user by invitation token
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        *,
        branches!profiles_branch_id_fkey (
          id,
          name
        )
      `)
      .eq("invitation_token", token)
      .single()

    if (error || !profile) {
      return { error: "Invalid invitation token" }
    }

    // Check if token is expired
    if (profile.invitation_expiry && new Date(profile.invitation_expiry) < new Date()) {
      return { error: "Invitation token has expired" }
    }

    // Check if account is already set up
    if (profile.invitation_status === "completed") {
      return { error: "Account has already been set up" }
    }

    return {
      success: true,
      user: {
        ...profile,
        branch_name: profile.branches?.name || "No Branch",
      },
    }
  } catch (error) {
    console.error("Validate invitation token error:", error)
    return { error: "Failed to validate invitation token" }
  }
}

// Complete account setup with new password
export async function completeAccountSetup(token: string, newPassword: string) {
  try {
    // Validate token first
    const tokenValidation = await validateInvitationToken(token)
    if (!tokenValidation.success || !tokenValidation.user) {
      return { error: tokenValidation.error }
    }

    const user = tokenValidation.user

    // Update user password in auth
    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    })

    if (passwordError) {
      return { error: "Failed to update password" }
    }

    // Update profile to mark setup as complete
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        invitation_status: "completed",
        status: "active", // Activate the user
        invitation_token: null, // Clear the token for security
        temp_password: null, // Clear temp password
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (profileError) {
      return { error: "Failed to complete account setup" }
    }

    // Log the completion
    await supabaseAdmin.from("user_management").insert({
      admin_id: user.id, // Self-action
      action: "COMPLETE_ACCOUNT_SETUP",
      target_user_id: user.id,
      target_user_email: user.email,
      details: {
        completed_at: new Date().toISOString(),
        setup_method: "invitation_token",
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Complete account setup error:", error)
    return { error: "Failed to complete account setup" }
  }
}

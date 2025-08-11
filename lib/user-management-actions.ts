"use server"

import { createClient } from "@supabase/supabase-js"
import { checkAdminRole } from "./admin-actions"
import { sendInvitationEmail, sendBulkInvitationEmails } from "./email-service"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Helper function to get base URL - simplified version
function getBaseUrl(): string {
  // Use environment variable if set, otherwise default to localhost
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}

// Generate a secure random password
function generateSecurePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Generate invitation token
function generateInvitationToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Create single user with invitation
export async function createUserWithInvitation(
  adminId: string,
  userData: {
    full_name: string
    email: string
    role: string
    branch_id: string
    phone?: string
  },
) {
  try {
    // Verify admin role
    const adminCheck = await checkAdminRole(adminId)
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("email", userData.email)
      .single()

    if (existingUser) {
      return { error: "A user with this email already exists" }
    }

    // Generate temporary password and invitation token
    const tempPassword = generateSecurePassword()
    const invitationToken = generateInvitationToken()
    const invitationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create user in auth with temporary password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        invitation_pending: true,
      },
    })

    if (authError) {
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: "Failed to create user account" }
    }

    // Create profile with invitation details
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user.id,
        full_name: userData.full_name,
        email: userData.email,
        role: userData.role,
        branch_id: userData.branch_id,
        phone: userData.phone || "",
        status: "pending",
        invitation_token: invitationToken,
        invitation_sent: true,
        invitation_status: "sent",
        invitation_expiry: invitationExpiry.toISOString(),
        temp_password: tempPassword,
      })
      .select()
      .single()

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return { error: profileError.message }
    }

    // After successful profile creation, send invitation email
    if (profileData) {
      // Get admin name for email
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("full_name").eq("id", adminId).single()

      // Get branch name for email
      const { data: branch } = await supabaseAdmin.from("branches").select("name").eq("id", userData.branch_id).single()

      // Get base URL and send invitation email
      const baseUrl = getBaseUrl()
      await sendInvitationEmail(
        userData.email,
        userData.full_name,
        invitationToken,
        branch?.name || "Unknown Branch",
        adminProfile?.full_name || "Admin",
        baseUrl,
      )
    }

    // Log the action
    await logUserAction(adminId, "CREATE_USER_WITH_INVITATION", authData.user.id, userData.email, userData)

    return {
      user: profileData,
      invitationToken,
      tempPassword,
      success: true,
    }
  } catch (error) {
    console.error("Create user with invitation error:", error)
    return { error: "Failed to create user with invitation" }
  }
}

// Alternative method: Create user with direct activation (no email required)
export async function createUserDirectActivation(
  adminId: string,
  userData: {
    full_name: string
    email: string
    role: string
    branch_id: string
    phone?: string
    password: string
  },
) {
  try {
    // Verify admin role
    const adminCheck = await checkAdminRole(adminId)
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("email", userData.email)
      .single()

    if (existingUser) {
      return { error: "A user with this email already exists" }
    }

    // Create user in auth with provided password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: userData.full_name,
      },
    })

    if (authError) {
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: "Failed to create user account" }
    }

    // Create profile with active status
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user.id,
        full_name: userData.full_name,
        email: userData.email,
        role: userData.role,
        branch_id: userData.branch_id,
        phone: userData.phone || "",
        status: "active", // Directly activate
        invitation_sent: false,
        invitation_status: "completed",
      })
      .select()
      .single()

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return { error: profileError.message }
    }

    // Log the action
    await logUserAction(adminId, "CREATE_USER_DIRECT_ACTIVATION", authData.user.id, userData.email, userData)

    return {
      user: profileData,
      success: true,
    }
  } catch (error) {
    console.error("Create user direct activation error:", error)
    return { error: "Failed to create user with direct activation" }
  }
}

// Bulk import users from CSV data
export async function bulkImportUsers(
  adminId: string,
  csvData: Array<{
    full_name: string
    email: string
    role: string
    phone?: string
  }>,
  branchId: string,
) {
  try {
    // Verify admin role
    const adminCheck = await checkAdminRole(adminId)
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
    }

    const results = {
      successful: [] as any[],
      failed: [] as any[],
      duplicates: [] as any[],
    }

    // Process each user
    for (const userData of csvData) {
      try {
        // Check if email already exists
        const { data: existingUser } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("email", userData.email)
          .single()

        if (existingUser) {
          results.duplicates.push({
            ...userData,
            error: "Email already exists",
          })
          continue
        }

        // Create user with invitation
        const result = await createUserWithInvitation(adminId, {
          ...userData,
          branch_id: branchId,
        })

        if (result.success && result.user) {
          results.successful.push({
            ...userData,
            id: result.user.id,
            invitationToken: result.invitationToken,
          })
        } else {
          results.failed.push({
            ...userData,
            error: result.error,
          })
        }
      } catch (error) {
        results.failed.push({
          ...userData,
          error: "Unexpected error during creation",
        })
      }
    }

    // After processing all users, send bulk invitation emails
    if (results.successful.length > 0) {
      // Get admin and branch names
      const { data: adminProfile } = await supabaseAdmin.from("profiles").select("full_name").eq("id", adminId).single()

      const { data: branch } = await supabaseAdmin.from("branches").select("name").eq("id", branchId).single()

      // Get base URL and send bulk emails
      const baseUrl = getBaseUrl()
      await sendBulkInvitationEmails(
        results.successful,
        branch?.name || "Unknown Branch",
        adminProfile?.full_name || "Admin",
        baseUrl,
      )
    }

    // Log bulk import action
    await logUserAction(adminId, "BULK_IMPORT_USERS", undefined, undefined, {
      total: csvData.length,
      successful: results.successful.length,
      failed: results.failed.length,
      duplicates: results.duplicates.length,
      branchId,
    })

    return {
      success: true,
      results,
    }
  } catch (error) {
    console.error("Bulk import users error:", error)
    return { error: "Failed to bulk import users" }
  }
}

// Get all users excluding admins (give admin respect!)
export async function getAllNonAdminUsers() {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        *,
        branches!profiles_branch_id_fkey (
          id,
          name
        )
      `)
      .neq("role", "admin") // Exclude admins - they deserve respect!
      .order("created_at", { ascending: false })

    if (error) {
      return { error: error.message }
    }

    // Transform data to include branch name
    const usersWithBranches = profiles?.map((profile) => ({
      ...profile,
      branch_name: profile.branches?.name || "No Branch",
    }))

    return { users: usersWithBranches }
  } catch (error) {
    console.error("Get all non-admin users error:", error)
    return { error: "Failed to get users" }
  }
}

// Resend invitation email
export async function resendInvitation(adminId: string, userId: string) {
  try {
    // Verify admin role
    const adminCheck = await checkAdminRole(adminId)
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select(`
        *,
        branches!profiles_branch_id_fkey (
          name
        )
      `)
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      return { error: "User not found" }
    }

    // Generate new invitation token and expiry
    const newInvitationToken = generateInvitationToken()
    const newInvitationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Update profile with new invitation details
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        invitation_token: newInvitationToken,
        invitation_status: "sent",
        invitation_expiry: newInvitationExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      return { error: updateError.message }
    }

    // Get admin name and send new invitation email
    const { data: adminProfile } = await supabaseAdmin.from("profiles").select("full_name").eq("id", adminId).single()

    const baseUrl = getBaseUrl()
    await sendInvitationEmail(
      profile.email,
      profile.full_name,
      newInvitationToken,
      profile.branches?.name || "Unknown Branch",
      adminProfile?.full_name || "Admin",
      baseUrl,
    )

    // Log the action
    await logUserAction(adminId, "RESEND_INVITATION", userId, profile.email, {
      newToken: newInvitationToken,
    })

    return {
      success: true,
      invitationToken: newInvitationToken,
    }
  } catch (error) {
    console.error("Resend invitation error:", error)
    return { error: "Failed to resend invitation" }
  }
}

// Update user status (approve/reject)
export async function updateUserStatus(adminId: string, userId: string, status: "active" | "inactive" | "pending") {
  try {
    // Verify admin role
    const adminCheck = await checkAdminRole(adminId)
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
    }

    // Update user status
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Log the action
    await logUserAction(adminId, "UPDATE_USER_STATUS", userId, data.email, { newStatus: status })

    return { success: true, user: data }
  } catch (error) {
    console.error("Update user status error:", error)
    return { error: "Failed to update user status" }
  }
}

// Delete user
export async function deleteUser(adminId: string, userId: string) {
  try {
    // Verify admin role
    const adminCheck = await checkAdminRole(adminId)
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
    }

    // Get user email for logging
    const { data: profile } = await supabaseAdmin.from("profiles").select("email").eq("id", userId).single()

    // Delete from profiles table
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", userId)

    if (profileError) {
      return { error: profileError.message }
    }

    // Delete from auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error("Auth deletion error:", authError)
      // Don't return error as profile is already deleted
    }

    // Log the action
    await logUserAction(adminId, "DELETE_USER", userId, profile?.email || "Unknown", {
      deleted_at: new Date().toISOString(),
    })

    return { success: true }
  } catch (error) {
    console.error("Delete user error:", error)
    return { error: "Failed to delete user" }
  }
}

// Log user management actions
async function logUserAction(
  adminId: string,
  action: string,
  targetUserId?: string,
  targetEmail?: string,
  details?: any,
) {
  try {
    await supabaseAdmin.from("user_management").insert({
      admin_id: adminId,
      action,
      target_user_id: targetUserId,
      target_user_email: targetEmail,
      details,
    })
  } catch (error) {
    console.error("Log user action error:", error)
  }
}

"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { revalidatePath } from "next/cache"

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: "admin" | "branch_manager" | "program_officer" | "assistance_program_officer" | "branch_report_officer"
  branch_id: string | null
  status: "active" | "inactive" | "pending"
  created_at: string
  updated_at: string
  phone?: string | null
  branches?: {
    id: string
    name: string
  } | null
  branch_name?: string
}

export interface CreateUserData {
  email: string
  full_name: string
  role: UserProfile["role"]
  branch_id?: string
  phone?: string
  password: string
}

export interface UpdateUserData {
  full_name?: string
  email?: string
  role?: UserProfile["role"]
  branch_id?: string | null
  status?: UserProfile["status"]
  phone?: string | null
}

export async function getAllUsers() {
  try {
    console.log("Fetching all users...")

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        role,
        branch_id,
        status,
        created_at,
        updated_at,
        phone,
        branches (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return { success: false, error: "Failed to fetch users" }
    }

    // Transform data to include branch_name for easier display
    const transformedData =
      data?.map((user) => ({
        ...user,
        branch_name: user.branches?.name || null,
      })) || []

    console.log("Successfully fetched users:", transformedData.length)
    return { success: true, data: transformedData }
  } catch (error) {
    console.error("Unexpected error in getAllUsers:", error)
    return { success: false, error: "An unexpected error occurred while fetching users" }
  }
}

export async function createUser(userData: CreateUserData) {
  try {
    console.log("Creating user with data:", { ...userData, password: "[REDACTED]" })

    // First, create the auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
    })

    if (authError) {
      console.error("Error creating auth user:", authError)
      return { success: false, error: `Failed to create user account: ${authError.message}` }
    }

    if (!authUser.user) {
      return { success: false, error: "Failed to create user account" }
    }

    console.log("Auth user created:", authUser.user.id)

    // Then create the profile
    const profileData = {
      id: authUser.user.id,
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role,
      branch_id: userData.branch_id || null,
      phone: userData.phone || null,
      status: "active" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert(profileData)
      .select(`
        *,
        branches (
          id,
          name
        )
      `)
      .single()

    if (profileError) {
      console.error("Error creating profile:", profileError)

      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)

      return { success: false, error: `Failed to create user profile: ${profileError.message}` }
    }

    console.log("User created successfully:", profile)

    // Revalidate the users page
    revalidatePath("/admin/users")

    return {
      success: true,
      data: {
        ...profile,
        branch_name: profile.branches?.name || null,
      },
    }
  } catch (error) {
    console.error("Unexpected error in createUser:", error)
    return { success: false, error: "An unexpected error occurred while creating the user" }
  }
}

export async function updateUser(userId: string, userData: UpdateUserData) {
  try {
    console.log("Updating user:", userId, "with data:", userData)

    // Prepare update data
    const updateData = {
      ...userData,
      updated_at: new Date().toISOString(),
    }

    // Update the profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select(`
        *,
        branches (
          id,
          name
        )
      `)
      .single()

    if (profileError) {
      console.error("Error updating profile:", profileError)
      return { success: false, error: `Failed to update user: ${profileError.message}` }
    }

    // If email is being updated, also update the auth user
    if (userData.email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: userData.email,
      })

      if (authError) {
        console.error("Error updating auth user email:", authError)
        // Don't fail the whole operation, just log the error
      }
    }

    console.log("User updated successfully:", profile)

    // Revalidate the users page
    revalidatePath("/admin/users")

    return {
      success: true,
      data: {
        ...profile,
        branch_name: profile.branches?.name || null,
      },
    }
  } catch (error) {
    console.error("Unexpected error in updateUser:", error)
    return { success: false, error: "An unexpected error occurred while updating the user" }
  }
}

export async function deleteUser(userId: string) {
  try {
    console.log("Deleting user:", userId)

    // First delete the profile
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", userId)

    if (profileError) {
      console.error("Error deleting profile:", profileError)
      return { success: false, error: `Failed to delete user profile: ${profileError.message}` }
    }

    // Then delete the auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      // Check if the error is "user not found" - this is acceptable since profile is already deleted
      if (authError.message.includes("user_not_found") || authError.message.includes("User not found")) {
        console.log("Auth user not found (already deleted or never created), but profile was successfully deleted")
        revalidatePath("/admin/users")
        return { success: true, message: "User profile deleted successfully" }
      }
      
      console.error("Error deleting auth user:", authError)
      // For other errors, still try to revalidate since profile is deleted
      revalidatePath("/admin/users")
      return { success: true, message: "User profile deleted successfully (auth user deletion encountered an issue)" }
    }

    console.log("User deleted successfully")

    // Revalidate the users page
    revalidatePath("/admin/users")

    return { success: true }
  } catch (error) {
    console.error("Unexpected error in deleteUser:", error)
    return { success: false, error: "An unexpected error occurred while deleting the user" }
  }
}

export async function changeUserPassword(userId: string, newPassword: string) {
  try {
    console.log("Changing password for user:", userId)

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (error) {
      console.error("Error changing password:", error)
      return { success: false, error: `Failed to change password: ${error.message}` }
    }

    console.log("Password changed successfully")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error in changeUserPassword:", error)
    return { success: false, error: "An unexpected error occurred while changing the password" }
  }
}

export async function searchUsers(searchTerm: string) {
  try {
    console.log("Searching users with term:", searchTerm)

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        role,
        branch_id,
        status,
        created_at,
        updated_at,
        phone,
        branches (
          id,
          name
        )
      `)
      .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error searching users:", error)
      return { success: false, error: "Failed to search users" }
    }

    // Transform data to include branch_name for easier display
    const transformedData =
      data?.map((user) => ({
        ...user,
        branch_name: user.branches?.name || null,
      })) || []

    console.log("Search results:", transformedData.length)
    return { success: true, data: transformedData }
  } catch (error) {
    console.error("Unexpected error in searchUsers:", error)
    return { success: false, error: "An unexpected error occurred while searching users" }
  }
}

export async function getUserById(userId: string) {
  try {
    console.log("Fetching user by ID:", userId)

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        role,
        branch_id,
        status,
        created_at,
        updated_at,
        phone,
        branches (
          id,
          name
        )
      `)
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error fetching user:", error)
      return { success: false, error: "Failed to fetch user" }
    }

    const transformedData = {
      ...data,
      branch_name: data.branches?.name || null,
    }

    console.log("User fetched successfully")
    return { success: true, data: transformedData }
  } catch (error) {
    console.error("Unexpected error in getUserById:", error)
    return { success: false, error: "An unexpected error occurred while fetching the user" }
  }
}

export async function resetAllBranchReportOfficerPasswords() {
  try {
    console.log("[v0] Starting batch password reset for all branch report officers")

    // Get all branch report officer profiles
    const { data: officers, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("role", "branch_report_officer")
      .eq("status", "active")

    if (fetchError) {
      console.error("[v0] Error fetching branch officers:", fetchError)
      return { success: false, error: "Failed to fetch branch report officers" }
    }

    if (!officers || officers.length === 0) {
      return { success: true, data: [], message: "No active branch report officers found" }
    }

    console.log(`[v0] Found ${officers.length} branch report officers to reset`)

    const results: Array<{ email: string; success: boolean; message: string }> = []
    const tempPassword = `BranchReportOfficer@2024!` // Standard temporary password

    // Reset password for each branch report officer
    for (const officer of officers) {
      try {
        console.log(`[v0] Resetting password for ${officer.email}`)

        const { error } = await supabaseAdmin.auth.admin.updateUserById(officer.id, {
          password: tempPassword,
        })

        if (error) {
          console.error(`[v0] Error resetting password for ${officer.email}:`, error)
          results.push({
            email: officer.email || "unknown",
            success: false,
            message: `Failed: ${error.message}`,
          })
        } else {
          console.log(`[v0] Password reset successful for ${officer.email}`)
          results.push({
            email: officer.email || "unknown",
            success: true,
            message: "Password reset successfully",
          })
        }
      } catch (error) {
        console.error(`[v0] Unexpected error resetting password for ${officer.email}:`, error)
        results.push({
          email: officer.email || "unknown",
          success: false,
          message: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
        })
      }
    }

    // Count successes and failures
    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    console.log(`[v0] Password reset batch complete: ${successCount} successful, ${failureCount} failed`)

    return {
      success: successCount > 0,
      data: results,
      message: `Reset ${successCount} out of ${officers.length} passwords. Temporary password: ${tempPassword}`,
    }
  } catch (error) {
    console.error("[v0] Unexpected error in resetAllBranchReportOfficerPasswords:", error)
    return {
      success: false,
      error: "Unexpected error occurred while resetting passwords",
    }
  }
}

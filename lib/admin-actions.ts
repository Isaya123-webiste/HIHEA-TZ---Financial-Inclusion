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

// Check if user is admin
export async function checkAdminRole(userId: string) {
  try {
    const { data: profile, error } = await supabaseAdmin.from("profiles").select("role").eq("id", userId).single()

    if (error) {
      return { error: error.message }
    }

    return { isAdmin: profile?.role === "admin" }
  } catch (error) {
    console.error("Check admin role error:", error)
    return { error: "Failed to check admin role" }
  }
}

// Get all users (admin only)
export async function getAllUsers() {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return { error: error.message }
    }

    return { users: profiles }
  } catch (error) {
    console.error("Get all users error:", error)
    return { error: "Failed to get users" }
  }
}

// Update user profile (admin only)
export async function updateUserProfile(adminId: string, targetUserId: string, updates: any) {
  try {
    // Verify admin role
    const adminCheck = await checkAdminRole(adminId)
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetUserId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Log the action
    await logAdminAction(adminId, "UPDATE_USER", targetUserId, updates.email, updates)

    return { profile: data, success: true }
  } catch (error) {
    console.error("Update user profile error:", error)
    return { error: "Failed to update user profile" }
  }
}

// Delete user (admin only)
export async function deleteUser(adminId: string, targetUserId: string, targetEmail: string) {
  try {
    // Verify admin role
    const adminCheck = await checkAdminRole(adminId)
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
    }

    // Delete from profiles table
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", targetUserId)

    if (profileError) {
      return { error: profileError.message }
    }

    // Delete from auth.users using admin client
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    if (authError) {
      console.error("Auth deletion error:", authError)
      // Don't return error as profile is already deleted
    }

    // Log the action
    await logAdminAction(adminId, "DELETE_USER", targetUserId, targetEmail, { deleted_at: new Date().toISOString() })

    return { success: true }
  } catch (error) {
    console.error("Delete user error:", error)
    return { error: "Failed to delete user" }
  }
}

// Create new user (admin only)
export async function createUser(
  adminId: string,
  userData: { email: string; password: string; full_name: string; role?: string },
) {
  try {
    // Verify admin role
    const adminCheck = await checkAdminRole(adminId)
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
    }

    // Create user in auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
      },
    })

    if (authError) {
      return { error: authError.message }
    }

    // Create profile
    if (authData.user) {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: authData.user.id,
          full_name: userData.full_name,
          email: userData.email,
          role: userData.role || "user",
        })
        .select()
        .single()

      if (profileError) {
        return { error: profileError.message }
      }

      // Log the action
      await logAdminAction(adminId, "CREATE_USER", authData.user.id, userData.email, userData)

      return { user: profileData, success: true }
    }

    return { error: "Failed to create user" }
  } catch (error) {
    console.error("Create user error:", error)
    return { error: "Failed to create user" }
  }
}

// Log admin actions
async function logAdminAction(
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
    console.error("Log admin action error:", error)
  }
}

// Get admin activity logs
export async function getAdminLogs(adminId: string) {
  try {
    // Verify admin role
    const adminCheck = await checkAdminRole(adminId)
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
    }

    const { data: logs, error } = await supabaseAdmin
      .from("user_management")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      return { error: error.message }
    }

    return { logs }
  } catch (error) {
    console.error("Get admin logs error:", error)
    return { error: "Failed to get admin logs" }
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

export async function getAllBranches() {
  try {
    const { data: branches, error } = await supabaseAdmin
      .from("branches")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return { error: error.message }
    }

    return { branches }
  } catch (error) {
    console.error("Get all branches error:", error)
    return { error: "Failed to get branches" }
  }
}

export async function deleteBranch(adminId: string, branchId: string) {
  try {
    // Verify admin role
    const adminCheck = await checkAdminRole(adminId)
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
    }

    // Delete branch
    const { error: branchError } = await supabaseAdmin.from("branches").delete().eq("id", branchId)

    if (branchError) {
      return { error: branchError.message }
    }

    // Log the action
    await logAdminAction(adminId, "DELETE_BRANCH", branchId, undefined, { deleted_at: new Date().toISOString() })

    return { success: true }
  } catch (error) {
    console.error("Delete branch error:", error)
    return { error: "Failed to delete branch" }
  }
}

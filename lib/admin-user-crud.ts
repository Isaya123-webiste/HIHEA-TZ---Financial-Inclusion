"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { checkAdminRole } from "./admin-actions"
import { revalidatePath } from "next/cache"

// CREATE - Add new user
export async function createUser(
  adminId: string,
  userData: {
    full_name: string
    email: string
    role: string
    branch_id?: string
    phone?: string
    password: string
  },
) {
  try {
    // Verify admin permissions
    const adminCheck = await checkAdminRole(adminId)
    if (adminCheck.error || !adminCheck.isAdmin) {
      return { error: "Access denied. Admin privileges required." }
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("email", userData.email)
      .single()

    if (existingUser) {
      return { error: `User with email ${userData.email} already exists` }
    }

    // Create user in auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role,
      },
    })

    if (authError) {
      return { error: authError.message }
    }

    // Create profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authUser.user.id,
        full_name: userData.full_name,
        email: userData.email,
        role: userData.role,
        branch_id: userData.branch_id || null,
        phone: userData.phone || null,
        status: "active",
        temp_password: userData.password,
      })
      .select()
      .single()

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return { error: profileError.message }
    }

    revalidatePath("/admin/users")
    return { success: true, user: profile }
  } catch (error) {
    console.error("Create user error:", error)
    return { error: "Failed to create user" }
  }
}

// READ - Get all users with filtering and pagination
export async function getUsers(
  adminId: string,
  filters?: {
    role?: string
    branch_id?: string
    status?: string
    search?: string
    page?: number
    limit?: number
  },
) {
  try {
    // Verify admin permissions
    const adminCheck = await checkAdminRole(adminId)
    if (adminCheck.error || !adminCheck.isAdmin) {
      return { error: "Access denied. Admin privileges required." }
    }

    let query = supabaseAdmin.from("profiles").select(`
        id,
        full_name,
        email,
        role,
        branch_id,
        phone,
        status,
        temp_password,
        created_at,
        updated_at,
        branches!profiles_branch_id_fkey (
          id,
          name
        )
      `)

    // Apply filters
    if (filters?.role && filters.role !== "all") {
      query = query.eq("role", filters.role)
    }

    if (filters?.branch_id && filters.branch_id !== "all") {
      query = query.eq("branch_id", filters.branch_id)
    }

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    if (filters?.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    // Pagination
    const page = filters?.page || 1
    const limit = filters?.limit || 50
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order("created_at", { ascending: false })

    const { data: users, error, count } = await query

    if (error) {
      return { error: error.message }
    }

    // Transform data
    const transformedUsers =
      users?.map((user) => ({
        ...user,
        branch_name: user.branches?.name || "No Branch",
        password: user.temp_password || "Not Available",
      })) || []

    return {
      success: true,
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }
  } catch (error) {
    console.error("Get users error:", error)
    return { error: "Failed to fetch users" }
  }
}

// READ - Get single user by ID
export async function getUserById(adminId: string, userId: string) {
  try {
    // Verify admin permissions
    const adminCheck = await checkAdminRole(adminId)
    if (adminCheck.error || !adminCheck.isAdmin) {
      return { error: "Access denied. Admin privileges required." }
    }

    const { data: user, error } = await supabaseAdmin
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

    return { success: true, user }
  } catch (error) {
    console.error("Get user by ID error:", error)
    return { error: "Failed to fetch user" }
  }
}

// UPDATE - Update user information
export async function updateUser(
  adminId: string,
  userId: string,
  updates: {
    full_name?: string
    email?: string
    role?: string
    branch_id?: string
    phone?: string
    status?: string
  },
) {
  try {
    // Verify admin permissions
    const adminCheck = await checkAdminRole(adminId)
    if (adminCheck.error || !adminCheck.isAdmin) {
      return { error: "Access denied. Admin privileges required." }
    }

    // Check if email is being updated and if it already exists
    if (updates.email) {
      const { data: existingUser } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", updates.email)
        .neq("id", userId)
        .single()

      if (existingUser) {
        return { error: `Email ${updates.email} is already in use` }
      }
    }

    // Update profile
    const { data: updatedUser, error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (profileError) {
      return { error: profileError.message }
    }

    // Update auth user if email is being changed
    if (updates.email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: updates.email,
      })

      if (authError) {
        console.warn("Auth email update failed:", authError.message)
        // Don't fail the entire operation if auth update fails
      }
    }

    revalidatePath("/admin/users")
    return { success: true, user: updatedUser }
  } catch (error) {
    console.error("Update user error:", error)
    return { error: "Failed to update user" }
  }
}

// UPDATE - Update user password
export async function updateUserPassword(adminId: string, userId: string, newPassword: string) {
  try {
    // Verify admin permissions
    const adminCheck = await checkAdminRole(adminId)
    if (adminCheck.error || !adminCheck.isAdmin) {
      return { error: "Access denied. Admin privileges required." }
    }

    // Update password in auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (authError) {
      return { error: authError.message }
    }

    // Update temp_password in profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        temp_password: newPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (profileError) {
      return { error: profileError.message }
    }

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Update password error:", error)
    return { error: "Failed to update password" }
  }
}

// UPDATE - Update user status (activate/deactivate)
export async function updateUserStatus(adminId: string, userId: string, status: "active" | "inactive") {
  try {
    // Verify admin permissions
    const adminCheck = await checkAdminRole(adminId)
    if (adminCheck.error || !adminCheck.isAdmin) {
      return { error: "Access denied. Admin privileges required." }
    }

    const { data: updatedUser, error } = await supabaseAdmin
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

    revalidatePath("/admin/users")
    return { success: true, user: updatedUser }
  } catch (error) {
    console.error("Update user status error:", error)
    return { error: "Failed to update user status" }
  }
}

// DELETE - Delete user
export async function deleteUser(adminId: string, userId: string) {
  try {
    // Verify admin permissions
    const adminCheck = await checkAdminRole(adminId)
    if (adminCheck.error || !adminCheck.isAdmin) {
      return { error: "Access denied. Admin privileges required." }
    }

    // Get user info before deletion
    const { data: user } = await supabaseAdmin.from("profiles").select("full_name, email").eq("id", userId).single()

    if (!user) {
      return { error: "User not found" }
    }

    // Delete profile first
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", userId)

    if (profileError) {
      return { error: profileError.message }
    }

    // Try to delete from auth (don't fail if user doesn't exist in auth)
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId)
    } catch (authError) {
      console.warn("Auth user deletion failed:", authError)
      // Don't fail the operation
    }

    revalidatePath("/admin/users")
    return { success: true, message: `User "${user.full_name}" deleted successfully` }
  } catch (error) {
    console.error("Delete user error:", error)
    return { error: "Failed to delete user" }
  }
}

// BULK OPERATIONS
export async function bulkDeleteUsers(adminId: string, userIds: string[]) {
  try {
    // Verify admin permissions
    const adminCheck = await checkAdminRole(adminId)
    if (adminCheck.error || !adminCheck.isAdmin) {
      return { error: "Access denied. Admin privileges required." }
    }

    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
    }

    for (const userId of userIds) {
      const result = await deleteUser(adminId, userId)
      if (result.success) {
        results.successful.push(userId)
      } else {
        results.failed.push({ id: userId, error: result.error || "Unknown error" })
      }
    }

    revalidatePath("/admin/users")
    return { success: true, results }
  } catch (error) {
    console.error("Bulk delete error:", error)
    return { error: "Failed to delete users" }
  }
}

export async function bulkUpdateUserStatus(adminId: string, userIds: string[], status: "active" | "inactive") {
  try {
    // Verify admin permissions
    const adminCheck = await checkAdminRole(adminId)
    if (adminCheck.error || !adminCheck.isAdmin) {
      return { error: "Access denied. Admin privileges required." }
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .in("id", userIds)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/admin/users")
    return { success: true, message: `${userIds.length} users updated successfully` }
  } catch (error) {
    console.error("Bulk update status error:", error)
    return { error: "Failed to update user statuses" }
  }
}

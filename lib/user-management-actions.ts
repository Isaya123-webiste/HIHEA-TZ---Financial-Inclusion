"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { checkAdminRole } from "./admin-actions"

// Helper function to generate secure password
function generateSecurePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Get all users with passwords (corrected function name)
export async function getAllUsersWithPasswords(adminId: string) {
  try {
    // Verify admin role
    const adminCheck = await checkAdminRole(adminId)
    if (adminCheck.error || !adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
    }

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select(`
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
      .neq("role", "admin")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Get users error:", error)
      return { error: "Failed to fetch users" }
    }

    // Transform the data to include branch_name and password
    const users =
      profiles?.map((profile) => ({
        ...profile,
        branch_name: profile.branches?.name || "No Branch",
        password: profile.temp_password || "Not Available",
      })) || []

    return { users }
  } catch (error) {
    console.error("Get all users with passwords error:", error)
    return { error: "Failed to fetch users" }
  }
}

// Create user with direct password (no email invitation)
export async function createUserWithPassword(
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
    // Verify admin permissions
    const adminCheck = await checkAdminRole(adminId)
    if (adminCheck.error || !adminCheck.isAdmin) {
      return { error: "Access denied. Admin privileges required." }
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, branch_id, branches(name)")
      .eq("email", userData.email)
      .single()

    if (existingUser) {
      const branchName = existingUser.branches?.name || "Unknown Branch"
      return { error: `User with email ${userData.email} already exists in ${branchName}` }
    }

    // Create user in auth with password
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm for direct activation
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role,
        branch_id: userData.branch_id,
      },
    })

    if (authError) {
      console.error("Auth user creation error:", authError)
      return { error: "Failed to create user account" }
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: authUser.user.id,
      full_name: userData.full_name,
      email: userData.email,
      role: userData.role,
      branch_id: userData.branch_id,
      phone: userData.phone || null,
      status: "active", // Directly activated
      temp_password: userData.password, // Store password for admin reference
      invitation_sent: false,
      invitation_status: "completed",
    })

    if (profileError) {
      console.error("Profile creation error:", profileError)
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return { error: "Failed to create user profile" }
    }

    return {
      success: true,
      userId: authUser.user.id,
      message: "User created and activated successfully",
    }
  } catch (error) {
    console.error("Create user with password error:", error)
    return { error: "Failed to create user" }
  }
}

// Bulk import users with passwords
export async function bulkImportUsersWithPasswordSupport(adminId: string, csvContent: string, branchId: string) {
  try {
    // Verify admin permissions
    const adminCheck = await checkAdminRole(adminId)
    if (adminCheck.error || !adminCheck.isAdmin) {
      return { error: "Access denied. Admin privileges required." }
    }

    // Get branch information
    const { data: branch, error: branchError } = await supabaseAdmin
      .from("branches")
      .select("name")
      .eq("id", branchId)
      .single()

    if (branchError || !branch) {
      return { error: "Branch not found" }
    }

    // Parse CSV
    const lines = csvContent.split("\n").filter((line) => line.trim())
    if (lines.length === 0) {
      return { error: "CSV file is empty" }
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())

    // Validate headers
    const requiredHeaders = ["full_name", "email", "role"]
    const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header))
    if (missingHeaders.length > 0) {
      return { error: `Missing required headers: ${missingHeaders.join(", ")}` }
    }

    // Check if password column exists
    const hasPasswordColumn = headers.includes("password")

    // Parse users
    const users = lines
      .slice(1)
      .map((line) => {
        const values = line.split(",").map((v) => v.trim())
        const user: any = {}
        headers.forEach((header, index) => {
          user[header] = values[index] || ""
        })
        return user
      })
      .filter((user) => user.email && user.full_name && user.role) // Filter out empty rows

    // Process results
    const results = {
      successful: [] as any[],
      failed: [] as any[],
      duplicates: [] as any[],
      crossBranchConflicts: [] as any[],
      passwordsGenerated: [] as any[],
    }

    // Check for existing users
    const emails = users.map((u) => u.email)
    const { data: existingUsers } = await supabaseAdmin
      .from("profiles")
      .select("email, branch_id, branches(name)")
      .in("email", emails)

    const existingEmailMap = new Map()
    existingUsers?.forEach((user) => {
      existingEmailMap.set(user.email, {
        branch_id: user.branch_id,
        branch_name: user.branches?.name,
      })
    })

    // Process each user
    for (const user of users) {
      try {
        // Check for duplicates
        if (existingEmailMap.has(user.email)) {
          const existing = existingEmailMap.get(user.email)
          if (existing.branch_id === branchId) {
            results.duplicates.push({
              email: user.email,
              full_name: user.full_name,
              existing_branch: existing.branch_name,
            })
          } else {
            results.crossBranchConflicts.push({
              email: user.email,
              full_name: user.full_name,
              existing_branch: existing.branch_name,
            })
          }
          continue
        }

        // Generate password if not provided
        if (!user.password) {
          user.password = generateSecurePassword()
          results.passwordsGenerated.push({
            email: user.email,
            full_name: user.full_name,
            password: user.password,
          })
        }

        // Create user with password
        const createResult = await createUserWithPassword(adminId, {
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          branch_id: branchId,
          phone: user.phone || "",
          password: user.password,
        })

        if (createResult.success) {
          results.successful.push({
            email: user.email,
            full_name: user.full_name,
            password: user.password,
          })
        } else {
          results.failed.push({
            email: user.email,
            full_name: user.full_name,
            error: createResult.error,
          })
        }
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error)
        results.failed.push({
          email: user.email,
          full_name: user.full_name,
          error: "Unexpected error",
        })
      }
    }

    return {
      success: true,
      results,
      hasPasswordColumn,
    }
  } catch (error) {
    console.error("Bulk import error:", error)
    return { error: "Failed to import users", details: error }
  }
}

// Update user password
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

    return { success: true }
  } catch (error) {
    console.error("Update password error:", error)
    return { error: "Failed to update password" }
  }
}

// Export users with passwords
export async function exportUsersByBranchAndRole(
  adminId: string,
  filters: {
    selectedBranches?: string[]
    selectedRoles?: string[]
    includeAllBranches?: boolean
    includeAllRoles?: boolean
  },
) {
  try {
    // Verify admin permissions
    const adminCheck = await checkAdminRole(adminId)
    if (adminCheck.error || !adminCheck.isAdmin) {
      return { error: "Access denied. Admin privileges required." }
    }

    let query = supabaseAdmin
      .from("profiles")
      .select(`
        full_name,
        email,
        role,
        phone,
        temp_password,
        branches!profiles_branch_id_fkey (
          name
        )
      `)
      .neq("role", "admin")

    // Apply branch filter
    if (!filters.includeAllBranches && filters.selectedBranches && filters.selectedBranches.length > 0) {
      query = query.in("branch_id", filters.selectedBranches)
    }

    // Apply role filter
    if (!filters.includeAllRoles && filters.selectedRoles && filters.selectedRoles.length > 0) {
      query = query.in("role", filters.selectedRoles)
    }

    const { data: profiles, error } = await query.order("full_name", { ascending: true })

    if (error) {
      return { error: error.message }
    }

    // Transform data for CSV export
    const exportData = profiles?.map((profile) => ({
      full_name: profile.full_name,
      email: profile.email,
      role: profile.role,
      branch_name: profile.branches?.name || "No Branch",
      phone: profile.phone || "",
      password: profile.temp_password || "Not Available",
    }))

    // Generate CSV content
    const headers = ["Full Name", "Email", "Role", "Branch", "Phone", "Password"]
    const csvRows = [
      headers.join(","),
      ...exportData.map((user) =>
        [
          `"${user.full_name}"`,
          `"${user.email}"`,
          `"${user.role}"`,
          `"${user.branch_name}"`,
          `"${user.phone}"`,
          `"${user.password}"`,
        ].join(","),
      ),
    ]

    const csvContent = csvRows.join("\n")
    const timestamp = new Date().toISOString().split("T")[0]
    const filename = `users-export-${timestamp}.csv`

    return {
      success: true,
      csvContent,
      filename,
      exportedCount: exportData.length,
    }
  } catch (error) {
    console.error("Export users error:", error)
    return { error: "Failed to export users" }
  }
}

// Delete user - FIXED VERSION
export async function deleteUser(adminId: string, userId: string) {
  try {
    // Verify admin permissions
    const adminCheck = await checkAdminRole(adminId)
    if (adminCheck.error || !adminCheck.isAdmin) {
      return { error: "Access denied. Admin privileges required." }
    }

    console.log(`Attempting to delete user with ID: ${userId}`)

    // First, check if the user exists in profiles
    const { data: profile, error: profileCheckError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", userId)
      .single()

    if (profileCheckError || !profile) {
      console.error("Profile not found:", profileCheckError)
      return { error: "User profile not found" }
    }

    console.log(`Found profile for user: ${profile.email}`)

    // Delete the profile first (this will work even if auth user doesn't exist)
    const { error: profileDeleteError } = await supabaseAdmin.from("profiles").delete().eq("id", userId)

    if (profileDeleteError) {
      console.error("Profile deletion error:", profileDeleteError)
      return { error: "Failed to delete user profile" }
    }

    console.log("Profile deleted successfully")

    // Try to delete from auth, but don't fail if user doesn't exist in auth
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if (authError) {
        console.warn("Auth user deletion warning:", authError.message)
        // Don't return error here - profile is already deleted
        // This handles cases where user exists in profiles but not in auth
      } else {
        console.log("Auth user deleted successfully")
      }
    } catch (authDeleteError) {
      console.warn("Auth user deletion failed (user may not exist in auth):", authDeleteError)
      // Don't return error - profile deletion was successful
    }

    return {
      success: true,
      message: `User "${profile.full_name}" deleted successfully`,
    }
  } catch (error) {
    console.error("Delete user error:", error)
    return { error: "Failed to delete user" }
  }
}

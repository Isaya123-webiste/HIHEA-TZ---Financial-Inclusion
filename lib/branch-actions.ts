"use server"

import { createClient } from "@supabase/supabase-js"
import { checkAdminRole } from "./admin-actions"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Normalize branch name for duplicate detection
function normalizeBranchName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/[^\w\s]/g, "") // Remove special characters
}

// Check for duplicate branch names
async function checkDuplicateBranch(
  branchName: string,
  excludeId?: string,
): Promise<{ isDuplicate: boolean; existingBranch?: any }> {
  try {
    const normalizedName = normalizeBranchName(branchName)

    // Get all branches to check for duplicates
    const { data: branches, error } = await supabaseAdmin.from("branches").select("id, name")

    if (error) {
      console.error("Error checking duplicates:", error)
      return { isDuplicate: false }
    }

    // Check if any existing branch has a similar normalized name
    const duplicate = branches?.find((branch) => {
      if (excludeId && branch.id === excludeId) {
        return false // Exclude the current branch when editing
      }
      return normalizeBranchName(branch.name) === normalizedName
    })

    return {
      isDuplicate: !!duplicate,
      existingBranch: duplicate,
    }
  } catch (error) {
    console.error("Duplicate check error:", error)
    return { isDuplicate: false }
  }
}

// Create a new branch with minimal data
export async function createBranch(adminId: string, branchName: string) {
  try {
    // Verify admin role
    const adminCheck = await checkAdminRole(adminId)
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
    }

    // Check for duplicates
    const duplicateCheck = await checkDuplicateBranch(branchName)
    if (duplicateCheck.isDuplicate) {
      return {
        error: `A branch with a similar name "${duplicateCheck.existingBranch?.name}" already exists. Please choose a different name.`,
      }
    }

    // Create branch with only the name and minimal required fields
    const { data, error } = await supabaseAdmin
      .from("branches")
      .insert({
        name: branchName,
        address: "", // Empty instead of default
        city: "", // Empty instead of default
        state: "", // Empty instead of default
        postal_code: "", // Empty instead of default
        phone: "", // Empty instead of default
        email: "", // Empty instead of default
        manager_name: "", // Empty instead of default
        status: "active", // Set to active instead of pending
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Log the action
    await logBranchAction(adminId, "CREATE_BRANCH", data.id, branchName)

    return { branch: data, success: true }
  } catch (error) {
    console.error("Create branch error:", error)
    return { error: "Failed to create branch" }
  }
}

// Update branch name with duplicate detection
export async function updateBranch(adminId: string, branchId: string, branchName: string) {
  try {
    // Verify admin role
    const adminCheck = await checkAdminRole(adminId)
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
    }

    // Check for duplicates (excluding current branch)
    const duplicateCheck = await checkDuplicateBranch(branchName, branchId)
    if (duplicateCheck.isDuplicate) {
      return {
        error: `A branch with a similar name "${duplicateCheck.existingBranch?.name}" already exists. Please choose a different name.`,
      }
    }

    // Update branch name
    const { data, error } = await supabaseAdmin
      .from("branches")
      .update({
        name: branchName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", branchId)
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Log the action
    await logBranchAction(adminId, "UPDATE_BRANCH", branchId, branchName)

    return { branch: data, success: true }
  } catch (error) {
    console.error("Update branch error:", error)
    return { error: "Failed to update branch" }
  }
}

// Delete branch
export async function deleteBranch(adminId: string, branchId: string) {
  try {
    // Verify admin role
    const adminCheck = await checkAdminRole(adminId)
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
    }

    // Get branch name for logging
    const { data: branch } = await supabaseAdmin.from("branches").select("name").eq("id", branchId).single()

    // Delete branch
    const { error: branchError } = await supabaseAdmin.from("branches").delete().eq("id", branchId)

    if (branchError) {
      return { error: branchError.message }
    }

    // Log the action
    await logBranchAction(adminId, "DELETE_BRANCH", branchId, branch?.name || "Unknown")

    return { success: true }
  } catch (error) {
    console.error("Delete branch error:", error)
    return { error: "Failed to delete branch" }
  }
}

// Log branch actions
async function logBranchAction(adminId: string, action: string, branchId: string, branchName: string, details?: any) {
  try {
    await supabaseAdmin.from("user_management").insert({
      admin_id: adminId,
      action,
      target_user_id: branchId, // Using this field for branch ID
      target_user_email: branchName, // Using this field for branch name
      details,
    })
  } catch (error) {
    console.error("Log branch action error:", error)
  }
}

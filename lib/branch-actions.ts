"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { checkAdminRole } from "./admin-actions"

// Generate branch-specific CSV template with password column
export async function generateBranchCSVTemplate(adminId: string, branchId: string) {
  try {
    // Verify admin role
    const adminCheck = await checkAdminRole(adminId)
    if (adminCheck.error || !adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
    }

    // Get branch details
    const { data: branch, error: branchError } = await supabaseAdmin
      .from("branches")
      .select("name")
      .eq("id", branchId)
      .single()

    if (branchError || !branch) {
      return { error: "Branch not found" }
    }

    // Create simple CSV template with password column
    const csvContent = [
      "full_name,email,role,password,phone",
      "John Doe,john.doe@example.com,branch_manager,SecurePass123,+255123456789",
      "Jane Smith,jane.smith@example.com,program_officer,StrongPass456,+255987654321",
      "Bob Johnson,bob.johnson@example.com,branch_report_officer,,+255555555555",
    ].join("\n")

    const timestamp = new Date().toISOString().split("T")[0]
    const filename = `${branch.name.replace(/\s+/g, "_")}_users_template_${timestamp}.csv`

    return {
      success: true,
      csvContent,
      filename,
      branchName: branch.name,
    }
  } catch (error) {
    console.error("Generate branch CSV template error:", error)
    return { error: "Failed to generate CSV template" }
  }
}

// Create a new branch
export async function createBranch(adminId: string, branchName: string) {
  try {
    // Verify admin role
    const adminCheck = await checkAdminRole(adminId)
    if (adminCheck.error || !adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
    }

    // Create branch with minimal required fields
    const { data, error } = await supabaseAdmin
      .from("branches")
      .insert({
        name: branchName,
        address: "",
        city: "",
        state: "",
        postal_code: "",
        phone: "",
        email: "",
        manager_name: "",
        status: "active",
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    return { branch: data, success: true }
  } catch (error) {
    console.error("Create branch error:", error)
    return { error: "Failed to create branch" }
  }
}

// Update branch
export async function updateBranch(adminId: string, branchId: string, branchName: string) {
  try {
    // Verify admin role
    const adminCheck = await checkAdminRole(adminId)
    if (adminCheck.error || !adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
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
    if (adminCheck.error || !adminCheck.isAdmin) {
      return { error: "Unauthorized: Admin access required" }
    }

    // Delete branch
    const { error: branchError } = await supabaseAdmin.from("branches").delete().eq("id", branchId)

    if (branchError) {
      return { error: branchError.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Delete branch error:", error)
    return { error: "Failed to delete branch" }
  }
}

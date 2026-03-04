"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export interface Branch {
  id: string
  name: string
  location?: string
  manager_id?: string
  created_at: string
  updated_at: string
}

export interface BranchActionResult {
  success: boolean
  data?: any
  error?: string
}

function handleError(error: any, operation: string): BranchActionResult {
  console.error(`${operation} error:`, error)
  return {
    success: false,
    error: error?.message || `Failed to ${operation.toLowerCase()}`,
  }
}

export async function getAllBranches(): Promise<BranchActionResult> {
  try {
    console.log("Fetching all branches...")

    const { data, error } = await supabaseAdmin.from("branches").select("*").order("name", { ascending: true })

    if (error) {
      return handleError(error, "Get all branches")
    }

    console.log(`Successfully fetched ${data?.length || 0} branches`)
    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    return handleError(error, "Get all branches")
  }
}

export async function createBranch(
  userId: string,
  branchName: string,
): Promise<{
  success: boolean
  branch?: any
  error?: string
}> {
  try {
    console.log("[v0] Creating new branch:", branchName)

    const { data, error } = await supabaseAdmin
      .from("branches")
      .insert({
        name: branchName,
        status: "active",
        address: "",
        city: "",
        state: "",
        postal_code: "",
        phone: "",
        email: "",
        manager_name: "",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Create branch error:", error)
      return {
        success: false,
        error: error.message || "Failed to create branch",
      }
    }

    console.log("[v0] Branch created successfully:", data.id)
    return {
      success: true,
      branch: data,
    }
  } catch (error: any) {
    console.error("[v0] Create branch error:", error)
    return {
      success: false,
      error: error?.message || "Failed to create branch",
    }
  }
}

export async function updateBranch(
  userId: string,
  branchId: string,
  branchName: string,
): Promise<{
  success: boolean
  branch?: any
  error?: string
}> {
  try {
    console.log("[v0] Updating branch:", branchId)

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
      console.error("[v0] Update branch error:", error)
      return {
        success: false,
        error: error.message || "Failed to update branch",
      }
    }

    console.log("[v0] Branch updated successfully:", data.id)
    return {
      success: true,
      branch: data,
    }
  } catch (error: any) {
    console.error("[v0] Update branch error:", error)
    return {
      success: false,
      error: error?.message || "Failed to update branch",
    }
  }
}

export async function deleteBranch(
  userId: string,
  branchId: string,
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    console.log("[v0] Deleting branch:", branchId)

    // First, delete all profiles associated with this branch
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("branch_id", branchId)

    if (profileError) {
      console.error("[v0] Delete profiles error:", profileError)
      return {
        success: false,
        error: profileError.message || "Failed to delete branch profiles",
      }
    }

    // Then delete the branch itself
    const { error: branchError } = await supabaseAdmin.from("branches").delete().eq("id", branchId)

    if (branchError) {
      console.error("[v0] Delete branch error:", branchError)
      return {
        success: false,
        error: branchError.message || "Failed to delete branch",
      }
    }

    console.log("[v0] Branch deleted successfully:", branchId)
    return {
      success: true,
    }
  } catch (error: any) {
    console.error("[v0] Delete branch error:", error)
    return {
      success: false,
      error: error?.message || "Failed to delete branch",
    }
  }
}

export async function getBranchById(branchId: string): Promise<BranchActionResult> {
  try {
    console.log("Fetching branch by ID:", branchId)

    const { data, error } = await supabaseAdmin.from("branches").select("*").eq("id", branchId).single()

    if (error) {
      return handleError(error, "Get branch by ID")
    }

    console.log("Branch fetched successfully")
    return {
      success: true,
      data: data,
    }
  } catch (error) {
    return handleError(error, "Get branch by ID")
  }
}

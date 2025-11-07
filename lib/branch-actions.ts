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

export async function createBranch(branchData: {
  name: string
  location?: string
  manager_id?: string
}): Promise<BranchActionResult> {
  try {
    console.log("Creating new branch:", branchData.name)

    const { data, error } = await supabaseAdmin
      .from("branches")
      .insert({
        name: branchData.name,
        location: branchData.location,
        manager_id: branchData.manager_id,
      })
      .select()
      .single()

    if (error) {
      return handleError(error, "Create branch")
    }

    console.log("Branch created successfully:", data.id)
    return {
      success: true,
      data: data,
    }
  } catch (error) {
    return handleError(error, "Create branch")
  }
}

export async function updateBranch(
  branchId: string,
  branchData: {
    name?: string
    location?: string
    manager_id?: string
  },
): Promise<BranchActionResult> {
  try {
    console.log("Updating branch:", branchId)

    const { data, error } = await supabaseAdmin
      .from("branches")
      .update({
        ...branchData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", branchId)
      .select()
      .single()

    if (error) {
      return handleError(error, "Update branch")
    }

    console.log("Branch updated successfully:", data.id)
    return {
      success: true,
      data: data,
    }
  } catch (error) {
    return handleError(error, "Update branch")
  }
}

export async function deleteBranch(branchId: string): Promise<BranchActionResult> {
  try {
    console.log("Deleting branch:", branchId)

    const { error } = await supabaseAdmin.from("branches").delete().eq("id", branchId)

    if (error) {
      return handleError(error, "Delete branch")
    }

    console.log("Branch deleted successfully:", branchId)
    return {
      success: true,
      data: { message: "Branch deleted successfully" },
    }
  } catch (error) {
    return handleError(error, "Delete branch")
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

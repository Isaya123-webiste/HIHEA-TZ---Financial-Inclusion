"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { calculateAllAccessKRIValues, type AccessKRIValues, type BranchReportData } from "./access-kri-calculations"

export interface AccessData {
  projectId: string
  branchId?: string
  createdAt?: string
  accessActualData?: number
  accessValue?: number
  accessWeight?: number
  subFactorBankBranchesValue?: number
  subFactorBankBranchesWeight?: number
  subFactorAgentsValue?: number
  subFactorAgentsWeight?: number
  subFactorATMsOnlineServicesValue?: number
  subFactorATMsOnlineServicesWeight?: number
  subFactorInsurersAgentsValue?: number
  subFactorInsurersAgentsWeight?: number
}

/**
 * Upsert Access table with KRI calculations for a specific branch and project
 * Uses composite key of (project_id + branch_id) to identify/update rows
 */
export async function upsertAccessWithKRIs(
  branchReportData: BranchReportData & { id?: string; project_id?: string },
  projectId?: string,
  branchId?: string,
) {
  try {
    const actualProjectId = projectId || branchReportData.project_id
    const actualBranchId = branchId || branchReportData.branch_id

    if (!actualProjectId || !actualBranchId) {
      console.error("[v0] Missing projectId or branchId for Access KRI calculation")
      return { success: false, error: "projectId and branchId are required for Access KRI calculation" }
    }

    console.log("[v0] Calculating Access KRIs for project:", actualProjectId, "branch:", actualBranchId)

    // Calculate all Access KRI values
    const kriValues: AccessKRIValues = await calculateAllAccessKRIValues(branchReportData)

    console.log("[v0] Calculated Access KRI values:", kriValues)

    // Check if Access row exists for this (project_id + branch_id) combination
    const { data: existingAccess, error: fetchError } = await supabaseAdmin
      .from("Access")
      .select("id")
      .eq("Project ID", actualProjectId)
      .eq("Branch ID", actualBranchId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows found, which is expected for new combinations
      console.error("[v0] Error checking existing access:", fetchError)
      return { success: false, error: `Failed to check existing access: ${fetchError.message}` }
    }

    const updatePayload = {
      "Project ID": actualProjectId,
      "Branch ID": actualBranchId,
      created_at: branchReportData.created_at || new Date().toISOString(),
      "SUB-FACTOR: BANK BRANCHES_Value": kriValues.subFactorBankBranchesValue,
      "SUB-FACTOR: AGENTS_Value": kriValues.subFactorAgentsValue,
      "SUB-FACTOR: ATMs AND ONLINE SERVICES_Value": kriValues.subFactorATMsOnlineServicesValue,
      "SUB-FACTOR: INSURERS AND AGENTS_Value": kriValues.subFactorInsurersAgentsValue,
    }

    // If exists, UPDATE the row
    if (existingAccess) {
      console.log("[v0] Access data exists, updating KRI values:", existingAccess.id)

      const { data, error } = await supabaseAdmin
        .from("Access")
        .update(updatePayload)
        .eq("Project ID", actualProjectId)
        .eq("Branch ID", actualBranchId)
        .select()
        .single()

      if (error) {
        console.error("[v0] Error updating access data with KRIs:", error)
        return { success: false, error: `Failed to update access data: ${error.message}` }
      }

      console.log("[v0] Access data with KRIs updated successfully")
      return { success: true, data, action: "updated" }
    } else {
      // If doesn't exist, INSERT new row
      console.log("[v0] Access data does not exist, inserting new row with KRIs")

      const { data, error } = await supabaseAdmin.from("Access").insert(updatePayload).select().single()

      if (error) {
        console.error("[v0] Error inserting access data with KRIs:", error)
        return { success: false, error: `Failed to insert access data: ${error.message}` }
      }

      console.log("[v0] Access data with KRIs inserted successfully")
      return { success: true, data, action: "inserted" }
    }
  } catch (error: any) {
    console.error("[v0] Exception in upsertAccessWithKRIs:", error)
    return { success: false, error: error?.message || "Failed to upsert access data with KRIs" }
  }
}

"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { calculateAllBarriersKRIValues, type BarriersKRIValues, type BranchReportData } from "./barriers-kri-calculations"

export interface BarriersData {
  projectId: string
  branchId?: string
  createdAt?: string
  barriersActualData?: number
  barriersValue?: number
  barriersWeight?: number
  kriFraudIncidentRateValue?: number
  kriFraudIncidentRateWeight?: number
  kriTrustErosionValue?: number
  kriTrustErosionWeight?: number
  kriMembersLoanCostValue?: number
  kriMembersLoanCostWeight?: number
  kriHandInHandLoanCostValue?: number
  kriHandInHandLoanCostWeight?: number
  kriMFILoanServiceCostValue?: number
  kriMFILoanServiceCostWeight?: number
  kriDocumentationDelayRateValue?: number
  kriDocumentationDelayRateWeight?: number
  kriGenderBasedBarrierRateValue?: number
  kriGenderBasedBarrierRateWeight?: number
  kriFamilyAndCommunityBarrierRateValue?: number
  kriFamilyAndCommunityBarrierRateWeight?: number
  kriTraineeDropoutRateValue?: number
  kriTraineeDropoutRateWeight?: number
  kriTrainerDropoutRateValue?: number
  kriTrainerDropoutRateWeight?: number
  kriCurriculumRelevanceComplaintRateValue?: number
  kriCurriculumRelevanceComplaintRateWeight?: number
  kriLowKnowledgeRetentionRateValue?: number
  kriLowKnowledgeRetentionRateWeight?: number
}

/**
 * Upsert Barriers table with KRI calculations for a specific branch and project
 * Uses composite key of (project_id + branch_id) to identify/update rows
 */
export async function upsertBarriersWithKRIs(
  branchReportData: BranchReportData & { id?: string; project_id?: string },
  projectId?: string,
  branchId?: string,
) {
  try {
    const actualProjectId = projectId || branchReportData.project_id
    const actualBranchId = branchId || branchReportData.branch_id

    if (!actualProjectId || !actualBranchId) {
      console.error("[v0] Missing projectId or branchId for Barriers KRI calculation")
      return { success: false, error: "projectId and branchId are required for Barriers KRI calculation" }
    }

    console.log("[v0] Calculating Barriers KRIs for project:", actualProjectId, "branch:", actualBranchId)

    // Calculate all Barriers KRI values
    const kriValues: BarriersKRIValues = await calculateAllBarriersKRIValues(branchReportData)

    console.log("[v0] Calculated Barriers KRI values:", kriValues)

    // Check if Barriers row exists for this (project_id + branch_id) combination
    const { data: existingBarriers, error: fetchError } = await supabaseAdmin
      .from("Barriers")
      .select("id")
      .eq("Project ID", actualProjectId)
      .eq("Branch ID", actualBranchId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows found, which is expected for new combinations
      console.error("[v0] Error checking existing barriers:", fetchError)
      return { success: false, error: `Failed to check existing barriers: ${fetchError.message}` }
    }

    const updatePayload = {
      "Project ID": actualProjectId,
      "Branch ID": actualBranchId,
      created_at: branchReportData.created_at || new Date().toISOString(),
      "KRI: FRAUD INCIDENT RATE_Value": kriValues.kriFraudIncidentRateValue,
      "KRI: TRUST EROSION IN MFIs_Value": kriValues.kriTrustErosionValue,
      "KRI: MEMBERS LOAN COST_Value": kriValues.kriMembersLoanCostValue,
      "KRI: HAND IN HAND LOAN COST_Value": kriValues.kriHandInHandLoanCostValue,
      "KRI: MFI LOAN SERVICE COST_Value": kriValues.kriMFILoanServiceCostValue,
      "KRI: DOCUMENTATION DELAY RATE_Value": kriValues.kriDocumentationDelayRateValue,
      "KRI: GENDER BASED BARRIER RATE_Value": kriValues.kriGenderBasedBarrierRateValue,
      "KRI: FAMILY AND COMMUNITY BARRIER RATE_Value": kriValues.kriFamilyAndCommunityBarrierRateValue,
      "KRI: TRAINEE DROPOUT RATE_Value": kriValues.kriTraineeDropoutRateValue,
      "KRI: TRAINER DROPOUT RATE_Value": kriValues.kriTrainerDropoutRateValue,
      "KRI: CURRICULUM RELEVANCE COMPLAINT RATE_Value": kriValues.kriCurriculumRelevanceComplaintRateValue,
      "KRI: LOW KNOWLEDGE RETENTION RATE_Value": kriValues.kriLowKnowledgeRetentionRateValue,
    }

    // If exists, UPDATE the row
    if (existingBarriers) {
      console.log("[v0] Barriers data exists, updating KRI values:", existingBarriers.id)

      const { data, error } = await supabaseAdmin
        .from("Barriers")
        .update(updatePayload)
        .eq("Project ID", actualProjectId)
        .eq("Branch ID", actualBranchId)
        .select()
        .single()

      if (error) {
        console.error("[v0] Error updating barriers data with KRIs:", error)
        return { success: false, error: `Failed to update barriers data: ${error.message}` }
      }

      console.log("[v0] Barriers data with KRIs updated successfully")
      return { success: true, data, action: "updated" }
    } else {
      // If doesn't exist, INSERT new row
      console.log("[v0] Barriers data does not exist, inserting new row with KRIs")

      const { data, error } = await supabaseAdmin.from("Barriers").insert(updatePayload).select().single()

      if (error) {
        console.error("[v0] Error inserting barriers data with KRIs:", error)
        return { success: false, error: `Failed to insert barriers data: ${error.message}` }
      }

      console.log("[v0] Barriers data with KRIs inserted successfully")
      return { success: true, data, action: "inserted" }
    }
  } catch (error: any) {
    console.error("[v0] Exception in upsertBarriersWithKRIs:", error)
    return { success: false, error: error?.message || "Failed to upsert barriers data with KRIs" }
  }
}

export async function getBarriersByBranchId(branchId: string) {
  try {
    console.log("[v0] Fetching barriers data for branch:", branchId)

    const { data, error } = await supabaseAdmin
      .from("Barriers")
      .select("*")
      .eq("Branch ID", branchId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching barriers data:", error)
      return { success: false, error: `Failed to fetch barriers data: ${error.message}` }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("[v0] Exception in getBarriersByBranchId:", error)
    return { success: false, error: error?.message || "Failed to fetch barriers data" }
  }
}

export async function getBarriersByProjectId(projectId: string) {
  try {
    console.log("[v0] Fetching barriers data for project:", projectId)

    const { data, error } = await supabaseAdmin
      .from("Barriers")
      .select("*")
      .eq("Project ID", projectId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching barriers data:", error)
      return { success: false, error: `Failed to fetch barriers data: ${error.message}` }
    }

    if (!data) {
      console.log("[v0] No barriers data found for project:", projectId)
      return { success: true, data: null }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("[v0] Exception in getBarriersByProjectId:", error)
    return { success: false, error: error?.message || "Failed to fetch barriers data" }
  }
}

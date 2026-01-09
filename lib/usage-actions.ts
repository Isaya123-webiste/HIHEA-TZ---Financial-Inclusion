"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import { calculateAllKRIValues, type KRIValues, type BranchReportData } from "./usage-kri-calculations"

export interface UsageData {
  projectId: string
  branchId?: string
  createdAt?: string // Added createdAt parameter to accept timestamp from branch_reports
  usageActualData?: number
  usageValue?: number
  usageWeight?: number
  subFactorInsuranceValue?: number
  subFactorInsuranceWeight?: number
  subFactorAccountValue?: number
  subFactorAccountWeight?: number
  subFactorSavingsValue?: number
  subFactorSavingsWeight?: number
  subFactorBorrowingsValue?: number
  subFactorBorrowingsWeight?: number
  kpiRateMembersHavingAccountsValue?: number
  kpiRateMembersHavingAccountsWeight?: number
  kpiSavingsParticipationRateValue?: number
  kpiSavingsParticipationRateWeight?: number
  kpiSavingsDiversificationRateValue?: number
  kpiSavingsDiversificationRateWeight?: number
  kpiLoanUptakeRateValue?: number
  kpiLoanUptakeRateWeight?: number
  kpiLoanDiversificationRateValue?: number
  kpiLoanDiversificationRateWeight?: number
  kpiDisbursementLeadTimeValue?: number
  kpiDisbursementLeadTimeWeight?: number
  kpiConcentrationRateValue?: number
  kpiConcentrationRateWeight?: number
  kpiLoanRepaymentRateValue?: number
  kpiLoanRepaymentRateWeight?: number
  kriSlowAccountRateValue?: number
  kriSlowAccountRateWeight?: number
  kriChurnRateValue?: number
  kriChurnRateWeight?: number
  kriDisbandmentRateValue?: number
  kriDisbandmentRateWeight?: number
  kriLoanApplicationDropoutRateValue?: number
  kriLoanApplicationDropoutRateWeight?: number
  kriLoanRejectionRateValue?: number
  kriLoanRejectionRateWeight?: number
  kriLoanDelinquencyRateValue?: number
  kriLoanDelinquencyRateWeight?: number
  kriLoanDefaultRateValue?: number
  kriLoanDefaultRateWeight?: number
}

/**
 * Upsert Usage table with KRI calculations for a specific branch and project
 * Uses composite key of (project_id + branch_id) to identify/update rows
 */
export async function upsertUsageWithKRIs(
  branchReportData: BranchReportData & { id?: string; project_id?: string },
  projectId?: string,
  branchId?: string,
) {
  try {
    const actualProjectId = projectId || branchReportData.project_id
    const actualBranchId = branchId || branchReportData.branch_id

    if (!actualProjectId || !actualBranchId) {
      console.error("[v0] Missing projectId or branchId for KRI calculation")
      return { success: false, error: "projectId and branchId are required for KRI calculation" }
    }

    console.log("[v0] Calculating KRIs for project:", actualProjectId, "branch:", actualBranchId)

    // Calculate all KRI values
    const kriValues: KRIValues = await calculateAllKRIValues(branchReportData)

    console.log("[v0] Calculated KRI values:", kriValues)

    // Check if Usage row exists for this (project_id + branch_id) combination
    const { data: existingUsage, error: fetchError } = await supabaseAdmin
      .from("Usage")
      .select("id")
      .eq("Project ID", actualProjectId)
      .eq("Branch ID", actualBranchId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows found, which is expected for new combinations
      console.error("[v0] Error checking existing usage:", fetchError)
      return { success: false, error: `Failed to check existing usage: ${fetchError.message}` }
    }

    const updatePayload = {
      "Project ID": actualProjectId,
      "Branch ID": actualBranchId,
      created_at: branchReportData.created_at || new Date().toISOString(),
      "KRI: SLOW ACCOUNT RATE_Value": kriValues.kriSlowAccountRateValue,
      "KRI: CHURN RATE_Value": kriValues.kriChurnRateValue,
      "KRI: DISBANDMENT RATE_Value": kriValues.kriDisbandmentRateValue,
      "KRI: LOAN APPLICATION DROPOUT RATE_Value": kriValues.kriLoanApplicationDropoutRateValue,
      "KRI: LOAN REJECTION RATE_Value": kriValues.kriLoanRejectionRateValue,
      "KRI: LOAN DELIQUENCY RATE_Value": kriValues.kriLoanDelinquencyRateValue,
      "KRI: LOAN DEFAULT RATE_Value": kriValues.kriLoanDefaultRateValue,
    }

    // If exists, UPDATE the row
    if (existingUsage) {
      console.log("[v0] Usage data exists, updating KRI values:", existingUsage.id)

      const { data, error } = await supabaseAdmin
        .from("Usage")
        .update(updatePayload)
        .eq("Project ID", actualProjectId)
        .eq("Branch ID", actualBranchId)
        .select()
        .single()

      if (error) {
        console.error("[v0] Error updating usage data with KRIs:", error)
        return { success: false, error: `Failed to update usage data: ${error.message}` }
      }

      console.log("[v0] Usage data with KRIs updated successfully")
      return { success: true, data, action: "updated" }
    } else {
      // If doesn't exist, INSERT new row
      console.log("[v0] Usage data does not exist, inserting new row with KRIs")

      const { data, error } = await supabaseAdmin.from("Usage").insert(updatePayload).select().single()

      if (error) {
        console.error("[v0] Error inserting usage data with KRIs:", error)
        return { success: false, error: `Failed to insert usage data: ${error.message}` }
      }

      console.log("[v0] Usage data with KRIs inserted successfully")
      return { success: true, data, action: "inserted" }
    }
  } catch (error: any) {
    console.error("[v0] Exception in upsertUsageWithKRIs:", error)
    return { success: false, error: error?.message || "Failed to upsert usage data with KRIs" }
  }
}

export async function upsertUsageData(usageData: UsageData) {
  try {
    console.log("[v0] Upserting usage data for project:", usageData.projectId)

    // First, check if project_id already exists in Usage table
    const { data: existingUsage, error: fetchError } = await supabaseAdmin
      .from("Usage")
      .select("id")
      .eq("Project ID", usageData.projectId)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows found, which is expected for new projects
      console.error("[v0] Error checking existing usage:", fetchError)
      return { success: false, error: `Failed to check existing usage: ${fetchError.message}` }
    }

    const updatePayload = {
      "Project ID": usageData.projectId,
      "Branch ID": usageData.branchId || null,
      created_at: usageData.createdAt || new Date().toISOString(), // Renamed from "Calculation Date" to "created_at" and use provided createdAt or current timestamp
      Usage_Actual_Data: usageData.usageActualData || null,
      USAGE_Value: usageData.usageValue || null,
      USAGE_Weight: usageData.usageWeight || null,
      "SUB-FACTOR: INSURANCE_Value": usageData.subFactorInsuranceValue || null,
      "SUB-FACTOR: INSURANCE_Weight": usageData.subFactorInsuranceWeight || null,
      "SUB-FACTOR: ACCOUNT_Value": usageData.subFactorAccountValue || null,
      "SUB-FACTOR: ACCOUNT_Weight": usageData.subFactorAccountWeight || null,
      "SUB-FACTOR: SAVINGS_Value": usageData.subFactorSavingsValue || null,
      "SUB-FACTOR: SAVINGS_Weight": usageData.subFactorSavingsWeight || null,
      "SUB-FACTOR: BORROWINGS_Value": usageData.subFactorBorrowingsValue || null,
      "SUB-FACTOR: BORROWINGS_Weight": usageData.subFactorBorrowingsWeight || null,
      "KPI: RATE OF MEMBERS HAVING ACCOUNTS_Value": usageData.kpiRateMembersHavingAccountsValue || null,
      "KPI: RATE OF MEMBERS HAVING ACCOUNTS_Weight": usageData.kpiRateMembersHavingAccountsWeight || null,
      "KPI: SAVINGS PARTICIPATION RATE_Value": usageData.kpiSavingsParticipationRateValue || null,
      "KPI: SAVINGS PARTICIPATION RATE_Weight": usageData.kpiSavingsParticipationRateWeight || null,
      "KPI: SAVINGS DIVERSIFICATION RATE_Value": usageData.kpiSavingsDiversificationRateValue || null,
      "KPI: SAVINGS DIVERSIFICATION RATE_Weight": usageData.kpiSavingsDiversificationRateWeight || null,
      "KPI: LOAN UPTAKE RATE_Value": usageData.kpiLoanUptakeRateValue || null,
      "KPI: LOAN UPTAKE RATE_Weight": usageData.kpiLoanUptakeRateWeight || null,
      "KPI: LOAN DIVERSIFICATION RATE_Value": usageData.kpiLoanDiversificationRateValue || null,
      "KPI: LOAN DIVERSIFICATION RATE_Weight": usageData.kpiLoanDiversificationRateWeight || null,
      "KPI: DISBURSEMENT LEAD TIME_Value": usageData.kpiDisbursementLeadTimeValue || null,
      "KPI: DISBURSEMENT LEAD TIME_Weight": usageData.kpiDisbursementLeadTimeWeight || null,
      "KPI: CONCENTRATION RATE_Value": usageData.kpiConcentrationRateValue || null,
      "KPI: CONCENTRATION RATE_Weight": usageData.kpiConcentrationRateWeight || null,
      "KPI: LOAN REPAYMENT RATE_Value": usageData.kpiLoanRepaymentRateValue || null,
      "KPI: LOAN REPAYMENT RATE_Weight": usageData.kpiLoanRepaymentRateWeight || null,
      "KRI: SLOW ACCOUNT RATE_Value": usageData.kriSlowAccountRateValue || null,
      "KRI: CHURN RATE_Value": usageData.kriChurnRateValue || null,
      "KRI: DISBANDMENT RATE_Value": usageData.kriDisbandmentRateValue || null,
      "KRI: LOAN APPLICATION DROPOUT RATE_Value": usageData.kriLoanApplicationDropoutRateValue || null,
      "KRI: LOAN APPLICATION DROPOUT RATE_Weight": usageData.kriLoanApplicationDropoutRateWeight || null,
      "KRI: LOAN REJECTION RATE_Value": usageData.kriLoanRejectionRateValue || null,
      "KRI: LOAN REJECTION RATE_Weight": usageData.kriLoanRejectionRateWeight || null,
      "KRI: LOAN DELIQUENCY RATE_Value": usageData.kriLoanDelinquencyRateValue || null,
      "KRI: LOAN DELIQUENCY RATE_Weight": usageData.kriLoanDelinquencyRateWeight || null,
      "KRI: LOAN DEFAULT RATE_Value": usageData.kriLoanDefaultRateValue || null,
      "KRI: LOAN DEFAULT RATE_Weight": usageData.kriLoanDefaultRateWeight || null,
    }

    // If exists, UPDATE the row
    if (existingUsage) {
      console.log("[v0] Usage data exists, updating:", existingUsage.id)

      const { data, error } = await supabaseAdmin
        .from("Usage")
        .update(updatePayload)
        .eq("Project ID", usageData.projectId)
        .select()
        .single()

      if (error) {
        console.error("[v0] Error updating usage data:", error)
        return { success: false, error: `Failed to update usage data: ${error.message}` }
      }

      console.log("[v0] Usage data updated successfully")
      return { success: true, data, action: "updated" }
    } else {
      // If doesn't exist, INSERT new row
      console.log("[v0] Usage data does not exist, inserting new row")

      const { data, error } = await supabaseAdmin.from("Usage").insert(updatePayload).select().single()

      if (error) {
        console.error("[v0] Error inserting usage data:", error)
        return { success: false, error: `Failed to insert usage data: ${error.message}` }
      }

      console.log("[v0] Usage data inserted successfully")
      return { success: true, data, action: "inserted" }
    }
  } catch (error: any) {
    console.error("[v0] Exception in upsertUsageData:", error)
    return { success: false, error: error?.message || "Failed to upsert usage data" }
  }
}

export async function getUsageByProjectId(projectId: string) {
  try {
    console.log("[v0] Fetching usage data for project:", projectId)

    const { data, error } = await supabaseAdmin.from("Usage").select("*").eq("Project ID", projectId).single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching usage data:", error)
      return { success: false, error: `Failed to fetch usage data: ${error.message}` }
    }

    if (!data) {
      console.log("[v0] No usage data found for project:", projectId)
      return { success: true, data: null }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("[v0] Exception in getUsageByProjectId:", error)
    return { success: false, error: error?.message || "Failed to fetch usage data" }
  }
}

export async function getUsageByBranchId(branchId: string) {
  try {
    console.log("[v0] Fetching usage data for branch:", branchId)

    const { data, error } = await supabaseAdmin
      .from("Usage")
      .select("*")
      .eq("Branch ID", branchId)
      .order("created_at", { ascending: false }) // Updated from "Calculation Date" to "created_at"

    if (error) {
      console.error("[v0] Error fetching usage data:", error)
      return { success: false, error: `Failed to fetch usage data: ${error.message}` }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("[v0] Exception in getUsageByBranchId:", error)
    return { success: false, error: error?.message || "Failed to fetch usage data" }
  }
}

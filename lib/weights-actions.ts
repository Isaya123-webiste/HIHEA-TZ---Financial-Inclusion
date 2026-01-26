"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export interface WeightConfig {
  id: string
  category: string
  metric_name: string
  metric_key: string
  weight_value: number
  description?: string
  order_index: number
  created_at: string
  updated_at: string
}

// Get all USAGE weights
export async function getUsageWeights() {
  try {
    console.log("[v0] Fetching USAGE weights")

    const { data, error } = await supabaseAdmin
      .from("usage_weights_config")
      .select("*")
      .order("category", { ascending: true })
      .order("order_index", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching weights:", error)
      return { success: false, error: `Failed to fetch weights: ${error.message}` }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("[v0] Exception in getUsageWeights:", error)
    return { success: false, error: error?.message || "Failed to fetch weights" }
  }
}

// Get all ACCESS weights
export async function getAccessWeights() {
  try {
    console.log("[v0] Fetching ACCESS weights")

    const { data, error } = await supabaseAdmin
      .from("access_weights_config")
      .select("*")
      .order("category", { ascending: true })
      .order("order_index", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching ACCESS weights:", error)
      return { success: false, error: `Failed to fetch ACCESS weights: ${error.message}` }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("[v0] Exception in getAccessWeights:", error)
    return { success: false, error: error?.message || "Failed to fetch ACCESS weights" }
  }
}

// Get all BARRIERS weights
export async function getBarriersWeights() {
  try {
    console.log("[v0] Fetching BARRIERS weights")

    const { data, error } = await supabaseAdmin
      .from("barriers_weights_config")
      .select("*")
      .order("category", { ascending: true })
      .order("order_index", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching BARRIERS weights:", error)
      return { success: false, error: `Failed to fetch BARRIERS weights: ${error.message}` }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("[v0] Exception in getBarriersWeights:", error)
    return { success: false, error: error?.message || "Failed to fetch BARRIERS weights" }
  }
}

// Update a weight value in usage_weights_config AND Update the corresponding column in Usage table
export async function updateWeight(metricKey: string, newValue: number) {
  try {
    console.log(`[v0] Updating weight: ${metricKey} to ${newValue}`)

    const { data: updatedWeight, error: weightError } = await supabaseAdmin
      .from("usage_weights_config")
      .update({
        weight_value: newValue,
        updated_at: new Date().toISOString(),
      })
      .eq("metric_key", metricKey)
      .select()
      .single()

    if (weightError) {
      console.error("[v0] Error updating usage_weights_config:", weightError)
      return { success: false, error: `Failed to update weight: ${weightError.message}` }
    }

    // Map metric_key to Usage table column names
    const columnMapping: { [key: string]: string } = {
      USAGE: "USAGE_Weight",
      INSURANCE: "SUB-FACTOR: INSURANCE_Weight",
      ACCOUNT: "SUB-FACTOR: ACCOUNT_Weight",
      SAVINGS: "SUB-FACTOR: SAVINGS_Weight",
      BORROWINGS: "SUB-FACTOR: BORROWINGS_Weight",
      RATE_OF_MEMBERS_HAVING_ACCOUNTS: "KPI: RATE OF MEMBERS HAVING ACCOUNTS_Weight",
      SAVINGS_PARTICIPATION_RATE: "KPI: SAVINGS PARTICIPATION RATE_Weight",
      SAVINGS_DIVERSIFICATION_RATE: "KPI: SAVINGS DIVERSIFICATION RATE_Weight",
      LOAN_UPTAKE_RATE: "KPI: LOAN UPTAKE RATE_Weight",
      LOAN_DIVERSIFICATION_RATE: "KPI: LOAN DIVERSIFICATION RATE_Weight",
      DISBURSEMENT_LEAD_TIME: "KPI: DISBURSEMENT LEAD TIME_Weight",
      CONCENTRATION_RATE: "KPI: CONCENTRATION RATE_Weight",
      LOAN_REPAYMENT_RATE: "KPI: LOAN REPAYMENT RATE_Weight",
      SLOW_ACCOUNT_RATE: "KRI: SLOW ACCOUNT RATE_Weight",
      CHURN_RATE: "KRI: CHURN RATE_Weight",
      DISBANDMENT_RATE: "KRI: DISBANDMENT RATE_Weight",
      LOAN_APPLICATION_DROPOUT_RATE: "KRI: LOAN APPLICATION DROPOUT RATE_Weight",
      LOAN_REJECTION_RATE: "KRI: LOAN REJECTION RATE_Weight",
      LOAN_DELIQUENCY_RATE: "KRI: LOAN DELIQUENCY RATE_Weight",
      LOAN_DEFAULT_RATE: "KRI: LOAN DEFAULT RATE_Weight",
    }

    const usageColumn = columnMapping[metricKey]

    if (usageColumn) {
      const { error: usageError } = await supabaseAdmin
        .from("Usage")
        .update({
          [usageColumn]: newValue,
        })
        .not(usageColumn, "is", null)

      if (usageError) {
        console.warn("[v0] Warning: Failed to update Usage table:", usageError)
      } else {
        console.log(`[v0] Successfully updated Usage table column: ${usageColumn}`)
      }
    }

    console.log("[v0] Weight updated successfully")
    return { success: true, data: updatedWeight }
  } catch (error: any) {
    console.error("[v0] Exception in updateWeight:", error)
    return { success: false, error: error?.message || "Failed to update weight" }
  }
}

// Update a weight value in access_weights_config
export async function updateAccessWeight(metricKey: string, newValue: number) {
  try {
    console.log(`[v0] Updating ACCESS weight: ${metricKey} to ${newValue}`)

    const { data: updatedWeight, error: weightError } = await supabaseAdmin
      .from("access_weights_config")
      .update({
        weight_value: newValue,
        updated_at: new Date().toISOString(),
      })
      .eq("metric_key", metricKey)
      .select()
      .single()

    if (weightError) {
      console.error("[v0] Error updating access_weights_config:", weightError)
      return { success: false, error: `Failed to update ACCESS weight: ${weightError.message}` }
    }

    console.log("[v0] ACCESS weight updated successfully")
    return { success: true, data: updatedWeight }
  } catch (error: any) {
    console.error("[v0] Exception in updateAccessWeight:", error)
    return { success: false, error: error?.message || "Failed to update ACCESS weight" }
  }
}

// Update a weight value in barriers_weights_config AND Update the corresponding column in Barriers table
export async function updateBarriersWeight(metricKey: string, newValue: number) {
  try {
    console.log(`[v0] Updating BARRIERS weight: ${metricKey} to ${newValue}`)

    const { data: updatedWeight, error: weightError } = await supabaseAdmin
      .from("barriers_weights_config")
      .update({
        weight_value: newValue,
        updated_at: new Date().toISOString(),
      })
      .eq("metric_key", metricKey)
      .select()
      .single()

    if (weightError) {
      console.error("[v0] Error updating barriers_weights_config:", weightError)
      return { success: false, error: `Failed to update BARRIERS weight: ${weightError.message}` }
    }

    // Map metric_key to Barriers table column names
    const columnMapping: { [key: string]: string } = {
      FRAUD_INCIDENT_RATE: "KRI: FRAUD INCIDENT RATE_Weight",
      TRUST_EROSION_IN_MFIs: "KRI: TRUST EROSION IN MFIs_Weight",
      MEMBERS_LOAN_COST: "KRI: MEMBERS LOAN COST_Weight",
      HAND_IN_HAND_LOAN_COST: "KRI: HAND IN HAND LOAN COST_Weight",
      MFI_LOAN_SERVICE_COST: "KRI: MFI LOAN SERVICE COST_Weight",
      DOCUMENTATION_DELAY_RATE: "KRI: DOCUMENTATION DELAY RATE_Weight",
      GENDER_BASED_BARRIER_RATE: "KRI: GENDER BASED BARRIER RATE_Weight",
      FAMILY_AND_COMMUNITY_BARRIER_RATE: "KRI: FAMILY AND COMMUNITY BARRIER RATE_Weight",
      TRAINEE_DROPOUT_RATE: "KRI: TRAINEE DROPOUT RATE_Weight",
      TRAINER_DROPOUT_RATE: "KRI: TRAINER DROPOUT RATE_Weight",
      CURRICULUM_RELEVANCE_COMPLAINT_RATE: "KRI: CURRICULUM RELEVANCE COMPLAINT RATE_Weight",
      LOW_KNOWLEDGE_RETENTION_RATE: "KRI: LOW KNOWLEDGE RETENTION RATE_Weight",
    }

    const barriersColumn = columnMapping[metricKey]

    if (barriersColumn) {
      const { error: barriersError } = await supabaseAdmin
        .from("Barriers")
        .update({
          [barriersColumn]: newValue,
        })
        .not(barriersColumn, "is", null)

      if (barriersError) {
        console.warn("[v0] Warning: Failed to update Barriers table:", barriersError)
      } else {
        console.log(`[v0] Successfully updated Barriers table column: ${barriersColumn}`)
      }
    }

    console.log("[v0] BARRIERS weight updated successfully")
    return { success: true, data: updatedWeight }
  } catch (error: any) {
    console.error("[v0] Exception in updateBarriersWeight:", error)
    return { success: false, error: error?.message || "Failed to update BARRIERS weight" }
  }
}

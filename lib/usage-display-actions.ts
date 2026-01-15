"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export async function fetchUsageChartData() {
  try {
    console.log("[v0] Fetching usage chart data from admin client")

    // Fetch usage data with all sub-factor values
    const { data: usageData, error: usageError } = await supabaseAdmin.from("Usage").select(`
        id,
        "Project ID",
        "Branch ID",
        "SUB-FACTOR: INSURANCE_Value",
        "SUB-FACTOR: ACCOUNT_Value",
        "SUB-FACTOR: SAVINGS_Value",
        "SUB-FACTOR: BORROWINGS_Value",
        "Usage_Actual_Data"
      `)

    if (usageError) {
      console.error("[v0] Error fetching usage data:", usageError)
      throw usageError
    }

    // Fetch all projects
    const { data: projectsData, error: projectsError } = await supabaseAdmin.from("projects").select("id, name")

    if (projectsError) {
      console.error("[v0] Error fetching projects:", projectsError)
      throw projectsError
    }

    // Fetch all branches
    const { data: branchesData, error: branchesError } = await supabaseAdmin.from("branches").select("id, name")

    if (branchesError) {
      console.error("[v0] Error fetching branches:", branchesError)
      throw branchesError
    }

    console.log("[v0] Usage data fetched successfully:", usageData?.length || 0, "records")

    return {
      success: true,
      usageData: usageData || [],
      projects: projectsData || [],
      branches: branchesData || [],
    }
  } catch (error: any) {
    console.error("[v0] Error in fetchUsageChartData:", error)
    return {
      success: false,
      error: error?.message || "Failed to fetch usage chart data",
      usageData: [],
      projects: [],
      branches: [],
    }
  }
}

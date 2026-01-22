"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export async function fetchBarriersChartData() {
  try {
    console.log("[v0] Fetching barriers chart data from admin client")

    // Fetch barriers data with all KRI values
    const { data: barriersData, error: barriersError } = await supabaseAdmin.from("Barriers").select(`
        id,
        "Project ID",
        "Branch ID",
        "KRI: FRAUD INCIDENT RATE_Value",
        "KRI: TRUST EROSION IN MFIs_Value",
        "KRI: MEMBERS LOAN COST_Value",
        "KRI: HAND IN HAND LOAN COST_Value",
        "KRI: MFI LOAN SERVICE COST_Value",
        "KRI: DOCUMENTATION DELAY RATE_Value",
        "KRI: GENDER BASED BARRIER RATE_Value",
        "KRI: FAMILY AND COMMUNITY BARRIER RATE_Value",
        "KRI: TRAINEE DROPOUT RATE_Value",
        "KRI: TRAINER DROPOUT RATE_Value",
        "KRI: CURRICULUM RELEVANCE COMPLAINT RATE_Value",
        "KRI: LOW KNOWLEDGE RETENTION RATE_Value",
        "Barriers_Actual_Data"
      `)

    if (barriersError) {
      console.error("[v0] Error fetching barriers data:", barriersError)
      throw barriersError
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

    console.log("[v0] Barriers data fetched successfully:", barriersData?.length || 0, "records")

    return {
      success: true,
      barriersData: barriersData || [],
      projects: projectsData || [],
      branches: branchesData || [],
    }
  } catch (error: any) {
    console.error("[v0] Error in fetchBarriersChartData:", error)
    return {
      success: false,
      error: error?.message || "Failed to fetch barriers chart data",
      barriersData: [],
      projects: [],
      branches: [],
    }
  }
}

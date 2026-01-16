"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export async function fetchAccessChartData() {
  try {
    console.log("[v0] Fetching access chart data from admin client")

    // Fetch access data with all metrics
    const { data: accessData, error: accessError } = await supabaseAdmin.from("Access").select(`
        id,
        "Project ID",
        "Branch ID",
        "Access_Actual_Data",
        "ACCESS_Value",
        "SUB-FACTOR: BANK BRANCHES_Value",
        "SUB-FACTOR: AGENTS_Value",
        "SUB-FACTOR: ATMs AND ONLINE SERVICES_Value",
        "SUB-FACTOR: INSURERS AND AGENTS_Value"
      `)

    if (accessError) {
      console.error("[v0] Error fetching access data:", accessError)
      throw accessError
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

    console.log("[v0] Access data fetched successfully:", accessData?.length || 0, "records")

    return {
      success: true,
      accessData: accessData || [],
      projects: projectsData || [],
      branches: branchesData || [],
    }
  } catch (error: any) {
    console.error("[v0] Error in fetchAccessChartData:", error)
    return {
      success: false,
      error: error?.message || "Failed to fetch access chart data",
      accessData: [],
      projects: [],
      branches: [],
    }
  }
}

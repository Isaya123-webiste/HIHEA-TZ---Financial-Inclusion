"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export async function fetchFINDEXData() {
  try {
    console.log("[v0] Fetching FINDEX data from admin client")

    // Fetch Usage, Access, and Barriers data
    const [usageResult, accessResult, barriersResult, projectsResult, branchesResult] = await Promise.all([
      supabaseAdmin.from("Usage").select(`
        id,
        "Project ID",
        "Branch ID",
        "USAGE_Value"
      `),
      supabaseAdmin.from("Access").select(`
        id,
        "Project ID",
        "Branch ID",
        "ACCESS_Value"
      `),
      supabaseAdmin.from("Barriers").select(`
        id,
        "Project ID",
        "Branch ID",
        "BARRIERS_Value"
      `),
      supabaseAdmin.from("projects").select("id, name"),
      supabaseAdmin.from("branches").select("id, name"),
    ])

    if (usageResult.error) {
      console.error("[v0] Error fetching usage data:", usageResult.error)
      throw usageResult.error
    }

    if (accessResult.error) {
      console.error("[v0] Error fetching access data:", accessResult.error)
      throw accessResult.error
    }

    if (barriersResult.error) {
      console.error("[v0] Error fetching barriers data:", barriersResult.error)
      throw barriersResult.error
    }

    console.log("[v0] FINDEX data fetched successfully")
    console.log("[v0] Usage records:", usageResult.data?.length || 0)
    console.log("[v0] Access records:", accessResult.data?.length || 0)
    console.log("[v0] Barriers records:", barriersResult.data?.length || 0)

    return {
      success: true,
      usageData: usageResult.data || [],
      accessData: accessResult.data || [],
      barriersData: barriersResult.data || [],
      projects: projectsResult.data || [],
      branches: branchesResult.data || [],
    }
  } catch (error: any) {
    console.error("[v0] Error in fetchFINDEXData:", error)
    return {
      success: false,
      error: error?.message || "Failed to fetch FINDEX data",
      usageData: [],
      accessData: [],
      barriersData: [],
      projects: [],
      branches: [],
    }
  }
}

export async function fetchTotalLoansData() {
  try {
    console.log("[v0] Fetching Total Loans data from admin client")

    // Fetch branch reports with loan amounts
    const { data: branchReports, error: reportsError } = await supabaseAdmin.from("branch_reports").select(`
        id,
        project_id,
        branch_id,
        loan_amount_approved,
        created_at
      `)

    if (reportsError) {
      console.error("[v0] Error fetching branch reports:", reportsError)
      throw reportsError
    }

    // Fetch projects and branches for display names
    const [projectsResult, branchesResult] = await Promise.all([
      supabaseAdmin.from("projects").select("id, name"),
      supabaseAdmin.from("branches").select("id, name"),
    ])

    console.log("[v0] Total Loans data fetched successfully:", branchReports?.length || 0, "records")

    return {
      success: true,
      branchReports: branchReports || [],
      projects: projectsResult.data || [],
      branches: branchesResult.data || [],
    }
  } catch (error: any) {
    console.error("[v0] Error in fetchTotalLoansData:", error)
    return {
      success: false,
      error: error?.message || "Failed to fetch total loans data",
      branchReports: [],
      projects: [],
      branches: [],
    }
  }
}

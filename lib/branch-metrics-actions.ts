"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export async function getBranchMetrics(branchId: string, currentUserId: string) {
  try {
    console.log("Getting branch metrics for branch:", branchId, "user:", currentUserId)

    // Get branch information
    const { data: branch, error: branchError } = await supabaseAdmin
      .from("branches")
      .select("*")
      .eq("id", branchId)
      .single()

    if (branchError) {
      console.error("Branch error:", branchError)
      return { error: "Failed to fetch branch information" }
    }

    // Get all team members in this branch (including both old and new role names)
    const { data: teamMembers, error: teamError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("branch_id", branchId)
      .in("role", ["branch_manager", "program_officer", "branch_report_officer", "report_officer"])
      .order("created_at", { ascending: false })

    if (teamError) {
      console.error("Team members error:", teamError)
      return { error: "Failed to fetch team members" }
    }

    console.log("Found team members:", teamMembers?.length || 0)

    // Normalize legacy role names
    const normalizedTeamMembers =
      teamMembers?.map((member) => ({
        ...member,
        role: member.role === "report_officer" ? "branch_report_officer" : member.role,
      })) || []

    return {
      branch,
      teamMembers: normalizedTeamMembers,
      success: true,
    }
  } catch (error) {
    console.error("Get branch metrics error:", error)
    return { error: "Failed to fetch branch metrics" }
  }
}

export async function getBranchStats(branchId: string) {
  try {
    // Get basic branch statistics
    const { data: members, error: membersError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, status")
      .eq("branch_id", branchId)

    if (membersError) {
      return { error: "Failed to fetch branch statistics" }
    }

    const stats = {
      totalMembers: members?.length || 0,
      activeMembers: members?.filter((m) => m.status === "active").length || 0,
      branchManagers: members?.filter((m) => m.role === "branch_manager").length || 0,
      programOfficers: members?.filter((m) => m.role === "program_officer").length || 0,
      branchReportOfficers:
        members?.filter((m) => m.role === "branch_report_officer" || m.role === "report_officer").length || 0,
    }

    return { stats, success: true }
  } catch (error) {
    console.error("Get branch stats error:", error)
    return { error: "Failed to fetch branch statistics" }
  }
}

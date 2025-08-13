"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function getTeamMembers(branchId: string, currentUserId: string) {
  try {
    console.log(`=== FETCHING TEAM MEMBERS ===`)
    console.log(`Branch ID: ${branchId}`)
    console.log(`Current User ID: ${currentUserId}`)

    // First, get branch details
    const { data: branchData, error: branchError } = await supabaseAdmin
      .from("branches")
      .select("id, name, status")
      .eq("id", branchId)
      .single()

    if (branchError) {
      console.error("Error fetching branch details:", branchError)
      return { error: "Failed to load branch details", data: null, branch: null }
    }

    console.log("Branch Data:", JSON.stringify(branchData, null, 2))

    // Get all users from the same branch, excluding the current user
    // Note: Looking at the database, the role appears to be 'report_officer', not 'branch_report_officer'
    const { data: branchUsers, error: usersError } = await supabaseAdmin
      .from("profiles")
      .select(`
        id, 
        full_name, 
        email, 
        role, 
        status, 
        created_at,
        branch_id
      `)
      .eq("branch_id", branchId)
      .neq("id", currentUserId)
      .in("role", ["branch_manager", "program_officer", "report_officer", "branch_report_officer"])
      .order("role")
      .order("full_name")

    if (usersError) {
      console.error("Error fetching team members:", usersError)
      return { error: "Failed to load team members", data: null, branch: branchData }
    }

    console.log(`Found ${branchUsers.length} team members for branch: ${branchData.name}`)
    console.log("Team Members Details:", JSON.stringify(branchUsers, null, 2))

    // Group users by role - handle both 'report_officer' and 'branch_report_officer'
    const groupedUsers = {
      program_officers: branchUsers.filter((user) => user.role === "program_officer"),
      branch_report_officers: branchUsers.filter(
        (user) => user.role === "branch_report_officer" || user.role === "report_officer",
      ),
      branch_managers: branchUsers.filter((user) => user.role === "branch_manager"),
    }

    console.log("Grouped Users Counts:", {
      program_officers: groupedUsers.program_officers.length,
      branch_report_officers: groupedUsers.branch_report_officers.length,
      branch_managers: groupedUsers.branch_managers.length,
    })

    console.log("Grouped Users Details:", JSON.stringify(groupedUsers, null, 2))

    return {
      data: groupedUsers,
      error: null,
      branch: branchData,
      totalMembers: branchUsers.length,
    }
  } catch (error) {
    console.error("Load team members error:", error)
    return { error: "Failed to load team members", data: null, branch: null }
  }
}

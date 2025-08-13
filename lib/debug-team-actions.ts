"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function debugTeamData(currentUserId: string) {
  try {
    console.log("=== DEBUGGING TEAM DATA ===")
    console.log("Current User ID:", currentUserId)

    // 1. Get current user's profile
    const { data: currentUserProfile, error: currentUserError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", currentUserId)
      .single()

    if (currentUserError) {
      console.error("Error fetching current user:", currentUserError)
      return { error: "Failed to fetch current user" }
    }

    console.log("Current User Profile:", JSON.stringify(currentUserProfile, null, 2))

    // 2. Get all branches
    const { data: allBranches, error: branchesError } = await supabaseAdmin.from("branches").select("*").order("name")

    if (branchesError) {
      console.error("Error fetching branches:", branchesError)
    } else {
      console.log("All Branches:", JSON.stringify(allBranches, null, 2))
    }

    // 3. Get all users
    const { data: allUsers, error: usersError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("role", { ascending: true })
      .order("full_name", { ascending: true })

    if (usersError) {
      console.error("Error fetching all users:", usersError)
    } else {
      console.log("All Users:", JSON.stringify(allUsers, null, 2))
    }

    // 4. Get users with the same branch_id as current user
    if (currentUserProfile.branch_id) {
      const { data: sameBranchUsers, error: sameBranchError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("branch_id", currentUserProfile.branch_id)
        .neq("id", currentUserId)
        .order("role")

      if (sameBranchError) {
        console.error("Error fetching same branch users:", sameBranchError)
      } else {
        console.log("Same Branch Users:", JSON.stringify(sameBranchUsers, null, 2))
        console.log("Same Branch Users Count:", sameBranchUsers.length)

        // Group by role
        const groupedUsers = {
          branch_managers: sameBranchUsers.filter((u) => u.role === "branch_manager"),
          program_officers: sameBranchUsers.filter((u) => u.role === "program_officer"),
          report_officers: sameBranchUsers.filter((u) => u.role === "report_officer"),
          branch_report_officers: sameBranchUsers.filter((u) => u.role === "branch_report_officer"),
        }

        console.log("Grouped Users:", JSON.stringify(groupedUsers, null, 2))
      }
    }

    // 5. Check for report officers specifically
    const { data: reportOfficers, error: reportOfficersError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .in("role", ["report_officer", "branch_report_officer"])
      .order("full_name")

    if (reportOfficersError) {
      console.error("Error fetching report officers:", reportOfficersError)
    } else {
      console.log("All Report Officers:", JSON.stringify(reportOfficers, null, 2))
    }

    return {
      currentUser: currentUserProfile,
      allBranches,
      allUsers,
      reportOfficers,
      success: true,
    }
  } catch (error) {
    console.error("Debug error:", error)
    return { error: "Debug failed" }
  }
}

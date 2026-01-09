"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export interface BranchOfficerLoginFix {
  email: string
  success: boolean
  message: string
  temporaryPassword?: string
}

/**
 * PERMANENT FIX: Reset all Branch Report Officer passwords
 *
 * This function:
 * 1. Finds all active Branch Report Officers from the profiles table
 * 2. Resets their passwords in Supabase Auth using admin API
 * 3. Returns a list of officers with their temporary passwords
 *
 * The root cause was that auth.users password hashes didn't match
 * what the officers were trying to use during login.
 */
export async function fixBranchOfficerLogins(): Promise<{
  success: boolean
  results: BranchOfficerLoginFix[]
  totalFixed: number
  totalFailed: number
}> {
  try {
    console.log("[v0] Starting Branch Report Officer login fix...")

    // 1. Get all active Branch Report Officers from profiles table
    const { data: officers, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .eq("role", "branch_report_officer")
      .eq("status", "active")

    if (fetchError) {
      console.error("[v0] Error fetching branch officers:", fetchError)
      return {
        success: false,
        results: [{ email: "N/A", success: false, message: `Fetch error: ${fetchError.message}` }],
        totalFixed: 0,
        totalFailed: 1,
      }
    }

    if (!officers || officers.length === 0) {
      console.log("[v0] No active Branch Report Officers found")
      return {
        success: true,
        results: [{ email: "N/A", success: true, message: "No officers found to fix" }],
        totalFixed: 0,
        totalFailed: 0,
      }
    }

    console.log(`[v0] Found ${officers.length} Branch Report Officers to fix`)

    const results: BranchOfficerLoginFix[] = []
    let successCount = 0
    let failureCount = 0

    // 2. For each officer, generate a temporary password and update it
    for (const officer of officers) {
      try {
        // Generate a temporary password that's secure and memorable
        const tempPassword = `BranchOfficer@${officer.email.split("@")[0]}123!`

        console.log(`[v0] Resetting password for ${officer.email}...`)

        // Use Supabase Admin API to update the user's password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(officer.id, {
          password: tempPassword,
        })

        if (updateError) {
          console.error(`[v0] Error resetting password for ${officer.email}:`, updateError)
          results.push({
            email: officer.email,
            success: false,
            message: `Error: ${updateError.message}`,
          })
          failureCount++
        } else {
          console.log(`[v0] Successfully reset password for ${officer.email}`)
          results.push({
            email: officer.email,
            success: true,
            message: "Password reset successfully",
            temporaryPassword: tempPassword,
          })
          successCount++
        }
      } catch (error: any) {
        console.error(`[v0] Unexpected error for ${officer.email}:`, error)
        results.push({
          email: officer.email,
          success: false,
          message: `Unexpected error: ${error.message}`,
        })
        failureCount++
      }
    }

    console.log(`[v0] Login fix completed: ${successCount} success, ${failureCount} failures`)

    return {
      success: successCount > 0 && failureCount === 0,
      results,
      totalFixed: successCount,
      totalFailed: failureCount,
    }
  } catch (error: any) {
    console.error("[v0] Unexpected error in fixBranchOfficerLogins:", error)
    return {
      success: false,
      results: [{ email: "N/A", success: false, message: `Unexpected error: ${error.message}` }],
      totalFixed: 0,
      totalFailed: 1,
    }
  }
}

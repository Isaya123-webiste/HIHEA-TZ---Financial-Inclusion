"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

interface PasswordResetResult {
  email: string
  success: boolean
  message: string
}

/**
 * Reset password for a specific branch report officer
 * This should only be called by admins with proper authorization
 */
export async function resetBranchOfficerPassword(
  email: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const cookieStore = await cookies()

    // Use service role key for admin operations
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    })

    // Get the user by email
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers()

    if (fetchError) {
      console.error("[v0] Error fetching users:", fetchError)
      return { success: false, message: "Failed to fetch users" }
    }

    const user = users.users.find((u) => u.email === email)

    if (!user) {
      return { success: false, message: `User with email ${email} not found` }
    }

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    })

    if (updateError) {
      console.error("[v0] Error updating password:", updateError)
      return { success: false, message: `Failed to reset password: ${updateError.message}` }
    }

    console.log(`[v0] Password reset successful for ${email}`)
    return { success: true, message: `Password reset successful for ${email}` }
  } catch (error) {
    console.error("[v0] Unexpected error in resetBranchOfficerPassword:", error)
    return { success: false, message: "Unexpected error occurred" }
  }
}

/**
 * Reset passwords for all branch report officers
 * This is a batch operation that should only be called by admins
 */
export async function resetAllBranchOfficerPasswords(): Promise<PasswordResetResult[]> {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    })

    // Get all branch report officer profiles
    const { data: officers, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("role", "branch_report_officer")
      .eq("status", "active")

    if (profileError) {
      console.error("[v0] Error fetching branch officers:", profileError)
      return [{ email: "N/A", success: false, message: "Failed to fetch branch officers" }]
    }

    const results: PasswordResetResult[] = []

    for (const officer of officers || []) {
      if (!officer.email) continue

      try {
        // Generate temporary password (you can customize this)
        const tempPassword = `BranchReportOfficer@${Date.now()}`

        const result = await resetBranchOfficerPassword(officer.email, tempPassword)

        results.push({
          email: officer.email,
          success: result.success,
          message: result.message,
        })
      } catch (error) {
        results.push({
          email: officer.email,
          success: false,
          message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        })
      }
    }

    return results
  } catch (error) {
    console.error("[v0] Unexpected error in resetAllBranchOfficerPasswords:", error)
    return [{ email: "N/A", success: false, message: "Unexpected error occurred" }]
  }
}

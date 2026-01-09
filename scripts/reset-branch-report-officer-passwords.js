import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[v0] Missing Supabase environment variables")
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function resetBranchReportOfficerPasswords() {
  console.log("[v0] Starting Branch Report Officer password reset...")

  try {
    // Fetch all branch_report_officer users
    console.log("[v0] Fetching all branch_report_officer users...")
    const { data: officers, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .eq("role", "branch_report_officer")

    if (fetchError) {
      console.error("[v0] Error fetching branch report officers:", fetchError)
      return
    }

    if (!officers || officers.length === 0) {
      console.log("[v0] No branch report officers found")
      return
    }

    console.log(`[v0] Found ${officers.length} branch report officers to reset`)

    let successCount = 0
    let failureCount = 0

    // Reset password for each officer
    for (const officer of officers) {
      try {
        // Generate a secure temporary password
        const newPassword = `BranchOfficer_${officer.email.split("@")[0]}@2024!`

        console.log(`[v0] Resetting password for ${officer.email}...`)

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(officer.id, {
          password: newPassword,
        })

        if (updateError) {
          console.error(`[v0] Failed to reset password for ${officer.email}:`, updateError)
          failureCount++
        } else {
          console.log(`[v0] Successfully reset password for ${officer.email}. Temporary password: ${newPassword}`)
          successCount++
        }
      } catch (error) {
        console.error(`[v0] Error processing ${officer.email}:`, error)
        failureCount++
      }
    }

    console.log("[v0] ========================================")
    console.log(`[v0] Password Reset Summary:`)
    console.log(`[v0] Total Officers: ${officers.length}`)
    console.log(`[v0] Successful: ${successCount}`)
    console.log(`[v0] Failed: ${failureCount}`)
    console.log("[v0] ========================================")
    console.log("[v0] All branch report officers can now login with their new passwords!")
  } catch (error) {
    console.error("[v0] Unexpected error during password reset:", error)
  }
}

resetBranchReportOfficerPasswords()

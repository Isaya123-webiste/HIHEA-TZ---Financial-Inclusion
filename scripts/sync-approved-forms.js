import { createClient } from "@supabase/supabase-js"
import { aggregateFormToBranchReport } from "../lib/branch-report-aggregation.ts"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function syncApprovedForms() {
  try {
    console.log("[v0] Starting sync of approved forms to branch_reports...")

    // Fetch all approved forms that haven't been aggregated yet
    const { data: approvedForms, error: fetchError } = await supabase
      .from("form_submissions")
      .select("*")
      .eq("status", "approved")
      .eq("form_type", "Create Financial Inclusion Report")

    if (fetchError) {
      console.error("[v0] Error fetching approved forms:", fetchError)
      process.exit(1)
    }

    if (!approvedForms || approvedForms.length === 0) {
      console.log("[v0] No approved forms to sync")
      return
    }

    console.log(`[v0] Found ${approvedForms.length} approved forms to sync`)

    let successCount = 0
    let failureCount = 0

    for (const form of approvedForms) {
      try {
        console.log(`[v0] Syncing form ${form.id} (branch: ${form.branch_id})...`)

        const result = await aggregateFormToBranchReport(
          form.id,
          form.branch_id,
          form["Project ID"] || null, // Use project_id from form data if available
        )

        if (result.success) {
          console.log(`[v0] ✓ Successfully synced form ${form.id}`)
          successCount++
        } else {
          console.error(`[v0] ✗ Failed to sync form ${form.id}: ${result.error}`)
          failureCount++
        }
      } catch (error: any) {
        console.error(`[v0] Error syncing form ${form.id}:`, error.message)
        failureCount++
      }
    }

    console.log(`[v0] Sync complete: ${successCount} succeeded, ${failureCount} failed`)
  } catch (error: any) {
    console.error("[v0] Unexpected error during sync:", error)
    process.exit(1)
  }
}

syncApprovedForms()

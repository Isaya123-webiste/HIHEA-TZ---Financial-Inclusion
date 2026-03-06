import { createClient } from "@supabase/supabase-js"

// Note: This script syncs approved forms to branch_reports table.
// KRI calculations and syncing to Usage/Access/Barriers will happen automatically
// when future forms are approved through the normal approval workflow.

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

    // Fetch all approved forms
    const { data: approvedForms, error: fetchError } = await supabase
      .from("form_submissions")
      .select("*")
      .eq("status", "approved")

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

        // Extract form data
        const formData = form.form_data || {}
        let projectId = form.project_id
        const branchId = form.branch_id
        
        // If no project_id, use null (will need to be updated manually later)
        if (!projectId) {
          console.log(`[v0] Warning: No project_id found for branch ${branchId}, will sync with null`)
        }
        
        console.log(`[v0] Project ID: ${projectId}, Branch ID: ${branchId}`)

        // Create branch report record with correct fields
        // Note: If project_id is null, the automatic trigger to Access table will fail
        // This is a known data integrity issue that needs to be fixed in the database
        const newReport = {
          branch_id: branchId,
          project_id: projectId,
          title: `Branch Report - ${new Date().toISOString().split("T")[0]}`,
          form_type: "branch_report",
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          aggregated_form_ids: [form.id],
          total_approved_forms: 1,
          last_aggregated_form_id: form.id,
          num_mfis: parseInt(formData.num_mfis) || 0,
          groups_bank_account: parseInt(formData.groups_bank_account) || 0,
          members_bank_account: parseInt(formData.members_bank_account) || 0,
          inactive_accounts: parseInt(formData.inactive_accounts) || 0,
          num_insurers: parseInt(formData.num_insurers) || 0,
          members_insurance: parseInt(formData.members_insurance) || 0,
          borrowed_groups: parseInt(formData.borrowed_groups) || 0,
          members_applying_loans: parseInt(formData.members_applying_loans) || 0,
          loan_amount_applied: parseFloat(formData.loan_amount_applied) || 0,
          loan_amount_approved: parseFloat(formData.loan_amount_approved) || 0,
          members_received_loans: parseInt(formData.members_received_loans) || 0,
          members_complaining_delay: parseInt(formData.members_complaining_delay) || 0,
          loan_default: parseFloat(formData.loan_default) || 0,
          loan_delinquency: parseFloat(formData.loan_delinquency) || 0,
          loan_dropout: parseInt(formData.loan_dropout) || 0,
          money_fraud: parseInt(formData.money_fraud) || 0,
          number_of_groups: parseInt(formData.number_of_groups) || 0,
          members_at_start: parseInt(formData.members_at_start) || 0,
          members_at_end: parseInt(formData.members_at_end) || 0,
          bros_at_start: parseInt(formData.bros_at_start) || 0,
          bros_at_end: parseInt(formData.bros_at_end) || 0,
          loan_uses: parseInt(formData.loan_uses) || 0,
          loan_cost_high: parseInt(formData.loan_cost_high) || 0,
          explain_barriers: formData.explain_barriers || "",
          credit_sources: parseInt(formData.credit_sources) || 0,
          trust_erosion: (parseInt(formData.trust_erosion) || 0).toString(),
          documentation_delay: (parseInt(formData.documentation_delay) || 0).toString(),
        }

        // Insert branch report
        const { error: insertError } = await supabase
          .from("branch_reports")
          .insert(newReport)

        if (insertError) {
          console.error(`[v0] Error inserting branch report for form ${form.id}:`, insertError.message)
          failureCount++
        } else {
          console.log(`[v0] ✓ Successfully synced form ${form.id} to branch_reports`)
          successCount++
        }
      } catch (error) {
        console.error(`[v0] Error syncing form ${form.id}:`, error.message)
        failureCount++
      }
    }

    console.log(`[v0] Sync complete: ${successCount} succeeded, ${failureCount} failed`)
  } catch (error) {
    console.error("[v0] Unexpected error during sync:", error)
    process.exit(1)
  }
}

syncApprovedForms()

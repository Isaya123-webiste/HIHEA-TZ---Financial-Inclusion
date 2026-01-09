/**
 * Migration Script: Calculate KRIs for all existing branch_reports
 *
 * This script:
 * 1. Fetches all existing branch_reports
 * 2. Calculates KRI values for each using the KRI formulas
 * 3. Upserts Usage table with calculated KRI values per (project_id + branch_id)
 *
 * Run with: node scripts/calculate-kris-for-existing-branch-reports.js
 */

const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Safe division - returns 0 on division by zero
function safeDivide(numerator = 0, denominator = 0) {
  if (denominator === 0 || !denominator) {
    return 0
  }
  const result = numerator / denominator
  return isNaN(result) ? 0 : result
}

// KRI Calculation Functions
function calculateSlowAccountRate(branchData) {
  return safeDivide(0, branchData.members_at_end || 0)
}

function calculateChurnRate(branchData) {
  return safeDivide(branchData.inactive_accounts || 0, branchData.members_at_end || 0)
}

function calculateDisbandmentRate(branchData) {
  return safeDivide(branchData.loan_dropout || 0, branchData.members_at_end || 0)
}

function calculateLoanApplicationDropoutRate(branchData) {
  return safeDivide(branchData.loan_dropout || 0, branchData.members_applying_loans || 0)
}

function calculateLoanRejectionRate(branchData) {
  const membersApplying = branchData.members_applying_loans || 0
  const membersReceived = branchData.members_received_loans || 0
  const dropout = branchData.loan_dropout || 0
  const numerator = membersApplying - membersReceived - dropout
  return safeDivide(numerator, membersApplying)
}

function calculateLoanDelinquencyRate(branchData) {
  return safeDivide(branchData.loan_delinquency || 0, branchData.members_received_loans || 0)
}

function calculateLoanDefaultRate(branchData) {
  return safeDivide(branchData.loan_default || 0, branchData.members_received_loans || 0)
}

function calculateAllKRIValues(branchData) {
  return {
    kriSlowAccountRateValue: calculateSlowAccountRate(branchData),
    kriChurnRateValue: calculateChurnRate(branchData),
    kriDisbandmentRateValue: calculateDisbandmentRate(branchData),
    kriLoanApplicationDropoutRateValue: calculateLoanApplicationDropoutRate(branchData),
    kriLoanRejectionRateValue: calculateLoanRejectionRate(branchData),
    kriLoanDelinquencyRateValue: calculateLoanDelinquencyRate(branchData),
    kriLoanDefaultRateValue: calculateLoanDefaultRate(branchData),
  }
}

async function migrateKRIs() {
  try {
    console.log("Starting KRI migration for existing branch_reports...")

    // Fetch all branch reports
    const { data: branchReports, error: fetchError } = await supabase
      .from("branch_reports")
      .select("*")
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("Error fetching branch reports:", fetchError)
      process.exit(1)
    }

    console.log(`Found ${branchReports.length} branch reports to process`)

    if (branchReports.length === 0) {
      console.log("No branch reports found. Exiting.")
      process.exit(0)
    }

    let successCount = 0
    let errorCount = 0

    for (const branchReport of branchReports) {
      try {
        const projectId = branchReport.project_id
        const branchId = branchReport.branch_id

        if (!projectId || !branchId) {
          console.warn(`Skipping branch report ${branchReport.id}: missing project_id or branch_id`)
          continue
        }

        // Calculate KRI values
        const kriValues = calculateAllKRIValues(branchReport)

        console.log(`Processing: Project=${projectId}, Branch=${branchId}`)
        console.log(`  KRI Values:`, kriValues)

        // Check if Usage row exists for this (project_id + branch_id)
        const { data: existingUsage, error: checkError } = await supabase
          .from("Usage")
          .select("id")
          .eq("Project ID", projectId)
          .eq("Branch ID", branchId)
          .single()

        if (checkError && checkError.code !== "PGRST116") {
          console.error(`Error checking existing usage for ${projectId}/${branchId}:`, checkError)
          errorCount++
          continue
        }

        const updatePayload = {
          "Project ID": projectId,
          "Branch ID": branchId,
          created_at: branchReport.created_at,
          "KRI: SLOW ACCOUNT RATE_Value": kriValues.kriSlowAccountRateValue,
          "KRI: CHURN RATE_Value": kriValues.kriChurnRateValue,
          "KRI: DISBANDMENT RATE_Value": kriValues.kriDisbandmentRateValue,
          "KRI: LOAN APPLICATION DROPOUT RATE_Value": kriValues.kriLoanApplicationDropoutRateValue,
          "KRI: LOAN REJECTION RATE_Value": kriValues.kriLoanRejectionRateValue,
          "KRI: LOAN DELIQUENCY RATE_Value": kriValues.kriLoanDelinquencyRateValue,
          "KRI: LOAN DEFAULT RATE_Value": kriValues.kriLoanDefaultRateValue,
        }

        if (existingUsage) {
          // Update existing row
          const { error: updateError } = await supabase
            .from("Usage")
            .update(updatePayload)
            .eq("Project ID", projectId)
            .eq("Branch ID", branchId)

          if (updateError) {
            console.error(`Error updating usage for ${projectId}/${branchId}:`, updateError)
            errorCount++
          } else {
            console.log(`  ✓ Updated Usage row`)
            successCount++
          }
        } else {
          // Insert new row
          const { error: insertError } = await supabase.from("Usage").insert(updatePayload)

          if (insertError) {
            console.error(`Error inserting usage for ${projectId}/${branchId}:`, insertError)
            errorCount++
          } else {
            console.log(`  ✓ Inserted new Usage row`)
            successCount++
          }
        }
      } catch (error) {
        console.error(`Error processing branch report ${branchReport.id}:`, error)
        errorCount++
      }
    }

    console.log(`\n===== KRI Migration Complete =====`)
    console.log(`Successfully processed: ${successCount}`)
    console.log(`Errors: ${errorCount}`)
    console.log(`Total: ${branchReports.length}`)

    process.exit(errorCount > 0 ? 1 : 0)
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }
}

// Run migration
migrateKRIs()

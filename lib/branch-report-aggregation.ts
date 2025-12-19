"use server"

import { supabaseAdmin } from "./supabase-admin"

export async function aggregateFormToBranchReport(formId: string, branchId: string, formData: any, projectId?: string) {
  try {
    console.log("Aggregating form to branch report:", formId, "for branch:", branchId, "project:", projectId)

    if (!formId || !branchId || !formData) {
      return { success: false, error: "Missing required parameters for aggregation" }
    }

    // Fetch existing branch report
    const query = supabaseAdmin.from("branch_reports").select("*").eq("branch_id", branchId)

    // If projectId is provided, look for a report with that project_id
    if (projectId) {
      query.eq("project_id", projectId)
    }

    const { data: existingReports, error: fetchError } = await query.limit(1)

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching branch report:", fetchError)
      return { success: false, error: `Failed to fetch branch report: ${fetchError.message}` }
    }

    const existingReport = existingReports && existingReports.length > 0 ? existingReports[0] : null

    // Check if this form has already been aggregated
    if (existingReport?.aggregated_form_ids && existingReport.aggregated_form_ids.includes(formId)) {
      console.log("Form already aggregated, skipping")
      return { success: true, message: "Form already aggregated" }
    }

    // Extract numeric fields with safe parsing
    const parseNumber = (value: any, defaultValue = 0): number => {
      const parsed = typeof value === "string" ? Number.parseFloat(value) : Number(value)
      return isNaN(parsed) ? defaultValue : parsed
    }

    const parseInt = (value: any, defaultValue = 0): number => {
      const parsed = typeof value === "string" ? Number.parseInt(value, 10) : Number(value)
      return isNaN(parsed) ? defaultValue : parsed
    }

    // Numeric fields to aggregate
    const numericData = {
      num_mfis: parseInt(formData.num_mfis, 0),
      groups_bank_account: parseInt(formData.groups_bank_account, 0),
      members_bank_account: parseInt(formData.members_bank_account, 0),
      inactive_accounts: parseInt(formData.inactive_accounts, 0),
      num_insurers: parseInt(formData.num_insurers, 0),
      members_insurance: parseInt(formData.members_insurance, 0),
      borrowed_groups: parseInt(formData.borrowed_groups, 0),
      members_applying_loans: parseInt(formData.members_applying_loans, 0),
      loan_amount_applied: parseNumber(formData.loan_amount_applied, 0),
      loan_amount_approved: parseNumber(formData.loan_amount_approved, 0),
      members_received_loans: parseInt(formData.members_received_loans, 0),
      members_complaining_delay: parseInt(formData.members_complaining_delay, 0),
      loan_default: parseNumber(formData.loan_default, 0),
      loan_delinquency: parseNumber(formData.loan_delinquency, 0),
      loan_dropout: parseInt(formData.loan_dropout, 0),
      money_fraud: parseInt(formData.money_fraud, 0),
      number_of_groups: parseInt(formData.number_of_groups, 0),
      members_at_start: parseInt(formData.members_at_start, 0),
      members_at_end: parseInt(formData.members_at_end, 0),
      bros_at_start: parseInt(formData.bros_at_start, 0),
      bros_at_end: parseInt(formData.bros_at_end, 0),
    }

    // Text fields to concatenate
    const textFields = {
      loan_uses: formData.loan_uses || "",
      loan_cost_high: formData.loan_cost_high || "",
      explain_barriers: formData.explain_barriers || "",
    }

    // Additional numeric fields to sum
    const additionalNumericFields = {
      credit_sources: parseInt(formData.credit_sources, 0),
      trust_erosion: parseInt(formData.trust_erosion, 0),
      documentation_delay: parseInt(formData.documentation_delay, 0),
    }

    if (existingReport) {
      // Update existing report by adding new values
      const updates: any = {
        updated_at: new Date().toISOString(),
        aggregated_form_ids: [...(existingReport.aggregated_form_ids || []), formId],
        total_approved_forms: (existingReport.total_approved_forms || 0) + 1,
        last_aggregated_form_id: formId,
      }

      // Sum numeric fields
      Object.keys(numericData).forEach((field) => {
        const currentValue = existingReport[field] || 0
        const newValue = numericData[field as keyof typeof numericData]
        updates[field] = currentValue + newValue
      })

      // Sum additional numeric fields
      Object.keys(additionalNumericFields).forEach((field) => {
        const currentValue =
          typeof existingReport[field] === "string" ? parseInt(existingReport[field], 0) : existingReport[field] || 0
        const newValue = additionalNumericFields[field as keyof typeof additionalNumericFields]
        updates[field] = (currentValue + newValue).toString()
      })

      // Concatenate text fields with semicolon separator
      Object.keys(textFields).forEach((field) => {
        const currentValue = existingReport[field] || ""
        const newValue = textFields[field as keyof typeof textFields]
        if (newValue && newValue.trim()) {
          updates[field] = currentValue ? `${currentValue}; ${newValue}` : newValue
        }
      })

      console.log("Updating existing branch report with:", updates)

      const { error: updateError } = await supabaseAdmin
        .from("branch_reports")
        .update(updates)
        .eq("id", existingReport.id)

      if (updateError) {
        console.error("Error updating branch report:", updateError)
        return { success: false, error: `Failed to update branch report: ${updateError.message}` }
      }

      console.log("Branch report updated successfully")
      return { success: true, message: "Branch report updated successfully" }
    } else {
      // Create new branch report
      const newReport: any = {
        branch_id: branchId,
        project_id: projectId || null, // Include project_id in new reports
        title: `Branch Report - ${new Date().toISOString().split("T")[0]}`,
        form_type: "branch_report",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        aggregated_form_ids: [formId],
        total_approved_forms: 1,
        last_aggregated_form_id: formId,
        ...numericData,
        ...textFields,
      }

      const reportWithStringFields = {
        ...newReport,
        credit_sources: additionalNumericFields.credit_sources.toString(),
        trust_erosion: additionalNumericFields.trust_erosion.toString(),
        documentation_delay: additionalNumericFields.documentation_delay.toString(),
      }

      console.log("Creating new branch report with:", reportWithStringFields)

      const { error: insertError } = await supabaseAdmin.from("branch_reports").insert(reportWithStringFields)

      if (insertError) {
        console.error("Error creating branch report:", insertError)
        return { success: false, error: `Failed to create branch report: ${insertError.message}` }
      }

      console.log("Branch report created successfully")
      return { success: true, message: "Branch report created successfully" }
    }
  } catch (error: any) {
    console.error("Unexpected error in aggregateFormToBranchReport:", error)
    return { success: false, error: error.message || "An unexpected error occurred during aggregation" }
  }
}

export async function getBranchReportData(branchId: string, projectId?: string) {
  try {
    if (!branchId) {
      return { success: false, error: "Branch ID is required" }
    }

    let query = supabaseAdmin.from("branch_reports").select("*").eq("branch_id", branchId)

    if (projectId) {
      query = query.eq("project_id", projectId)
    }

    const { data, error } = await query.single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching branch report:", error)
      return { success: false, error: `Failed to fetch branch report: ${error.message}` }
    }

    return { success: true, data: data || null }
  } catch (error: any) {
    console.error("Unexpected error in getBranchReportData:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function resetBranchReport(branchId: string) {
  try {
    if (!branchId) {
      return { success: false, error: "Branch ID is required" }
    }

    const { error } = await supabaseAdmin.from("branch_reports").delete().eq("branch_id", branchId)

    if (error) {
      console.error("Error resetting branch report:", error)
      return { success: false, error: `Failed to reset branch report: ${error.message}` }
    }

    console.log("Branch report reset successfully")
    return { success: true, message: "Branch report reset successfully" }
  } catch (error: any) {
    console.error("Unexpected error in resetBranchReport:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function getAllBranchReports(projectId?: string) {
  try {
    let query = supabaseAdmin
      .from("branch_reports")
      .select(
        `
        *,
        branches (
          id,
          name,
          city
        ),
        projects (
          id,
          name
        )
      `,
      )
      .order("updated_at", { ascending: false })

    if (projectId) {
      query = query.eq("project_id", projectId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching all branch reports:", error)
      return { success: false, error: `Failed to fetch branch reports: ${error.message}` }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Unexpected error in getAllBranchReports:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export interface FormSubmission {
  id: string
  title: string
  form_type: string
  status: "draft" | "submitted" | "reviewed" | "approved" | "rejected"
  group_name: string
  location: string
  credit_sources: string
  num_mfis: number
  groups_bank_account: number
  members_bank_account: number
  inactive_accounts: number
  num_insurers: number
  members_insurance: number
  borrowed_groups: number
  members_applying_loans: number
  loan_amount_applied: number
  date_loan_applied: string | null
  loan_amount_approved: number
  members_received_loans: number
  date_loan_received: string | null
  members_complaining_delay: number
  loan_uses: string
  loan_default: number
  loan_delinquency: number
  loan_dropout: number
  money_fraud: number
  trust_erosion: string
  documentation_delay: string
  loan_cost_barriers: string
  number_of_groups: number
  members_at_start: number
  members_at_end: number
  bros_at_start: number
  bros_at_end: number
  created_by: string
  branch_id: string
  created_at: string
  updated_at: string
  submitted_at?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  tags?: string[]
  notes?: string
  version: number
  // Additional fields for joined data
  creator_name?: string
  creator_role?: string
  reviewer_name?: string
}

export interface FormActionResult {
  success: boolean
  data?: any
  error?: string
  code?: string
}

// Enhanced error handling utility
function handleError(error: any, operation: string): FormActionResult {
  console.error(`${operation} error:`, error)

  if (error?.code === "PGRST116") {
    return {
      success: false,
      error: "No data found.",
      code: "NOT_FOUND",
    }
  }

  if (error?.code === "23505") {
    return {
      success: false,
      error: "A form with this data already exists.",
      code: "DUPLICATE",
    }
  }

  if (error?.code === "23503") {
    return {
      success: false,
      error: "Invalid reference. Please check your branch assignment.",
      code: "FOREIGN_KEY",
    }
  }

  if (error?.message?.includes("permission denied")) {
    return {
      success: false,
      error: "You don't have permission to perform this action.",
      code: "PERMISSION_DENIED",
    }
  }

  if (error?.message?.includes("relationship") || error?.message?.includes("schema cache")) {
    return {
      success: false,
      error: "Database relationship error. Using fallback query.",
      code: "RELATIONSHIP_ERROR",
    }
  }

  return {
    success: false,
    error: error?.message || `Failed to ${operation.toLowerCase()}`,
    code: "UNKNOWN",
  }
}

// Validate user and get profile
async function validateUserAndGetProfile(userId: string): Promise<FormActionResult> {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, branch_id, role, status, full_name")
      .eq("id", userId)
      .single()

    if (error) {
      return handleError(error, "Get user profile")
    }

    if (!profile) {
      return {
        success: false,
        error: "User profile not found. Please contact administrator.",
        code: "PROFILE_NOT_FOUND",
      }
    }

    if (profile.status !== "active") {
      return {
        success: false,
        error: "Your account is not active. Please contact administrator.",
        code: "ACCOUNT_INACTIVE",
      }
    }

    if (!profile.branch_id) {
      return {
        success: false,
        error: "No branch assigned to your account. Please contact administrator.",
        code: "NO_BRANCH",
      }
    }

    return {
      success: true,
      data: profile,
    }
  } catch (error) {
    return handleError(error, "Validate user")
  }
}

// Prepare form data for database insertion/update
function prepareFormData(formData: any, profile: any, isSubmission = false): any {
  const baseData = {
    title: formData.group_name || "Draft Report",
    form_type: "financial_inclusion_report",
    group_name: formData.group_name || "",
    location: formData.location || "",
    credit_sources: formData.credit_sources || "",
    num_mfis: Number.parseInt(formData.num_mfis) || 0,
    groups_bank_account: Number.parseInt(formData.groups_bank_account) || 0,
    members_bank_account: Number.parseInt(formData.members_bank_account) || 0,
    inactive_accounts: Number.parseInt(formData.inactive_accounts) || 0,
    num_insurers: Number.parseInt(formData.num_insurers) || 0,
    members_insurance: Number.parseInt(formData.members_insurance) || 0,
    borrowed_groups: Number.parseInt(formData.borrowed_groups) || 0,
    members_applying_loans: Number.parseInt(formData.members_applying_loans) || 0,
    loan_amount_applied: Number.parseFloat(formData.loan_amount_applied) || 0,
    date_loan_applied: formData.date_loan_applied || null,
    loan_amount_approved: Number.parseFloat(formData.loan_amount_approved) || 0,
    members_received_loans: Number.parseInt(formData.members_received_loans) || 0,
    date_loan_received: formData.date_loan_received || null,
    members_complaining_delay: Number.parseInt(formData.members_complaining_delay) || 0,
    loan_uses: formData.loan_uses || "",
    loan_default: Number.parseFloat(formData.loan_default) || 0,
    loan_delinquency: Number.parseFloat(formData.loan_delinquency) || 0,
    loan_dropout: Number.parseInt(formData.loan_dropout) || 0,
    money_fraud: Number.parseInt(formData.money_fraud) || 0,
    trust_erosion: formData.trust_erosion || "",
    documentation_delay: formData.documentation_delay || "",
    loan_cost_barriers: formData.loan_cost_barriers || "",
    number_of_groups: Number.parseInt(formData.number_of_groups) || 0,
    members_at_start: Number.parseInt(formData.members_at_start) || 0,
    members_at_end: Number.parseInt(formData.members_at_end) || 0,
    bros_at_start: Number.parseInt(formData.bros_at_start) || 0,
    bros_at_end: Number.parseInt(formData.bros_at_end) || 0,
    status: isSubmission ? "submitted" : "draft",
    created_by: profile.id,
    branch_id: profile.branch_id,
    notes: formData.notes || "",
    tags: formData.tags || [],
  }

  return baseData
}

export async function saveDraftForm(userId: string, formData: any): Promise<FormActionResult> {
  try {
    console.log("Starting save draft operation for user:", userId)

    // Validate user and get profile
    const profileResult = await validateUserAndGetProfile(userId)
    if (!profileResult.success) {
      return profileResult
    }

    const profile = profileResult.data
    console.log("User profile validated:", profile.full_name)

    // Prepare form data
    const preparedData = prepareFormData(formData, profile, false)
    console.log("Form data prepared for save")

    let result

    if (formData.id) {
      // Update existing form
      console.log("Updating existing form:", formData.id)
      const { data, error } = await supabaseAdmin
        .from("form_submissions")
        .update(preparedData)
        .eq("id", formData.id)
        .eq("created_by", userId)
        .select()
        .single()

      if (error) {
        return handleError(error, "Update draft form")
      }

      result = data
    } else {
      // Create new form
      console.log("Creating new form")
      const { data, error } = await supabaseAdmin.from("form_submissions").insert(preparedData).select().single()

      if (error) {
        return handleError(error, "Create draft form")
      }

      result = data
    }

    console.log("Form saved successfully:", result.id)
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    return handleError(error, "Save draft form")
  }
}

export async function submitForm(userId: string, formData: any): Promise<FormActionResult> {
  try {
    console.log("Starting form submission for user:", userId)

    // Validate user and get profile
    const profileResult = await validateUserAndGetProfile(userId)
    if (!profileResult.success) {
      return profileResult
    }

    const profile = profileResult.data

    // Validate required fields for submission
    const requiredFields = ["group_name", "location", "credit_sources"]
    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === "") {
        return {
          success: false,
          error: `${field.replace("_", " ")} is required for submission.`,
          code: "VALIDATION_ERROR",
        }
      }
    }

    // Prepare form data for submission
    const preparedData = prepareFormData(formData, profile, true)
    console.log("Form data prepared for submission")

    let result

    if (formData.id) {
      // Update existing form to submitted status
      const { data, error } = await supabaseAdmin
        .from("form_submissions")
        .update(preparedData)
        .eq("id", formData.id)
        .eq("created_by", userId)
        .select()
        .single()

      if (error) {
        return handleError(error, "Submit form")
      }

      result = data
    } else {
      // Create new form with submitted status
      const { data, error } = await supabaseAdmin.from("form_submissions").insert(preparedData).select().single()

      if (error) {
        return handleError(error, "Submit form")
      }

      result = data
    }

    // Find Program Officer in the same branch to notify
    const { data: programOfficers } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("branch_id", profile.branch_id)
      .eq("role", "program_officer")
      .eq("status", "active")

    // Create notifications for Program Officers
    if (programOfficers && programOfficers.length > 0) {
      for (const po of programOfficers) {
        await createNotification(
          po.id,
          "New Form Submitted",
          `A new form "${result.group_name || result.title}" has been submitted by ${profile.full_name} and requires your review.`,
          "info",
          result.id,
        )
      }
    }

    console.log("Form submitted successfully:", result.id)
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    return handleError(error, "Submit form")
  }
}

export async function getFormsByUser(userId: string): Promise<FormActionResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .select("*")
      .eq("created_by", userId)
      .order("updated_at", { ascending: false })

    if (error) {
      return handleError(error, "Get user forms")
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    return handleError(error, "Get user forms")
  }
}

export async function getFormsByBranch(branchId: string, status?: string): Promise<FormActionResult> {
  try {
    // First try using the view if it exists
    let query = supabaseAdmin.from("form_submissions_with_profiles").select("*").eq("branch_id", branchId)

    if (status) {
      query = query.eq("status", status)
    } else {
      query = query.in("status", ["submitted", "reviewed", "approved"])
    }

    const { data: viewData, error: viewError } = await query.order("submitted_at", { ascending: false })

    if (!viewError && viewData) {
      return {
        success: true,
        data: viewData || [],
      }
    }

    // Fallback: Get forms first, then get creator names separately
    console.log("View query failed, using fallback approach")

    let fallbackQuery = supabaseAdmin.from("form_submissions").select("*").eq("branch_id", branchId)

    if (status) {
      fallbackQuery = fallbackQuery.eq("status", status)
    } else {
      fallbackQuery = fallbackQuery.in("status", ["submitted", "reviewed", "approved"])
    }

    const { data: forms, error: formsError } = await fallbackQuery.order("submitted_at", { ascending: false })

    if (formsError) {
      return handleError(formsError, "Get branch forms")
    }

    // Get creator names for each form
    const formsWithCreators = await Promise.all(
      (forms || []).map(async (form) => {
        try {
          const { data: creator } = await supabaseAdmin
            .from("profiles")
            .select("full_name, role")
            .eq("id", form.created_by)
            .single()

          return {
            ...form,
            creator_name: creator?.full_name || "Unknown User",
            creator_role: creator?.role || "unknown",
            profiles: creator ? { full_name: creator.full_name, role: creator.role } : null,
          }
        } catch (error) {
          console.error("Error fetching creator for form:", form.id, error)
          return {
            ...form,
            creator_name: "Unknown User",
            creator_role: "unknown",
            profiles: null,
          }
        }
      }),
    )

    return {
      success: true,
      data: formsWithCreators,
    }
  } catch (error) {
    return handleError(error, "Get branch forms")
  }
}

export async function getFormById(formId: string, userId: string): Promise<FormActionResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .select("*")
      .eq("id", formId)
      .eq("created_by", userId)
      .single()

    if (error) {
      return handleError(error, "Get form")
    }

    return {
      success: true,
      data: data,
    }
  } catch (error) {
    return handleError(error, "Get form")
  }
}

export async function deleteForm(formId: string, userId: string): Promise<FormActionResult> {
  try {
    const { error } = await supabaseAdmin
      .from("form_submissions")
      .delete()
      .eq("id", formId)
      .eq("created_by", userId)
      .eq("status", "draft") // Only allow deletion of drafts

    if (error) {
      return handleError(error, "Delete form")
    }

    return {
      success: true,
      data: { message: "Form deleted successfully" },
    }
  } catch (error) {
    return handleError(error, "Delete form")
  }
}

export async function searchForms(
  userId: string,
  searchParams: {
    searchTerm?: string
    dateFrom?: string
    dateTo?: string
    groupFilter?: string
    status?: string
  },
): Promise<FormActionResult> {
  try {
    // Get user profile to determine role and branch
    const profileResult = await validateUserAndGetProfile(userId)
    if (!profileResult.success) {
      return profileResult
    }

    const profile = profileResult.data

    // Use the search function if it exists, otherwise fallback to simple query
    try {
      const { data, error } = await supabaseAdmin.rpc("search_forms", {
        search_term: searchParams.searchTerm || "",
        filter_branch_id: profile.branch_id,
        filter_status: searchParams.status || "",
        filter_date_from: searchParams.dateFrom || null,
        filter_date_to: searchParams.dateTo || null,
        user_role: profile.role,
        user_id: userId,
      })

      if (!error && data) {
        return {
          success: true,
          data: data || [],
        }
      }
    } catch (rpcError) {
      console.log("RPC search function not available, using fallback")
    }

    // Fallback to simple query
    let query = supabaseAdmin.from("form_submissions").select("*").eq("branch_id", profile.branch_id)

    if (searchParams.status) {
      query = query.eq("status", searchParams.status)
    }

    if (searchParams.searchTerm) {
      query = query.or(`title.ilike.%${searchParams.searchTerm}%,group_name.ilike.%${searchParams.searchTerm}%`)
    }

    const { data, error } = await query.order("updated_at", { ascending: false })

    if (error) {
      return handleError(error, "Search forms")
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    return handleError(error, "Search forms")
  }
}

export async function getFormStatistics(branchId: string): Promise<FormActionResult> {
  try {
    // Try to use the view first
    const { data: viewData, error: viewError } = await supabaseAdmin
      .from("form_statistics")
      .select("*")
      .eq("branch_id", branchId)
      .single()

    if (!viewError && viewData) {
      return {
        success: true,
        data: viewData,
      }
    }

    // Fallback: Calculate statistics manually
    const { data: forms, error: formsError } = await supabaseAdmin
      .from("form_submissions")
      .select("*")
      .eq("branch_id", branchId)

    if (formsError && formsError.code !== "PGRST116") {
      return handleError(formsError, "Get form statistics")
    }

    const formsList = forms || []
    const statistics = {
      total_forms: formsList.length,
      draft_forms: formsList.filter((f) => f.status === "draft").length,
      submitted_forms: formsList.filter((f) => f.status === "submitted").length,
      reviewed_forms: formsList.filter((f) => f.status === "reviewed").length,
      approved_forms: formsList.filter((f) => f.status === "approved").length,
      avg_members:
        formsList.length > 0 ? formsList.reduce((sum, f) => sum + (f.members_at_end || 0), 0) / formsList.length : 0,
      total_loan_applied: formsList.reduce((sum, f) => sum + (f.loan_amount_applied || 0), 0),
      total_loan_approved: formsList.reduce((sum, f) => sum + (f.loan_amount_approved || 0), 0),
    }

    return {
      success: true,
      data: statistics,
    }
  } catch (error) {
    return handleError(error, "Get form statistics")
  }
}

export async function sendFormBack(
  formId: string,
  programOfficerId: string,
  reason: string,
): Promise<FormActionResult> {
  try {
    // Get the form to check permissions and get creator info
    const { data: form, error: formError } = await supabaseAdmin
      .from("form_submissions")
      .select("*")
      .eq("id", formId)
      .single()

    if (formError || !form) {
      return handleError(formError, "Get form for send back")
    }

    // Get creator info separately
    const { data: creator } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", form.created_by)
      .single()

    // Update form status to draft and add reason
    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .update({
        status: "draft",
        notes: form.notes
          ? `${form.notes}\n\nSent back by Program Officer: ${reason}`
          : `Sent back by Program Officer: ${reason}`,
        reviewed_by: programOfficerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", formId)
      .select()
      .single()

    if (error) {
      return handleError(error, "Send form back")
    }

    // Create notification for Branch Report Officer
    await createNotification(
      form.created_by,
      "Form Sent Back for Revision",
      `Your form "${form.group_name || form.title}" has been sent back by the Program Officer for revision. Reason: ${reason}`,
      "warning",
      formId,
    )

    return { success: true, data }
  } catch (error) {
    return handleError(error, "Send form back")
  }
}

export async function updateFormByProgramOfficer(
  formId: string,
  programOfficerId: string,
  formData: any,
): Promise<FormActionResult> {
  try {
    // Get the form to check permissions and get creator info
    const { data: form, error: formError } = await supabaseAdmin
      .from("form_submissions")
      .select("*")
      .eq("id", formId)
      .single()

    if (formError || !form) {
      return handleError(formError, "Get form for update")
    }

    // Prepare the updated data
    const updatedData = {
      ...formData,
      reviewed_by: programOfficerId,
      reviewed_at: new Date().toISOString(),
      notes: form.notes ? `${form.notes}\n\nEdited by Program Officer` : "Edited by Program Officer",
    }

    // Update the form
    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .update(updatedData)
      .eq("id", formId)
      .select()
      .single()

    if (error) {
      return handleError(error, "Update form by Program Officer")
    }

    // Create notification for Branch Report Officer
    await createNotification(
      form.created_by,
      "Form Updated by Program Officer",
      `Your form "${form.group_name || form.title}" has been updated by the Program Officer. Please review the changes.`,
      "info",
      formId,
    )

    return { success: true, data }
  } catch (error) {
    return handleError(error, "Update form by Program Officer")
  }
}

export async function approveForm(formId: string, programOfficerId: string): Promise<FormActionResult> {
  try {
    // Get the form to check permissions and get creator info
    const { data: form, error: formError } = await supabaseAdmin
      .from("form_submissions")
      .select("*")
      .eq("id", formId)
      .single()

    if (formError || !form) {
      return handleError(formError, "Get form for approval")
    }

    // Update form status to approved
    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .update({
        status: "approved",
        reviewed_by: programOfficerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", formId)
      .select()
      .single()

    if (error) {
      return handleError(error, "Approve form")
    }

    // Create notification for Branch Report Officer
    await createNotification(
      form.created_by,
      "Form Approved",
      `Your form "${form.group_name || form.title}" has been approved by the Program Officer.`,
      "success",
      formId,
    )

    return { success: true, data }
  } catch (error) {
    return handleError(error, "Approve form")
  }
}

// Helper function to create notifications
async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: "success" | "info" | "warning" | "error",
  formId: string,
): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: title,
      message: message,
      type: type,
      form_id: formId,
      read: false,
    })

    if (error) {
      console.error("Error creating notification:", error)
    }
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}

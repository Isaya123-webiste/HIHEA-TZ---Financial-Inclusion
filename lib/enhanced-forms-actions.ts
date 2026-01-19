"use server"

import { supabaseAdmin } from "./supabase-admin"
import { revalidatePath } from "next/cache"
import { aggregateFormToBranchReport } from "./branch-report-aggregation"

// Form submission interface with extracted fields
export interface FormSubmission {
  id: string
  user_id: string
  branch_id: string | null
  form_type: string
  form_data: any
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "sent_back"
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  review_notes: string | null
  created_at: string
  updated_at: string
  notes?: string
  title?: string
  group_name?: string
  location?: string
  creator_name?: string
  credit_sources?: string
  num_mfis?: number
  groups_bank_account?: number
  members_bank_account?: number
  inactive_accounts?: number
  num_insurers?: number
  members_insurance?: number
  borrowed_groups?: number
  members_applying_loans?: number
  loan_amount_applied?: number
  date_loan_applied?: string
  loan_amount_approved?: number
  members_received_loans?: number
  date_loan_received?: string
  members_complaining_delay?: number
  loan_uses?: string
  loan_default?: number
  loan_delinquency?: number
  loan_dropout?: number
  money_fraud?: number
  trust_erosion?: string
  documentation_delay?: string
  loan_cost_high?: number // Changed from string to number
  explain_barriers?: string
  number_of_groups?: number
  members_at_start?: number
  members_at_end?: number
  bros_at_start?: number
  bros_at_end?: number
  profiles?: {
    full_name: string
    email: string
  }
  branches?: {
    name: string
  }
}

// Helper function to extract form fields from form_data JSONB
function extractFormFields(formData: any): any {
  if (!formData) return {}

  return {
    credit_sources: formData.credit_sources || null,
    num_mfis: formData.num_mfis || 0,
    groups_bank_account: formData.groups_bank_account || 0,
    members_bank_account: formData.members_bank_account || 0,
    inactive_accounts: formData.inactive_accounts || 0,
    num_insurers: formData.num_insurers || 0,
    members_insurance: formData.members_insurance || 0,
    borrowed_groups: formData.borrowed_groups || 0,
    members_applying_loans: formData.members_applying_loans || 0,
    loan_amount_applied: formData.loan_amount_applied || 0,
    date_loan_applied: formData.date_loan_applied || null,
    loan_amount_approved: formData.loan_amount_approved || 0,
    members_received_loans: formData.members_received_loans || 0,
    date_loan_received: formData.date_loan_received || null,
    members_complaining_delay: formData.members_complaining_delay || 0,
    loan_uses: formData.loan_uses || null,
    loan_default: formData.loan_default || 0,
    loan_delinquency: formData.loan_delinquency || 0,
    loan_dropout: formData.loan_dropout || 0,
    money_fraud: formData.money_fraud || 0,
    trust_erosion: formData.trust_erosion || null,
    documentation_delay: formData.documentation_delay || null,
    loan_cost_high: formData.loan_cost_high || 0, // Changed from string to number
    explain_barriers: formData.explain_barriers || null,
    number_of_groups: formData.number_of_groups || 0,
    members_at_start: formData.members_at_start || 0,
    members_at_end: formData.members_at_end || 0,
    bros_at_start: formData.bros_at_start || 0,
    bros_at_end: formData.bros_at_end || 0,
  }
}

// Get forms by user
export async function getFormsByUser(userId: string) {
  try {
    console.log("Fetching forms for user:", userId)

    if (!userId) {
      console.error("No user ID provided")
      return { success: false, error: "User ID is required" }
    }

    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .select(
        "id, user_id, branch_id, form_type, form_data, status, submitted_at, reviewed_at, reviewed_by, review_notes, created_at, updated_at, group_name, location, title, notes",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching forms by user:", error)
      return { success: false, error: `Failed to fetch forms: ${error.message}` }
    }

    // Transform the data to match the expected format
    const transformedData = (data || []).map((item: any) => {
      const formFields = extractFormFields(item.form_data)

      return {
        id: item.id,
        user_id: item.user_id,
        branch_id: item.branch_id,
        form_type: item.form_type || "branch_report",
        form_data: item.form_data || {},
        status: item.status || "draft",
        submitted_at: item.submitted_at,
        reviewed_at: item.reviewed_at,
        reviewed_by: item.reviewed_by,
        review_notes: item.review_notes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        notes: item.notes || item.review_notes || "",
        group_name: item.group_name || item.form_data?.group_name || "Unknown Group",
        location: item.location || item.form_data?.location || "",
        title: item.title || item.form_data?.title || "Form Submission",
        creator_name: "Branch Report Officer",
        reviewed: false, // Set reviewed to false by default until is_read column is added
        ...formFields,
      }
    })

    console.log("Successfully fetched forms for user:", transformedData.length)
    return { success: true, data: transformedData }
  } catch (error) {
    console.error("Unexpected error in getFormsByUser:", error)
    return { success: false, error: "An unexpected error occurred while fetching forms" }
  }
}

// Get forms by branch (for Program Officer)
export async function getFormsByBranch(branchId: string) {
  try {
    console.log("Fetching forms for branch:", branchId)

    if (!branchId) {
      console.error("No branch ID provided")
      return { success: false, error: "Branch ID is required" }
    }

    const { data: formData, error: formError } = await supabaseAdmin
      .from("form_submissions")
      .select(
        "id, user_id, branch_id, form_type, form_data, status, submitted_at, reviewed_at, reviewed_by, review_notes, created_at, updated_at, group_name, location, title, notes",
      )
      .eq("branch_id", branchId)
      .order("created_at", { ascending: false })

    if (formError) {
      console.error("Error fetching forms by branch:", formError)
      return { success: false, error: `Failed to fetch forms: ${formError.message}` }
    }

    let additionalForms: any[] = []
    if (!formData || formData.length === 0) {
      const { data: branchUsers, error: usersError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("branch_id", branchId)

      if (!usersError && branchUsers) {
        const userIds = branchUsers.map((u) => u.id)

        if (userIds.length > 0) {
          const { data: userForms, error: userFormsError } = await supabaseAdmin
            .from("form_submissions")
            .select(
              "id, user_id, branch_id, form_type, form_data, status, submitted_at, reviewed_at, reviewed_by, review_notes, created_at, updated_at, group_name, location, title, notes",
            )
            .in("user_id", userIds)

          if (!userFormsError && userForms) {
            additionalForms = userForms
          }
        }
      }
    }

    const allFormData = [...(formData || []), ...additionalForms]

    const userIds = [...new Set(allFormData.map((form: any) => form.user_id).filter(Boolean))]
    let profilesMap: Record<string, any> = {}

    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, role, branch_id")
        .in("id", userIds)

      if (!profilesError && profilesData) {
        profilesMap = profilesData.reduce((acc: Record<string, any>, profile: any) => {
          acc[profile.id] = profile
          return acc
        }, {})
      }
    }

    const transformedData = allFormData.map((item: any) => {
      const userProfile = profilesMap[item.user_id]
      const formFields = extractFormFields(item.form_data)

      const isReviewed = !!(item.reviewed_at || item.reviewed_by)

      return {
        id: item.id,
        user_id: item.user_id,
        branch_id: item.branch_id,
        form_type: item.form_type || "branch_report",
        form_data: item.form_data || {},
        status: item.status || "draft",
        submitted_at: item.submitted_at,
        reviewed_at: item.reviewed_at,
        reviewed_by: item.reviewed_by,
        review_notes: item.review_notes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        notes: item.notes || item.review_notes || "",
        group_name: item.group_name || item.form_data?.group_name || "Unknown Group",
        location: item.location || item.form_data?.location || "",
        title: item.title || item.form_data?.title || "Form Submission",
        creator_name: userProfile?.full_name || "Branch Report Officer",
        reviewed: isReviewed, // Now properly checks if form has been reviewed
        ...formFields,
        profiles: userProfile
          ? {
              full_name: userProfile.full_name,
              email: userProfile.email,
            }
          : undefined,
      }
    })

    console.log("Successfully fetched forms for branch:", transformedData.length)
    return { success: true, data: transformedData }
  } catch (error) {
    console.error("Unexpected error in getFormsByBranch:", error)
    return { success: false, error: "An unexpected error occurred while fetching forms" }
  }
}

// Get form by ID
export async function getFormById(formId: string, userId: string) {
  try {
    console.log("Fetching form by ID:", formId, "for user:", userId)

    if (!formId || !userId) {
      return { success: false, error: "Form ID and User ID are required" }
    }

    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .select(
        "id, user_id, branch_id, form_type, form_data, status, submitted_at, reviewed_at, reviewed_by, review_notes, created_at, updated_at, group_name, location, title, notes",
      )
      .eq("id", formId)
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("Error fetching form by ID:", error)
      return { success: false, error: `Failed to fetch form: ${error.message}` }
    }

    if (!data) {
      return { success: false, error: "Form not found" }
    }

    const formFields = extractFormFields(data.form_data)

    const transformedData = {
      id: data.id,
      user_id: data.user_id,
      branch_id: data.branch_id,
      form_type: data.form_type || "branch_report",
      form_data: data.form_data || {},
      status: data.status || "draft",
      submitted_at: data.submitted_at,
      reviewed_at: data.reviewed_at,
      reviewed_by: data.reviewed_by,
      review_notes: data.review_notes,
      created_at: data.created_at,
      updated_at: data.updated_at,
      notes: data.notes || data.review_notes || "",
      group_name: data.group_name || data.form_data?.group_name || "Unknown Group",
      location: data.location || data.form_data?.location || "",
      title: data.title || data.form_data?.title || "Form Submission",
      creator_name: "Branch Report Officer",
      reviewed: false, // Set reviewed to false by default until is_read column is added
      ...formFields,
      profiles: data.profiles
        ? {
            full_name: data.profiles.full_name,
            email: data.profiles.email,
          }
        : undefined,
    }

    console.log("Successfully fetched form by ID")
    return { success: true, data: transformedData }
  } catch (error) {
    console.error("Unexpected error in getFormById:", error)
    return { success: false, error: "An unexpected error occurred while fetching form" }
  }
}

// Save draft form
export async function saveDraftForm(userId: string, formData: any) {
  try {
    console.log("Saving draft form for user:", userId)

    if (!userId) {
      return { success: false, error: "User ID is required" }
    }

    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("branch_id")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("Error fetching user profile:", profileError)
      return { success: false, error: "Failed to get user profile" }
    }

    const formId = formData.id
    const projectId = formData.project_id
    delete formData.id
    delete formData.project_id

    const submissionData = {
      user_id: userId,
      branch_id: userProfile?.branch_id || null,
      project_id: projectId || null,
      form_type: "branch_report",
      form_data: formData,
      status: "draft" as const,
      updated_at: new Date().toISOString(),
      group_name: formData.group_name || null,
      location: formData.location || null,
      title: formData.title || `Financial Inclusion Report - ${formData.group_name || "Draft"}`,
      notes: formData.notes || null,
      created_by: userId,
    }

    if (formId) {
      const { data, error } = await supabaseAdmin
        .from("form_submissions")
        .update(submissionData)
        .eq("id", formId)
        .eq("user_id", userId)
        .select()
        .single()

      if (error) {
        console.error("Error updating draft:", error)
        return { success: false, error: `Failed to update draft: ${error.message}` }
      }

      console.log("Draft updated successfully")
      return { success: true, data }
    } else {
      const { data, error } = await supabaseAdmin
        .from("form_submissions")
        .insert({
          ...submissionData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating draft:", error)
        return { success: false, error: `Failed to create draft: ${error.message}` }
      }

      console.log("Draft created successfully")
      return { success: true, data }
    }
  } catch (error) {
    console.error("Unexpected error in saveDraftForm:", error)
    return { success: false, error: "An unexpected error occurred while saving draft" }
  }
}

// Submit form
export async function submitForm(userId: string, formData: any) {
  try {
    console.log("Submitting form for user:", userId)

    if (!userId) {
      return { success: false, error: "User ID is required" }
    }

    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("branch_id")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("Error fetching user profile:", profileError)
      return { success: false, error: "Failed to get user profile" }
    }

    const formId = formData.id
    const projectId = formData.project_id
    delete formData.id
    delete formData.project_id

    const submissionData = {
      user_id: userId,
      branch_id: userProfile?.branch_id || null,
      project_id: projectId || null,
      form_type: "branch_report",
      form_data: formData,
      status: "submitted" as const,
      submitted_at: new Date().toISOString(),
      submitted_by: userId,
      updated_at: new Date().toISOString(),
      group_name: formData.group_name || null,
      location: formData.location || null,
      title: formData.title || `Financial Inclusion Report - ${formData.group_name}`,
      notes: formData.notes || null,
      created_by: userId,
      // Extract date fields from formData
      date_loan_applied: formData.date_loan_applied ? formData.date_loan_applied : null,
      date_loan_received: formData.date_loan_received ? formData.date_loan_received : null,
      // Extract numeric fields from formData
      num_mfis: formData.num_mfis ? parseInt(formData.num_mfis) || 0 : 0,
      groups_bank_account: formData.groups_bank_account ? parseInt(formData.groups_bank_account) || 0 : 0,
      members_bank_account: formData.members_bank_account ? parseInt(formData.members_bank_account) || 0 : 0,
      inactive_accounts: formData.inactive_accounts ? parseInt(formData.inactive_accounts) || 0 : 0,
      num_insurers: formData.num_insurers ? parseInt(formData.num_insurers) || 0 : 0,
      members_insurance: formData.members_insurance ? parseInt(formData.members_insurance) || 0 : 0,
      borrowed_groups: formData.borrowed_groups ? parseInt(formData.borrowed_groups) || 0 : 0,
      members_applying_loans: formData.members_applying_loans ? parseInt(formData.members_applying_loans) || 0 : 0,
      loan_amount_applied: formData.loan_amount_applied ? parseFloat(formData.loan_amount_applied) || 0 : 0,
      loan_amount_approved: formData.loan_amount_approved ? parseFloat(formData.loan_amount_approved) || 0 : 0,
      members_received_loans: formData.members_received_loans ? parseInt(formData.members_received_loans) || 0 : 0,
      members_complaining_delay: formData.members_complaining_delay ? parseInt(formData.members_complaining_delay) || 0 : 0,
      loan_default: formData.loan_default ? parseInt(formData.loan_default) || 0 : 0,
      loan_delinquency: formData.loan_delinquency ? parseInt(formData.loan_delinquency) || 0 : 0,
      loan_dropout: formData.loan_dropout ? parseInt(formData.loan_dropout) || 0 : 0,
      money_fraud: formData.money_fraud ? parseFloat(formData.money_fraud) || 0 : 0,
      number_of_groups: formData.number_of_groups ? parseInt(formData.number_of_groups) || 0 : 0,
      members_at_start: formData.members_at_start ? parseInt(formData.members_at_start) || 0 : 0,
      members_at_end: formData.members_at_end ? parseInt(formData.members_at_end) || 0 : 0,
      bros_at_start: formData.bros_at_start ? parseInt(formData.bros_at_start) || 0 : 0,
      bros_at_end: formData.bros_at_end ? parseInt(formData.bros_at_end) || 0 : 0,
      credit_sources: formData.credit_sources || null,
      loan_uses: formData.loan_uses || null,
      trust_erosion: formData.trust_erosion || null,
      documentation_delay: formData.documentation_delay || null,
      loan_cost_high: formData.loan_cost_high ? parseInt(formData.loan_cost_high) || 0 : 0,
      explain_barriers: formData.explain_barriers || null,
    }

    if (formId) {
      const { data, error } = await supabaseAdmin
        .from("form_submissions")
        .update(submissionData)
        .eq("id", formId)
        .eq("user_id", userId)
        .select()
        .single()

      if (error) {
        console.error("Error submitting form:", error)
        return { success: false, error: `Failed to submit form: ${error.message}` }
      }

      console.log("Form submitted successfully")
      return { success: true, data }
    } else {
      const { data, error } = await supabaseAdmin
        .from("form_submissions")
        .insert({
          ...submissionData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Error submitting form:", error)
        return { success: false, error: `Failed to submit form: ${error.message}` }
      }

      console.log("Form submitted successfully")
      return { success: true, data }
    }
  } catch (error) {
    console.error("Unexpected error in submitForm:", error)
    return { success: false, error: "An unexpected error occurred while submitting form" }
  }
}

// Delete form
export async function deleteForm(formId: string, userId: string) {
  try {
    console.log("Deleting form:", formId, "for user:", userId)

    if (!formId || !userId) {
      return { success: false, error: "Form ID and User ID are required" }
    }

    const { error } = await supabaseAdmin
      .from("form_submissions")
      .delete()
      .eq("id", formId)
      .eq("user_id", userId)
      .eq("status", "draft")

    if (error) {
      console.error("Error deleting form:", error)
      return { success: false, error: `Failed to delete form: ${error.message}` }
    }

    console.log("Form deleted successfully")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error in deleteForm:", error)
    return { success: false, error: "An unexpected error occurred while deleting form" }
  }
}

// Search forms
export async function searchForms(
  userId: string,
  filters: {
    searchTerm?: string
    dateFrom?: string
    groupFilter?: string
    status?: string
  },
) {
  try {
    console.log("Searching forms for user:", userId, "with filters:", filters)

    if (!userId) {
      return { success: false, error: "User ID is required" }
    }

    let query = supabaseAdmin
      .from("form_submissions")
      .select(
        "id, user_id, branch_id, form_type, form_data, status, submitted_at, reviewed_at, reviewed_by, review_notes, created_at, updated_at, group_name, location, title, notes",
      )
      .eq("user_id", userId)

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    if (filters.dateFrom) {
      query = query.gte("created_at", filters.dateFrom)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error searching forms:", error)
      return { success: false, error: `Failed to search forms: ${error.message}` }
    }

    let filteredData = data || []

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filteredData = filteredData.filter((item: any) => {
        const groupName = item.group_name || item.form_data?.group_name || ""
        const location = item.location || item.form_data?.location || ""
        const title = item.title || item.form_data?.title || ""

        return (
          groupName.toLowerCase().includes(searchLower) ||
          location.toLowerCase().includes(searchLower) ||
          title.toLowerCase().includes(searchLower)
        )
      })
    }

    if (filters.groupFilter) {
      const groupLower = filters.groupFilter.toLowerCase()
      filteredData = filteredData.filter((item: any) => {
        const groupName = item.group_name || item.form_data?.group_name || ""
        return groupName.toLowerCase().includes(groupLower)
      })
    }

    const transformedData = filteredData.map((item: any) => {
      const formFields = extractFormFields(item.form_data)

      return {
        id: item.id,
        user_id: item.user_id,
        branch_id: item.branch_id,
        form_type: item.form_type || "branch_report",
        form_data: item.form_data || {},
        status: item.status || "draft",
        submitted_at: item.submitted_at,
        reviewed_at: item.reviewed_at,
        reviewed_by: item.reviewed_by,
        review_notes: item.review_notes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        notes: item.notes || item.review_notes || "",
        group_name: item.group_name || item.form_data?.group_name || "Unknown Group",
        location: item.location || item.form_data?.location || "",
        title: item.title || item.form_data?.title || "Form Submission",
        creator_name: "Branch Report Officer",
        reviewed: false, // Set reviewed to false by default until is_read column is added
        ...formFields,
        profiles: item.profiles
          ? {
              full_name: item.profiles.full_name,
              email: item.profiles.email,
            }
          : undefined,
      }
    })

    console.log("Successfully searched forms:", transformedData.length)
    return { success: true, data: transformedData }
  } catch (error) {
    console.error("Unexpected error in searchForms:", error)
    return { success: false, error: "An unexpected error occurred while searching forms" }
  }
}

// Approve form and aggregate to branch reports
export async function approveForm(formId: string, programOfficerId: string) {
  try {
    console.log("Approving form:", formId, "by program officer:", programOfficerId)

    if (!formId || !programOfficerId) {
      return { success: false, error: "Form ID and Program Officer ID are required" }
    }

    // First, fetch the form data before updating
    const { data: formData, error: fetchError } = await supabaseAdmin
      .from("form_submissions")
      .select("id, branch_id, form_data, status, project_id")
      .eq("id", formId)
      .single()

    if (fetchError || !formData) {
      console.error("Error fetching form for approval:", fetchError)
      return { success: false, error: `Failed to fetch form data: ${fetchError?.message || "Form not found"}` }
    }

    // Check if already approved
    if (formData.status === "approved") {
      console.log("Form already approved, skipping")
      return { success: true, message: "Form is already approved" }
    }

    // Update form status to approved
    const { data: updatedForm, error: updateError } = await supabaseAdmin
      .from("form_submissions")
      .update({
        status: "approved",
        reviewed_by: programOfficerId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", formId)
      .select()
      .single()

    if (updateError) {
      console.error("Error approving form:", updateError)
      return { success: false, error: `Failed to approve form: ${updateError.message}` }
    }

    console.log("Form approved successfully, status updated to:", updatedForm.status)

    // Now aggregate to branch report
    if (formData.branch_id && formData.form_data) {
      console.log(
        "Starting aggregation to branch report for branch:",
        formData.branch_id,
        "project:",
        formData.project_id,
      )
      const aggregationResult = await aggregateFormToBranchReport(
        formId,
        formData.branch_id,
        formData.form_data,
        formData.project_id || undefined,
      )

      if (!aggregationResult.success) {
        console.error("Error aggregating to branch report:", aggregationResult.error)
        console.warn("⚠️ Form approved but aggregation failed:", aggregationResult.error)
        // Don't fail the approval, just log the warning
      } else {
        console.log("✓ Form successfully aggregated to branch report")
      }
    } else {
      console.warn("⚠️ Form has no branch_id or form_data, skipping aggregation")
    }

    revalidatePath("/program-officer/forms")
    revalidatePath("/branch-report-officer/forms")
    return { success: true, data: updatedForm }
  } catch (error: any) {
    console.error("Unexpected error in approveForm:", error)
    return { success: false, error: `An unexpected error occurred while approving form: ${error.message}` }
  }
}

// Send form back
export async function sendFormBack(formId: string, programOfficerId: string, reason: string) {
  try {
    console.log("Sending form back:", formId, "with reason:", reason)

    if (!formId || !programOfficerId || !reason) {
      return { success: false, error: "Form ID, Program Officer ID, and reason are required" }
    }

    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .update({
        status: "sent_back",
        reviewed_by: programOfficerId,
        reviewed_at: new Date().toISOString(),
        review_notes: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", formId)
      .select()
      .single()

    if (error) {
      console.error("Error sending form back:", error)
      return { success: false, error: `Failed to send form back: ${error.message}` }
    }

    console.log("Form sent back successfully")
    revalidatePath("/program-officer/forms")
    revalidatePath("/branch-report-officer/forms")
    return { success: true, data }
  } catch (error) {
    console.error("Unexpected error in sendFormBack:", error)
    return { success: false, error: "An unexpected error occurred while sending form back" }
  }
}

// Update form by program officer
export async function updateFormByProgramOfficer(formId: string, programOfficerId: string, formData: any) {
  try {
    console.log("Program officer updating form:", formId)

    if (!formId || !programOfficerId) {
      return { success: false, error: "Form ID and Program Officer ID are required" }
    }

    const updateData = {
      form_data: formData,
      updated_at: new Date().toISOString(),
      group_name: formData.group_name || null,
      location: formData.location || null,
      notes: formData.notes || null,
    }

    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .update(updateData)
      .eq("id", formId)
      .select()
      .single()

    if (error) {
      console.error("Error updating form by program officer:", error)
      return { success: false, error: `Failed to update form: ${error.message}` }
    }

    console.log("Form updated successfully by program officer")
    revalidatePath("/program-officer/forms")
    return { success: true, data }
  } catch (error) {
    console.error("Unexpected error in updateFormByProgramOfficer:", error)
    return { success: false, error: "An unexpected error occurred while updating form" }
  }
}

// Get form statistics
export async function getFormStatistics(branchId: string) {
  try {
    if (!branchId) {
      return { success: false, error: "Branch ID is required" }
    }

    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .select("form_data, status")
      .eq("branch_id", branchId)

    if (error) {
      return { success: false, error: `Failed to fetch statistics: ${error.message}` }
    }

    const forms = data || []

    const statistics = {
      total_forms: forms.length,
      submitted_forms: forms.filter((f) => f.status === "submitted").length,
      approved_forms: forms.filter((f) => f.status === "approved").length,
      draft_forms: forms.filter((f) => f.status === "draft").length,
      avg_members:
        forms.length > 0
          ? Math.round(forms.reduce((sum, f) => sum + (f.form_data?.members_at_end || 0), 0) / forms.length)
          : 0,
      total_loan_applied: forms.reduce((sum, f) => sum + (f.form_data?.loan_amount_applied || 0), 0),
      total_loan_approved: forms.reduce((sum, f) => sum + (f.form_data?.loan_amount_approved || 0), 0),
      total_groups: forms.reduce((sum, f) => sum + (f.form_data?.number_of_groups || 0), 0),
    }

    return { success: true, data: statistics }
  } catch (error) {
    return { success: false, error: "An unexpected error occurred while fetching statistics" }
  }
}

// Mark form as read function for assistance program officer
export async function markFormAsRead(formId: string, officerId: string) {
  try {
    console.log("[v0] Marking form as read:", formId, "by officer:", officerId)

    if (!formId || !officerId) {
      return { success: false, error: "Form ID and Officer ID are required" }
    }

    // For now, just update reviewed_at and reviewed_by until is_read column is added
    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .update({
        reviewed_by: officerId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", formId)
      .select()

    if (error) {
      console.error("[v0] Error marking form as read:", error)
      return { success: false, error: `Failed to mark as read: ${error.message}` }
    }

    console.log("[v0] Form marked as read successfully:", data)
    revalidatePath("/assistance-program-officer/forms")
    revalidatePath("/program-officer/forms")
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Unexpected error in markFormAsRead:", error)
    return { success: false, error: "An unexpected error occurred while marking form as read" }
  }
}

// Mark form as read function for business development officer
export async function markFormAsReadForBusinessDevelopment(formId: string, officerId: string) {
  try {
    console.log("[v0] Marking form as read for business development:", formId, "by officer:", officerId)

    if (!formId || !officerId) {
      return { success: false, error: "Form ID and Officer ID are required" }
    }

    // For now, just update reviewed_at and reviewed_by until is_read column is added
    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .update({
        reviewed_by: officerId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", formId)
      .select()

    if (error) {
      console.error("[v0] Error marking form as read for business development:", error)
      return { success: false, error: `Failed to mark as read: ${error.message}` }
    }

    console.log("[v0] Form marked as read successfully for business development:", data)
    revalidatePath("/business-development-officer/forms")
    revalidatePath("/program-officer/forms")
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Unexpected error in markFormAsReadForBusinessDevelopment:", error)
    return { success: false, error: "An unexpected error occurred while marking form as read for business development" }
  }
}

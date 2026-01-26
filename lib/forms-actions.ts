"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"

export interface FormSubmission {
  id: string
  title: string
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
  date_loan_applied: string
  loan_amount_approved: number
  members_received_loans: number
  date_loan_received: string
  members_complaining_delay: number
  loan_uses: number
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
  status: "draft" | "submitted"
  created_by: string
  branch_id: string
  created_at: string
  updated_at: string
  submitted_at?: string
}

export async function saveDraftForm(userId: string, formData: any) {
  try {
    console.log("Saving draft for user:", userId)
    console.log("Form data:", formData)

    // Get user profile with better error handling
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("branch_id, role")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      return { error: `Profile error: ${profileError.message}` }
    }

    if (!profile) {
      console.error("No profile found for user:", userId)
      return { error: "User profile not found" }
    }

    console.log("User profile:", profile)

    // Ensure branch_id exists
    if (!profile.branch_id) {
      console.error("No branch_id found for user:", userId)
      return { error: "User branch not found. Please contact administrator." }
    }

    const formSubmission = {
      title: `Financial Inclusion Report - ${formData.group_name || "Draft"}`,
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
      loan_uses: Number.parseInt(formData.loan_uses) || 0,
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
      status: "draft",
      created_by: userId,
      branch_id: profile.branch_id,
      updated_at: new Date().toISOString(),
    }

    console.log("Form submission data:", formSubmission)

    // Check if draft already exists
    if (formData.id) {
      console.log("Updating existing form:", formData.id)
      const { data, error } = await supabaseAdmin
        .from("form_submissions")
        .update(formSubmission)
        .eq("id", formData.id)
        .eq("created_by", userId)
        .select()
        .single()

      if (error) {
        console.error("Update error:", error)
        return { error: `Update failed: ${error.message}` }
      }

      console.log("Form updated successfully:", data)
      return { success: true, form: data }
    } else {
      console.log("Creating new form")
      const { data, error } = await supabaseAdmin.from("form_submissions").insert(formSubmission).select().single()

      if (error) {
        console.error("Insert error:", error)
        return { error: `Insert failed: ${error.message}` }
      }

      console.log("Form created successfully:", data)
      return { success: true, form: data }
    }
  } catch (error) {
    console.error("Save draft error:", error)
    return { error: `Failed to save draft: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}

export async function submitForm(userId: string, formData: any) {
  try {
    console.log("Submitting form for user:", userId)

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("branch_id, role")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      return { error: `Profile error: ${profileError.message}` }
    }

    if (!profile) {
      return { error: "User profile not found" }
    }

    if (!profile.branch_id) {
      return { error: "User branch not found. Please contact administrator." }
    }

    const formSubmission = {
      title: `Financial Inclusion Report - ${formData.group_name}`,
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
      loan_uses: Number.parseInt(formData.loan_uses) || 0,
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
      status: "submitted",
      created_by: userId,
      submitted_by: userId,
      branch_id: profile.branch_id,
      updated_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
    }

    if (formData.id) {
      const { data, error } = await supabaseAdmin
        .from("form_submissions")
        .update(formSubmission)
        .eq("id", formData.id)
        .eq("created_by", userId)
        .select()
        .single()

      if (error) {
        console.error("Submit update error:", error)
        return { error: `Submit failed: ${error.message}` }
      }

      return { success: true, form: data }
    } else {
      const { data, error } = await supabaseAdmin.from("form_submissions").insert(formSubmission).select().single()

      if (error) {
        console.error("Submit insert error:", error)
        return { error: `Submit failed: ${error.message}` }
      }

      return { success: true, form: data }
    }
  } catch (error) {
    console.error("Submit form error:", error)
    return { error: `Failed to submit form: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}

export async function getFormsByUser(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .select("*")
      .eq("created_by", userId)
      .order("updated_at", { ascending: false })

    if (error) {
      return { error: error.message }
    }

    return { success: true, forms: data }
  } catch (error) {
    console.error("Get forms error:", error)
    return { error: "Failed to get forms" }
  }
}

export async function getFormsByBranch(branchId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .select(`
        *,
        profiles!form_submissions_created_by_fkey(full_name, role)
      `)
      .eq("branch_id", branchId)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false })

    if (error) {
      return { error: error.message }
    }

    return { success: true, forms: data }
  } catch (error) {
    console.error("Get branch forms error:", error)
    return { error: "Failed to get branch forms" }
  }
}

export async function getFormById(formId: string, userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .select("*")
      .eq("id", formId)
      .eq("created_by", userId)
      .single()

    if (error) {
      return { error: error.message }
    }

    return { success: true, form: data }
  } catch (error) {
    console.error("Get form error:", error)
    return { error: "Failed to get form" }
  }
}

export async function deleteForm(formId: string, userId: string) {
  try {
    const { error } = await supabaseAdmin.from("form_submissions").delete().eq("id", formId).eq("created_by", userId)

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Delete form error:", error)
    return { error: "Failed to delete form" }
  }
}

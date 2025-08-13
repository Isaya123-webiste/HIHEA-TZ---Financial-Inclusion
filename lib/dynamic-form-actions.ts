"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import type { FormSchema, FormData } from "./form-schema-types"
import { validateSchema, validateForm, initializeFormData } from "./form-schema-utils"

export interface DynamicFormActionResult {
  success: boolean
  data?: any
  error?: string
  code?: string
}

// Form Schema Management
export async function createFormSchema(schema: FormSchema, userId: string): Promise<DynamicFormActionResult> {
  try {
    // Validate schema
    const validationErrors = validateSchema(schema)
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: `Schema validation failed: ${validationErrors.join(", ")}`,
        code: "VALIDATION_ERROR",
      }
    }

    const { data, error } = await supabaseAdmin
      .from("form_schemas")
      .insert({
        title: schema.title,
        description: schema.description,
        version: schema.version,
        schema_definition: schema,
        settings: schema.settings,
        submission_config: schema.submission,
        theme: schema.theme,
        analytics_config: schema.analytics,
        created_by: userId,
        status: schema.status,
        category: schema.category,
        tags: schema.tags,
        default_language: schema.defaultLanguage,
        supported_languages: schema.supportedLanguages,
        permissions: schema.permissions,
        metadata: schema.metadata,
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create form schema",
      code: "UNKNOWN_ERROR",
    }
  }
}

export async function updateFormSchema(
  schemaId: string,
  updates: Partial<FormSchema>,
  userId: string,
): Promise<DynamicFormActionResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from("form_schemas")
      .update({
        title: updates.title,
        description: updates.description,
        version: updates.version,
        schema_definition: updates,
        settings: updates.settings,
        submission_config: updates.submission,
        theme: updates.theme,
        analytics_config: updates.analytics,
        updated_by: userId,
        status: updates.status,
        category: updates.category,
        tags: updates.tags,
        permissions: updates.permissions,
        metadata: updates.metadata,
      })
      .eq("id", schemaId)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update form schema",
      code: "UNKNOWN_ERROR",
    }
  }
}

export async function getFormSchema(schemaId: string): Promise<DynamicFormActionResult> {
  try {
    const { data, error } = await supabaseAdmin.from("form_schemas").select("*").eq("id", schemaId).single()

    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      }
    }

    return {
      success: true,
      data: data.schema_definition,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to get form schema",
      code: "UNKNOWN_ERROR",
    }
  }
}

export async function listFormSchemas(
  userId: string,
  filters?: {
    status?: string
    category?: string
    search?: string
  },
): Promise<DynamicFormActionResult> {
  try {
    let query = supabaseAdmin
      .from("form_schemas")
      .select("*")
      .or(`created_by.eq.${userId},status.eq.published`)
      .is("deleted_at", null)

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.category) {
      query = query.eq("category", filters.category)
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query.order("updated_at", { ascending: false })

    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to list form schemas",
      code: "UNKNOWN_ERROR",
    }
  }
}

export async function deleteFormSchema(schemaId: string, userId: string): Promise<DynamicFormActionResult> {
  try {
    const { error } = await supabaseAdmin
      .from("form_schemas")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", schemaId)
      .eq("created_by", userId)

    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      }
    }

    return {
      success: true,
      data: { message: "Form schema deleted successfully" },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to delete form schema",
      code: "UNKNOWN_ERROR",
    }
  }
}

// Form Instance Management
export async function createFormInstance(
  schemaId: string,
  userId?: string,
  sessionId?: string,
): Promise<DynamicFormActionResult> {
  try {
    // Get the schema
    const schemaResult = await getFormSchema(schemaId)
    if (!schemaResult.success) {
      return schemaResult
    }

    const schema: FormSchema = schemaResult.data
    const initialData = initializeFormData(schema)

    const { data, error } = await supabaseAdmin
      .from("form_instances")
      .insert({
        schema_id: schemaId,
        form_data: initialData,
        status: "draft",
        user_id: userId,
        session_id: sessionId,
        is_valid: false,
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create form instance",
      code: "UNKNOWN_ERROR",
    }
  }
}

export async function updateFormInstance(
  instanceId: string,
  formData: FormData,
  userId?: string,
): Promise<DynamicFormActionResult> {
  try {
    // Get the instance to validate schema
    const { data: instance, error: instanceError } = await supabaseAdmin
      .from("form_instances")
      .select("*, form_schemas!inner(*)")
      .eq("id", instanceId)
      .single()

    if (instanceError) {
      return {
        success: false,
        error: instanceError.message,
        code: instanceError.code,
      }
    }

    const schema: FormSchema = instance.form_schemas.schema_definition
    const validationErrors = validateForm(schema, formData)

    const { data, error } = await supabaseAdmin
      .from("form_instances")
      .update({
        form_data: formData,
        validation_errors: validationErrors,
        is_valid: validationErrors.length === 0,
      })
      .eq("id", instanceId)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update form instance",
      code: "UNKNOWN_ERROR",
    }
  }
}

export async function submitFormInstance(instanceId: string, userId?: string): Promise<DynamicFormActionResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from("form_instances")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", instanceId)
      .eq("is_valid", true)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to submit form instance",
      code: "UNKNOWN_ERROR",
    }
  }
}

export async function getFormInstance(instanceId: string): Promise<DynamicFormActionResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from("form_instances")
      .select("*, form_schemas!inner(*)")
      .eq("id", instanceId)
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      }
    }

    return {
      success: true,
      data: {
        ...data,
        schema: data.form_schemas.schema_definition,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to get form instance",
      code: "UNKNOWN_ERROR",
    }
  }
}

export async function listFormInstances(
  schemaId?: string,
  userId?: string,
  filters?: {
    status?: string
    dateFrom?: string
    dateTo?: string
  },
): Promise<DynamicFormActionResult> {
  try {
    let query = supabaseAdmin.from("form_instances").select("*, form_schemas!inner(title)").is("deleted_at", null)

    if (schemaId) {
      query = query.eq("schema_id", schemaId)
    }

    if (userId) {
      query = query.eq("user_id", userId)
    }

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.dateFrom) {
      query = query.gte("created_at", filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte("created_at", filters.dateTo)
    }

    const { data, error } = await query.order("updated_at", { ascending: false })

    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to list form instances",
      code: "UNKNOWN_ERROR",
    }
  }
}

// Form Templates
export async function getFormTemplates(category?: string): Promise<DynamicFormActionResult> {
  try {
    let query = supabaseAdmin.from("form_templates").select("*").eq("is_public", true).is("deleted_at", null)

    if (category) {
      query = query.eq("category", category)
    }

    const { data, error } = await query.order("usage_count", { ascending: false })

    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to get form templates",
      code: "UNKNOWN_ERROR",
    }
  }
}

export async function createFormFromTemplate(
  templateId: string,
  userId: string,
  customizations?: Partial<FormSchema>,
): Promise<DynamicFormActionResult> {
  try {
    const { data: template, error: templateError } = await supabaseAdmin
      .from("form_templates")
      .select("*")
      .eq("id", templateId)
      .single()

    if (templateError) {
      return {
        success: false,
        error: templateError.message,
        code: templateError.code,
      }
    }

    const baseSchema: FormSchema = template.template_schema
    const newSchema: FormSchema = {
      ...baseSchema,
      ...customizations,
      id: `form_${Date.now()}`,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      status: "draft",
    }

    const result = await createFormSchema(newSchema, userId)

    if (result.success) {
      // Increment usage count
      await supabaseAdmin
        .from("form_templates")
        .update({ usage_count: template.usage_count + 1 })
        .eq("id", templateId)
    }

    return result
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create form from template",
      code: "UNKNOWN_ERROR",
    }
  }
}

// Analytics and Statistics
export async function getFormStatistics(schemaId: string): Promise<DynamicFormActionResult> {
  try {
    const { data, error } = await supabaseAdmin.rpc("get_form_statistics", {
      schema_id_param: schemaId,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to get form statistics",
      code: "UNKNOWN_ERROR",
    }
  }
}

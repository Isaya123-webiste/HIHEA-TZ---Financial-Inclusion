import type {
  FormSchema,
  FormField,
  ConditionalLogic,
  FormData,
  FormValidationError,
  FieldValidator,
} from "./form-schema-types"

/**
 * Form Schema Utilities
 * Provides helper functions for working with dynamic form schemas
 */

// Field validation utilities
export const validators: Record<string, FieldValidator> = {
  required: (value, field) => {
    if (field.required && (!value || (typeof value === "string" && value.trim() === ""))) {
      return "This field is required"
    }
    return null
  },

  minLength: (value, field) => {
    const minLength = field.properties?.minLength
    if (minLength && typeof value === "string" && value.length < minLength) {
      return `Minimum length is ${minLength} characters`
    }
    return null
  },

  maxLength: (value, field) => {
    const maxLength = field.properties?.maxLength
    if (maxLength && typeof value === "string" && value.length > maxLength) {
      return `Maximum length is ${maxLength} characters`
    }
    return null
  },

  min: (value, field) => {
    const min = field.properties?.min
    if (min !== undefined && typeof value === "number" && value < min) {
      return `Minimum value is ${min}`
    }
    return null
  },

  max: (value, field) => {
    const max = field.properties?.max
    if (max !== undefined && typeof value === "number" && value > max) {
      return `Maximum value is ${max}`
    }
    return null
  },

  email: (value) => {
    if (value && typeof value === "string") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return "Please enter a valid email address"
      }
    }
    return null
  },

  url: (value) => {
    if (value && typeof value === "string") {
      try {
        new URL(value)
      } catch {
        return "Please enter a valid URL"
      }
    }
    return null
  },

  pattern: (value, field) => {
    const pattern = field.validation?.find((v) => v.type === "pattern")?.value
    if (pattern && value && typeof value === "string") {
      const regex = new RegExp(pattern)
      if (!regex.test(value)) {
        return field.validation?.find((v) => v.type === "pattern")?.message || "Invalid format"
      }
    }
    return null
  },
}

// Conditional logic evaluation
export function evaluateCondition(condition: ConditionalLogic, formData: FormData): boolean {
  const fieldValue = formData[condition.field]
  const conditionValue = condition.value

  switch (condition.operator) {
    case "equals":
      return fieldValue === conditionValue
    case "notEquals":
      return fieldValue !== conditionValue
    case "contains":
      return typeof fieldValue === "string" && fieldValue.includes(conditionValue)
    case "notContains":
      return typeof fieldValue === "string" && !fieldValue.includes(conditionValue)
    case "greaterThan":
      return typeof fieldValue === "number" && fieldValue > conditionValue
    case "lessThan":
      return typeof fieldValue === "number" && fieldValue < conditionValue
    case "greaterThanOrEqual":
      return typeof fieldValue === "number" && fieldValue >= conditionValue
    case "lessThanOrEqual":
      return typeof fieldValue === "number" && fieldValue <= conditionValue
    case "isEmpty":
      return !fieldValue || (typeof fieldValue === "string" && fieldValue.trim() === "")
    case "isNotEmpty":
      return fieldValue && (typeof fieldValue !== "string" || fieldValue.trim() !== "")
    case "in":
      return Array.isArray(conditionValue) && conditionValue.includes(fieldValue)
    case "notIn":
      return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue)
    default:
      return false
  }
}

// Field visibility and state management
export function getFieldState(field: FormField, formData: FormData) {
  let isVisible = true
  let isEnabled = true
  let isRequired = field.required || false

  if (field.conditionalLogic) {
    for (const condition of field.conditionalLogic) {
      const conditionMet = evaluateCondition(condition, formData)

      switch (condition.action) {
        case "show":
          if (!conditionMet) isVisible = false
          break
        case "hide":
          if (conditionMet) isVisible = false
          break
        case "enable":
          if (!conditionMet) isEnabled = false
          break
        case "disable":
          if (conditionMet) isEnabled = false
          break
        case "require":
          if (conditionMet) isRequired = true
          break
        case "optional":
          if (conditionMet) isRequired = false
          break
      }
    }
  }

  return { isVisible, isEnabled, isRequired }
}

// Form validation
export function validateField(field: FormField, value: any, formData: FormData): FormValidationError[] {
  const errors: FormValidationError[] = []
  const fieldState = getFieldState(field, formData)

  // Skip validation if field is not visible
  if (!fieldState.isVisible) {
    return errors
  }

  // Update field required state based on conditional logic
  const effectiveField = { ...field, required: fieldState.isRequired }

  // Run built-in validators
  for (const validatorName of Object.keys(validators)) {
    const error = validators[validatorName](value, effectiveField, formData)
    if (error) {
      errors.push({
        field: field.name,
        message: error,
        code: validatorName,
      })
    }
  }

  // Run custom validation rules
  if (field.validation) {
    for (const rule of field.validation) {
      const error: string | null = null

      switch (rule.type) {
        case "custom":
          // Custom validation would be implemented here
          // This could call a custom function or API endpoint
          break
        default:
          // Built-in validation rules are handled above
          break
      }

      if (error) {
        errors.push({
          field: field.name,
          message: rule.message || error,
          code: rule.type,
          params: rule.params,
        })
      }
    }
  }

  return errors
}

export function validateForm(schema: FormSchema, formData: FormData): FormValidationError[] {
  const errors: FormValidationError[] = []

  for (const field of Object.values(schema.fields)) {
    const fieldErrors = validateField(field, formData[field.name], formData)
    errors.push(...fieldErrors)
  }

  return errors
}

// Default value computation
export function computeDefaultValue(field: FormField, formData: FormData): any {
  if (field.computedDefault) {
    // This would implement computed default logic
    // For now, return the static default
    return field.defaultValue
  }

  return field.defaultValue
}

// Form data initialization
export function initializeFormData(schema: FormSchema): FormData {
  const formData: FormData = {}

  for (const field of Object.values(schema.fields)) {
    formData[field.name] = computeDefaultValue(field, formData)
  }

  return formData
}

// Schema validation
export function validateSchema(schema: FormSchema): string[] {
  const errors: string[] = []

  // Basic structure validation
  if (!schema.id) errors.push("Schema must have an id")
  if (!schema.title) errors.push("Schema must have a title")
  if (!schema.version) errors.push("Schema must have a version")
  if (!schema.fields || Object.keys(schema.fields).length === 0) {
    errors.push("Schema must have at least one field")
  }

  // Field validation
  for (const [fieldId, field] of Object.entries(schema.fields)) {
    if (field.id !== fieldId) {
      errors.push(`Field ${fieldId} has mismatched id`)
    }
    if (!field.name) {
      errors.push(`Field ${fieldId} must have a name`)
    }
    if (!field.type) {
      errors.push(`Field ${fieldId} must have a type`)
    }
    if (!field.label) {
      errors.push(`Field ${fieldId} must have a label`)
    }

    // Validate conditional logic references
    if (field.conditionalLogic) {
      for (const condition of field.conditionalLogic) {
        if (!schema.fields[condition.field]) {
          errors.push(`Field ${fieldId} references non-existent field ${condition.field} in conditional logic`)
        }
      }
    }
  }

  // Section validation
  if (schema.sections) {
    for (const [sectionId, section] of Object.entries(schema.sections)) {
      if (section.id !== sectionId) {
        errors.push(`Section ${sectionId} has mismatched id`)
      }
      for (const fieldId of section.fields) {
        if (!schema.fields[fieldId]) {
          errors.push(`Section ${sectionId} references non-existent field ${fieldId}`)
        }
      }
    }
  }

  // Step validation
  if (schema.steps) {
    for (const [stepId, step] of Object.entries(schema.steps)) {
      if (step.id !== stepId) {
        errors.push(`Step ${stepId} has mismatched id`)
      }
      if (schema.sections) {
        for (const sectionId of step.sections) {
          if (!schema.sections[sectionId]) {
            errors.push(`Step ${stepId} references non-existent section ${sectionId}`)
          }
        }
      }
    }
  }

  return errors
}

// Schema transformation utilities
export function transformSchemaForVersion(schema: FormSchema, targetVersion: string): FormSchema {
  // This would implement schema migration logic
  // For now, return the schema as-is
  return { ...schema, version: targetVersion }
}

export function mergeSchemas(baseSchema: FormSchema, overrideSchema: Partial<FormSchema>): FormSchema {
  return {
    ...baseSchema,
    ...overrideSchema,
    fields: {
      ...baseSchema.fields,
      ...overrideSchema.fields,
    },
    sections: {
      ...baseSchema.sections,
      ...overrideSchema.sections,
    },
    steps: {
      ...baseSchema.steps,
      ...overrideSchema.steps,
    },
    settings: {
      ...baseSchema.settings,
      ...overrideSchema.settings,
    },
  }
}

// Export utilities for form rendering
export function getVisibleFields(schema: FormSchema, formData: FormData): FormField[] {
  return Object.values(schema.fields).filter((field) => {
    const state = getFieldState(field, formData)
    return state.isVisible
  })
}

export function getFieldsBySection(schema: FormSchema, sectionId: string, formData: FormData): FormField[] {
  const section = schema.sections?.[sectionId]
  if (!section) return []

  return section.fields
    .map((fieldId) => schema.fields[fieldId])
    .filter((field) => field && getFieldState(field, formData).isVisible)
}

export function getFieldsByStep(schema: FormSchema, stepId: string, formData: FormData): FormField[] {
  const step = schema.steps?.[stepId]
  if (!step) return []

  const fields: FormField[] = []
  for (const sectionId of step.sections) {
    fields.push(...getFieldsBySection(schema, sectionId, formData))
  }

  return fields
}

// Form progress calculation
export function calculateFormProgress(schema: FormSchema, formData: FormData): number {
  const allFields = Object.values(schema.fields)
  const visibleFields = getVisibleFields(schema, formData)
  const completedFields = visibleFields.filter((field) => {
    const value = formData[field.name]
    return value !== undefined && value !== null && value !== ""
  })

  return visibleFields.length > 0 ? (completedFields.length / visibleFields.length) * 100 : 0
}

// Form completion validation
export function isFormComplete(schema: FormSchema, formData: FormData): boolean {
  const errors = validateForm(schema, formData)
  return errors.length === 0
}

// Utility for generating field IDs
export function generateFieldId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 50)
}

// Utility for cloning schema objects
export function cloneSchema(schema: FormSchema): FormSchema {
  return JSON.parse(JSON.stringify(schema))
}

export function cloneField(field: FormField): FormField {
  return JSON.parse(JSON.stringify(field))
}

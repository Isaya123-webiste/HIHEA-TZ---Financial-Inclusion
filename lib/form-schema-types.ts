import type React from "react"
// Core form schema types for dynamic form generation

export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "decimal"
  | "currency"
  | "percentage"
  | "date"
  | "datetime"
  | "time"
  | "textarea"
  | "select"
  | "multiselect"
  | "radio"
  | "checkbox"
  | "boolean"
  | "file"
  | "image"
  | "url"
  | "phone"
  | "rating"
  | "slider"
  | "color"
  | "json"
  | "array"
  | "object"
  | "signature"
  | "location"
  | "barcode"
  | "qrcode"

export type ValidationRule = {
  type: "required" | "minLength" | "maxLength" | "min" | "max" | "pattern" | "email" | "url" | "custom"
  value?: any
  message: string
  params?: Record<string, any>
}

export type ConditionalLogic = {
  field: string
  operator:
    | "equals"
    | "notEquals"
    | "contains"
    | "notContains"
    | "greaterThan"
    | "lessThan"
    | "greaterThanOrEqual"
    | "lessThanOrEqual"
    | "isEmpty"
    | "isNotEmpty"
    | "in"
    | "notIn"
  value: any
  action: "show" | "hide" | "enable" | "disable" | "require" | "optional"
}

export type FieldOption = {
  label: string
  value: any
  description?: string
  icon?: string
  disabled?: boolean
  color?: string
  metadata?: Record<string, any>
}

export type DynamicOptions = {
  source: "static" | "api" | "database" | "function"
  endpoint?: string
  query?: string
  function?: string
  params?: Record<string, any>
  cache?: boolean
  cacheDuration?: number
  dependsOn?: string[]
}

export type FieldLayout = {
  width?: "full" | "half" | "third" | "quarter" | "auto" | number
  order?: number
  className?: string
  style?: Record<string, any>
  responsive?: {
    mobile?: Partial<FieldLayout>
    tablet?: Partial<FieldLayout>
    desktop?: Partial<FieldLayout>
  }
}

export type FieldAccessibility = {
  ariaLabel?: string
  ariaDescription?: string
  tabIndex?: number
  role?: string
  screenReaderText?: string
}

export type FormField = {
  id: string
  name: string
  type: FieldType
  label: string
  description?: string
  placeholder?: string
  helpText?: string

  // Validation
  required?: boolean
  validation?: ValidationRule[]

  // Options for select, radio, checkbox fields
  options?: FieldOption[]
  dynamicOptions?: DynamicOptions

  // Default values
  defaultValue?: any
  computedDefault?: {
    function: string
    params?: Record<string, any>
  }

  // Conditional logic
  conditionalLogic?: ConditionalLogic[]

  // Field-specific properties
  properties?: {
    // Text/Textarea
    minLength?: number
    maxLength?: number
    rows?: number
    autoResize?: boolean

    // Number/Currency
    min?: number
    max?: number
    step?: number
    precision?: number
    currency?: string

    // Date/Time
    minDate?: string
    maxDate?: string
    format?: string

    // File/Image
    accept?: string[]
    maxSize?: number
    maxFiles?: number

    // Select/Multiselect
    searchable?: boolean
    clearable?: boolean
    multiple?: boolean

    // Rating
    maxRating?: number
    allowHalf?: boolean

    // Slider
    marks?: Record<number, string>

    // Custom properties
    [key: string]: any
  }

  // Layout and styling
  layout?: FieldLayout

  // Accessibility
  accessibility?: FieldAccessibility

  // Metadata
  metadata?: Record<string, any>
  tags?: string[]

  // Versioning
  version?: string
  deprecated?: boolean

  // Internationalization
  i18n?: Record<
    string,
    {
      label?: string
      description?: string
      placeholder?: string
      helpText?: string
      options?: Record<string, string>
    }
  >
}

export type FormSection = {
  id: string
  title: string
  description?: string
  fields: string[] // Field IDs
  conditionalLogic?: ConditionalLogic[]
  layout?: {
    columns?: number
    className?: string
    collapsible?: boolean
    collapsed?: boolean
  }
  order?: number
  metadata?: Record<string, any>
}

export type FormStep = {
  id: string
  title: string
  description?: string
  sections: string[] // Section IDs
  validation?: {
    validateOnNext?: boolean
    allowSkip?: boolean
    customValidation?: string
  }
  navigation?: {
    nextLabel?: string
    previousLabel?: string
    showProgress?: boolean
  }
  order?: number
  conditionalLogic?: ConditionalLogic[]
}

export type FormSubmission = {
  webhook?: {
    url: string
    method: "POST" | "PUT" | "PATCH"
    headers?: Record<string, string>
    authentication?: {
      type: "bearer" | "basic" | "apiKey"
      token?: string
      username?: string
      password?: string
      apiKey?: string
      apiKeyHeader?: string
    }
  }
  database?: {
    table: string
    mapping?: Record<string, string>
    beforeSave?: string // Function name
    afterSave?: string // Function name
  }
  email?: {
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    template: string
    attachments?: boolean
  }
  redirect?: {
    url: string
    delay?: number
  }
  customHandler?: string
}

export type FormTheme = {
  colors?: {
    primary?: string
    secondary?: string
    success?: string
    error?: string
    warning?: string
    info?: string
  }
  typography?: {
    fontFamily?: string
    fontSize?: Record<string, string>
    fontWeight?: Record<string, string>
  }
  spacing?: Record<string, string>
  borderRadius?: string
  shadows?: Record<string, string>
  customCSS?: string
}

export type FormSettings = {
  multiStep?: boolean
  showProgress?: boolean
  allowSaveAsDraft?: boolean
  allowMultipleSubmissions?: boolean
  requireAuthentication?: boolean
  captcha?: {
    enabled: boolean
    provider: "recaptcha" | "hcaptcha" | "turnstile"
    siteKey: string
  }
  rateLimit?: {
    enabled: boolean
    maxSubmissions: number
    timeWindow: number // in minutes
  }
  scheduling?: {
    startDate?: string
    endDate?: string
    timezone?: string
  }
  notifications?: {
    email?: string[]
    slack?: string
    discord?: string
  }
}

export type FormAnalytics = {
  trackViews?: boolean
  trackFieldInteractions?: boolean
  trackCompletionTime?: boolean
  trackDropoffPoints?: boolean
  customEvents?: string[]
}

export type FormSchema = {
  // Basic information
  id: string
  title: string
  description?: string
  version: string

  // Structure
  fields: Record<string, FormField>
  sections?: Record<string, FormSection>
  steps?: Record<string, FormStep>

  // Configuration
  settings: FormSettings
  submission: FormSubmission
  theme?: FormTheme
  analytics?: FormAnalytics

  // Metadata
  createdBy: string
  createdAt: string
  updatedBy?: string
  updatedAt?: string
  status: "draft" | "published" | "archived"
  tags?: string[]
  category?: string

  // Permissions
  permissions?: {
    view?: string[]
    edit?: string[]
    submit?: string[]
    admin?: string[]
  }

  // Internationalization
  defaultLanguage: string
  supportedLanguages?: string[]

  // Integration
  integrations?: Record<string, any>

  // Custom properties
  metadata?: Record<string, any>
}

// Form instance types (for runtime)
export type FormFieldValue = any

export type FormData = Record<string, FormFieldValue>

export type FormValidationError = {
  field: string
  message: string
  code: string
  params?: Record<string, any>
}

export type FormState = {
  data: FormData
  errors: FormValidationError[]
  touched: Record<string, boolean>
  isValid: boolean
  isSubmitting: boolean
  isDirty: boolean
  currentStep?: string
  completedSteps?: string[]
  metadata?: Record<string, any>
}

export type FormInstance = {
  id: string
  schemaId: string
  schema: FormSchema
  state: FormState
  createdAt: string
  updatedAt: string
  submittedAt?: string
  userId?: string
  sessionId?: string
}

// Utility types
export type FieldValidator = (value: any, field: FormField, formData: FormData) => string | null

export type ConditionalEvaluator = (condition: ConditionalLogic, formData: FormData) => boolean

export type FieldRenderer = (
  field: FormField,
  value: any,
  onChange: (value: any) => void,
  error?: string,
) => React.ReactNode

export type FormHook = {
  beforeRender?: (schema: FormSchema) => FormSchema
  afterRender?: (schema: FormSchema, element: React.ReactElement) => React.ReactElement
  beforeValidation?: (data: FormData, schema: FormSchema) => FormData
  afterValidation?: (errors: FormValidationError[], data: FormData, schema: FormSchema) => FormValidationError[]
  beforeSubmission?: (data: FormData, schema: FormSchema) => FormData
  afterSubmission?: (result: any, data: FormData, schema: FormSchema) => void
}

// Builder types (for form creation interface)
export type FormBuilderField = FormField & {
  isNew?: boolean
  isDirty?: boolean
  isSelected?: boolean
}

export type FormBuilderState = {
  schema: FormSchema
  selectedField?: string
  selectedSection?: string
  selectedStep?: string
  mode: "design" | "preview" | "settings"
  history: FormSchema[]
  historyIndex: number
}

export type FormBuilderAction =
  | { type: "ADD_FIELD"; field: FormField; sectionId?: string }
  | { type: "UPDATE_FIELD"; fieldId: string; updates: Partial<FormField> }
  | { type: "DELETE_FIELD"; fieldId: string }
  | { type: "MOVE_FIELD"; fieldId: string; targetSectionId: string; targetIndex: number }
  | { type: "ADD_SECTION"; section: FormSection }
  | { type: "UPDATE_SECTION"; sectionId: string; updates: Partial<FormSection> }
  | { type: "DELETE_SECTION"; sectionId: string }
  | { type: "ADD_STEP"; step: FormStep }
  | { type: "UPDATE_STEP"; stepId: string; updates: Partial<FormStep> }
  | { type: "DELETE_STEP"; stepId: string }
  | { type: "UPDATE_SETTINGS"; updates: Partial<FormSettings> }
  | { type: "UPDATE_THEME"; updates: Partial<FormTheme> }
  | { type: "SELECT_FIELD"; fieldId: string }
  | { type: "SELECT_SECTION"; sectionId: string }
  | { type: "SELECT_STEP"; stepId: string }
  | { type: "SET_MODE"; mode: FormBuilderState["mode"] }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SAVE_SCHEMA" }
  | { type: "LOAD_SCHEMA"; schema: FormSchema }

"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import {
  Plus,
  Settings,
  Eye,
  Save,
  Copy,
  Trash2,
  GripVertical,
  Edit,
  AlertCircle,
  Type,
  Hash,
  Calendar,
  Mail,
  Phone,
  Link,
  FileText,
  List,
  CheckSquare,
  Star,
  Palette,
  MapPin,
} from "lucide-react"

import type { FormSchema, FormField, FieldType, FormBuilderState, FormBuilderAction } from "@/lib/form-schema-types"
import { validateSchema, generateFieldId, cloneSchema, cloneField } from "@/lib/form-schema-utils"

// Field type configurations
const FIELD_TYPES: Record<
  FieldType,
  {
    label: string
    icon: React.ComponentType<{ className?: string }>
    category: string
    defaultProperties?: Record<string, any>
  }
> = {
  text: { label: "Text", icon: Type, category: "Basic" },
  email: { label: "Email", icon: Mail, category: "Basic" },
  password: { label: "Password", icon: Type, category: "Basic" },
  number: { label: "Number", icon: Hash, category: "Basic" },
  decimal: { label: "Decimal", icon: Hash, category: "Basic" },
  currency: { label: "Currency", icon: Hash, category: "Basic", defaultProperties: { currency: "USD" } },
  percentage: { label: "Percentage", icon: Hash, category: "Basic" },
  date: { label: "Date", icon: Calendar, category: "Basic" },
  datetime: { label: "Date & Time", icon: Calendar, category: "Basic" },
  time: { label: "Time", icon: Calendar, category: "Basic" },
  textarea: { label: "Textarea", icon: FileText, category: "Basic", defaultProperties: { rows: 4 } },
  select: { label: "Dropdown", icon: List, category: "Choice" },
  multiselect: { label: "Multi-select", icon: List, category: "Choice" },
  radio: { label: "Radio Buttons", icon: CheckSquare, category: "Choice" },
  checkbox: { label: "Checkboxes", icon: CheckSquare, category: "Choice" },
  boolean: { label: "Yes/No", icon: CheckSquare, category: "Choice" },
  file: { label: "File Upload", icon: FileText, category: "Advanced" },
  image: { label: "Image Upload", icon: FileText, category: "Advanced" },
  url: { label: "URL", icon: Link, category: "Basic" },
  phone: { label: "Phone", icon: Phone, category: "Basic" },
  rating: { label: "Rating", icon: Star, category: "Advanced", defaultProperties: { maxRating: 5 } },
  slider: { label: "Slider", icon: Hash, category: "Advanced" },
  color: { label: "Color Picker", icon: Palette, category: "Advanced" },
  json: { label: "JSON", icon: FileText, category: "Advanced" },
  array: { label: "Array", icon: List, category: "Advanced" },
  object: { label: "Object", icon: FileText, category: "Advanced" },
  signature: { label: "Signature", icon: Edit, category: "Advanced" },
  location: { label: "Location", icon: MapPin, category: "Advanced" },
  barcode: { label: "Barcode", icon: Hash, category: "Advanced" },
  qrcode: { label: "QR Code", icon: Hash, category: "Advanced" },
}

interface DynamicFormBuilderProps {
  initialSchema?: FormSchema
  onSave?: (schema: FormSchema) => void
  onPreview?: (schema: FormSchema) => void
  className?: string
}

export default function DynamicFormBuilder({
  initialSchema,
  onSave,
  onPreview,
  className = "",
}: DynamicFormBuilderProps) {
  // Initialize form builder state
  const [builderState, setBuilderState] = useState<FormBuilderState>(() => ({
    schema: initialSchema || {
      id: `form_${Date.now()}`,
      title: "New Form",
      description: "",
      version: "1.0.0",
      fields: {},
      settings: {
        multiStep: false,
        showProgress: true,
        allowSaveAsDraft: true,
        allowMultipleSubmissions: false,
        requireAuthentication: false,
      },
      submission: {
        database: {
          table: "form_submissions",
        },
      },
      createdBy: "",
      createdAt: new Date().toISOString(),
      status: "draft",
      defaultLanguage: "en",
    },
    mode: "design",
    history: [],
    historyIndex: -1,
  }))

  const [selectedFieldType, setSelectedFieldType] = useState<FieldType>("text")
  const [showFieldDialog, setShowFieldDialog] = useState(false)
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Memoized values
  const fieldCategories = useMemo(() => {
    const categories: Record<string, FieldType[]> = {}
    Object.entries(FIELD_TYPES).forEach(([type, config]) => {
      if (!categories[config.category]) {
        categories[config.category] = []
      }
      categories[config.category].push(type as FieldType)
    })
    return categories
  }, [])

  const fieldArray = useMemo(() => {
    return Object.values(builderState.schema.fields)
  }, [builderState.schema.fields])

  // Action dispatcher
  const dispatch = useCallback((action: FormBuilderAction) => {
    setBuilderState((prevState) => {
      const newState = { ...prevState }

      // Save current state to history before making changes
      if (action.type !== "UNDO" && action.type !== "REDO") {
        newState.history = [...prevState.history.slice(0, prevState.historyIndex + 1), cloneSchema(prevState.schema)]
        newState.historyIndex = newState.history.length - 1
      }

      switch (action.type) {
        case "ADD_FIELD":
          newState.schema.fields[action.field.id] = action.field
          newState.selectedField = action.field.id
          break

        case "UPDATE_FIELD":
          if (newState.schema.fields[action.fieldId]) {
            newState.schema.fields[action.fieldId] = {
              ...newState.schema.fields[action.fieldId],
              ...action.updates,
            }
          }
          break

        case "DELETE_FIELD":
          delete newState.schema.fields[action.fieldId]
          if (newState.selectedField === action.fieldId) {
            newState.selectedField = undefined
          }
          break

        case "UPDATE_SETTINGS":
          newState.schema.settings = {
            ...newState.schema.settings,
            ...action.updates,
          }
          break

        case "SELECT_FIELD":
          newState.selectedField = action.fieldId
          break

        case "SET_MODE":
          newState.mode = action.mode
          break

        case "UNDO":
          if (newState.historyIndex > 0) {
            newState.historyIndex -= 1
            newState.schema = cloneSchema(newState.history[newState.historyIndex])
          }
          break

        case "REDO":
          if (newState.historyIndex < newState.history.length - 1) {
            newState.historyIndex += 1
            newState.schema = cloneSchema(newState.history[newState.historyIndex])
          }
          break

        case "LOAD_SCHEMA":
          newState.schema = action.schema
          newState.selectedField = undefined
          break
      }

      return newState
    })
  }, [])

  // Field management functions
  const addField = useCallback(
    (type: FieldType) => {
      const fieldConfig = FIELD_TYPES[type]
      const fieldId = generateFieldId(`${fieldConfig.label} ${Object.keys(builderState.schema.fields).length + 1}`)

      const newField: FormField = {
        id: fieldId,
        name: fieldId,
        type,
        label: `${fieldConfig.label} ${Object.keys(builderState.schema.fields).length + 1}`,
        required: false,
        properties: fieldConfig.defaultProperties || {},
      }

      dispatch({ type: "ADD_FIELD", field: newField })
      setShowFieldDialog(false)
    },
    [builderState.schema.fields, dispatch],
  )

  const updateField = useCallback(
    (fieldId: string, updates: Partial<FormField>) => {
      dispatch({ type: "UPDATE_FIELD", fieldId, updates })
    },
    [dispatch],
  )

  const deleteField = useCallback(
    (fieldId: string) => {
      dispatch({ type: "DELETE_FIELD", fieldId })
    },
    [dispatch],
  )

  const duplicateField = useCallback(
    (fieldId: string) => {
      const originalField = builderState.schema.fields[fieldId]
      if (originalField) {
        const duplicatedField = cloneField(originalField)
        duplicatedField.id = generateFieldId(`${originalField.label} Copy`)
        duplicatedField.name = duplicatedField.id
        duplicatedField.label = `${originalField.label} (Copy)`

        dispatch({ type: "ADD_FIELD", field: duplicatedField })
      }
    },
    [builderState.schema.fields, dispatch],
  )

  // Drag and drop handling
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return

      const items = Array.from(fieldArray)
      const [reorderedItem] = items.splice(result.source.index, 1)
      items.splice(result.destination.index, 0, reorderedItem)

      // Update the schema with new field order
      const newFields: Record<string, FormField> = {}
      items.forEach((field, index) => {
        newFields[field.id] = { ...field, layout: { ...field.layout, order: index } }
      })

      dispatch({ type: "LOAD_SCHEMA", schema: { ...builderState.schema, fields: newFields } })
    },
    [fieldArray, builderState.schema, dispatch],
  )

  // Validation
  const validateCurrentSchema = useCallback(() => {
    const errors = validateSchema(builderState.schema)
    setValidationErrors(errors)
    return errors.length === 0
  }, [builderState.schema])

  // Save and preview handlers
  const handleSave = useCallback(() => {
    if (validateCurrentSchema()) {
      onSave?.(builderState.schema)
    }
  }, [builderState.schema, onSave, validateCurrentSchema])

  const handlePreview = useCallback(() => {
    if (validateCurrentSchema()) {
      onPreview?.(builderState.schema)
    }
  }, [builderState.schema, onPreview, validateCurrentSchema])

  // Field property editor
  const renderFieldEditor = () => {
    const selectedField = builderState.selectedField ? builderState.schema.fields[builderState.selectedField] : null
    if (!selectedField) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Field: {selectedField.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="field-label">Label</Label>
            <Input
              id="field-label"
              value={selectedField.label}
              onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="field-name">Field Name</Label>
            <Input
              id="field-name"
              value={selectedField.name}
              onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="field-description">Description</Label>
            <Textarea
              id="field-description"
              value={selectedField.description || ""}
              onChange={(e) => updateField(selectedField.id, { description: e.target.value })}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="field-placeholder">Placeholder</Label>
            <Input
              id="field-placeholder"
              value={selectedField.placeholder || ""}
              onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="field-required"
              checked={selectedField.required || false}
              onCheckedChange={(checked) => updateField(selectedField.id, { required: !!checked })}
            />
            <Label htmlFor="field-required">Required</Label>
          </div>

          {/* Type-specific properties */}
          {(selectedField.type === "select" || selectedField.type === "radio" || selectedField.type === "checkbox") && (
            <div>
              <Label>Options</Label>
              <div className="space-y-2">
                {selectedField.options?.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option.label}
                      onChange={(e) => {
                        const newOptions = [...(selectedField.options || [])]
                        newOptions[index] = { ...option, label: e.target.value }
                        updateField(selectedField.id, { options: newOptions })
                      }}
                      placeholder="Option label"
                    />
                    <Input
                      value={option.value}
                      onChange={(e) => {
                        const newOptions = [...(selectedField.options || [])]
                        newOptions[index] = { ...option, value: e.target.value }
                        updateField(selectedField.id, { options: newOptions })
                      }}
                      placeholder="Option value"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOptions = selectedField.options?.filter((_, i) => i !== index) || []
                        updateField(selectedField.id, { options: newOptions })
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newOptions = [...(selectedField.options || []), { label: "", value: "" }]
                    updateField(selectedField.id, { options: newOptions })
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          )}

          {/* Number/Currency specific properties */}
          {(selectedField.type === "number" ||
            selectedField.type === "currency" ||
            selectedField.type === "decimal") && (
            <>
              <div>
                <Label htmlFor="field-min">Minimum Value</Label>
                <Input
                  id="field-min"
                  type="number"
                  value={selectedField.properties?.min || ""}
                  onChange={(e) =>
                    updateField(selectedField.id, {
                      properties: { ...selectedField.properties, min: Number(e.target.value) },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="field-max">Maximum Value</Label>
                <Input
                  id="field-max"
                  type="number"
                  value={selectedField.properties?.max || ""}
                  onChange={(e) =>
                    updateField(selectedField.id, {
                      properties: { ...selectedField.properties, max: Number(e.target.value) },
                    })
                  }
                />
              </div>
            </>
          )}

          {/* Text specific properties */}
          {(selectedField.type === "text" || selectedField.type === "textarea") && (
            <>
              <div>
                <Label htmlFor="field-minlength">Minimum Length</Label>
                <Input
                  id="field-minlength"
                  type="number"
                  value={selectedField.properties?.minLength || ""}
                  onChange={(e) =>
                    updateField(selectedField.id, {
                      properties: { ...selectedField.properties, minLength: Number(e.target.value) },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="field-maxlength">Maximum Length</Label>
                <Input
                  id="field-maxlength"
                  type="number"
                  value={selectedField.properties?.maxLength || ""}
                  onChange={(e) =>
                    updateField(selectedField.id, {
                      properties: { ...selectedField.properties, maxLength: Number(e.target.value) },
                    })
                  }
                />
              </div>
            </>
          )}

          {/* Textarea specific properties */}
          {selectedField.type === "textarea" && (
            <div>
              <Label htmlFor="field-rows">Rows</Label>
              <Input
                id="field-rows"
                type="number"
                value={selectedField.properties?.rows || 4}
                onChange={(e) =>
                  updateField(selectedField.id, {
                    properties: { ...selectedField.properties, rows: Number(e.target.value) },
                  })
                }
              />
            </div>
          )}

          {/* Rating specific properties */}
          {selectedField.type === "rating" && (
            <div>
              <Label htmlFor="field-maxrating">Maximum Rating</Label>
              <Input
                id="field-maxrating"
                type="number"
                value={selectedField.properties?.maxRating || 5}
                onChange={(e) =>
                  updateField(selectedField.id, {
                    properties: { ...selectedField.properties, maxRating: Number(e.target.value) },
                  })
                }
              />
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`flex h-screen bg-gray-50 ${className}`}>
      {/* Left Sidebar - Field Types */}
      <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Field Types</h3>

          {Object.entries(fieldCategories).map(([category, types]) => (
            <div key={category} className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
              <div className="space-y-1">
                {types.map((type) => {
                  const config = FIELD_TYPES[type]
                  const Icon = config.icon
                  return (
                    <Button
                      key={type}
                      variant="ghost"
                      className="w-full justify-start h-auto p-2"
                      onClick={() => addField(type)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="text-sm">{config.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{builderState.schema.title}</h1>
              <p className="text-sm text-gray-600">{builderState.schema.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <Tabs
                value={builderState.mode}
                onValueChange={(mode) => dispatch({ type: "SET_MODE", mode: mode as any })}
              >
                <TabsList>
                  <TabsTrigger value="design">Design</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button variant="outline" onClick={() => dispatch({ type: "UNDO" })}>
                Undo
              </Button>
              <Button variant="outline" onClick={() => dispatch({ type: "REDO" })}>
                Redo
              </Button>
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert className="m-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <div className="font-medium mb-1">Schema Validation Errors:</div>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Content Tabs */}
        <div className="flex-1 overflow-hidden">
          {builderState.mode === "design" && (
            <div className="flex h-full">
              {/* Form Fields List */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold mb-2">Form Fields</h2>
                  {fieldArray.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No fields added yet. Select a field type from the sidebar to get started.</p>
                    </div>
                  )}
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="form-fields">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {fieldArray.map((field, index) => (
                          <Draggable key={field.id} draggableId={field.id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`cursor-pointer transition-colors ${
                                  builderState.selectedField === field.id
                                    ? "ring-2 ring-blue-500 bg-blue-50"
                                    : snapshot.isDragging
                                      ? "shadow-lg"
                                      : "hover:bg-gray-50"
                                }`}
                                onClick={() => dispatch({ type: "SELECT_FIELD", fieldId: field.id })}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div {...provided.dragHandleProps}>
                                        <GripVertical className="h-4 w-4 text-gray-400" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{field.label}</span>
                                          {field.required && (
                                            <Badge variant="secondary" className="text-xs">
                                              Required
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                          <Badge variant="outline" className="text-xs">
                                            {FIELD_TYPES[field.type]?.label || field.type}
                                          </Badge>
                                          <span>{field.name}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          duplicateField(field.id)
                                        }}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          deleteField(field.id)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>

              {/* Right Sidebar - Field Editor */}
              <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
                {builderState.selectedField ? (
                  renderFieldEditor()
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a field to edit its properties</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {builderState.mode === "settings" && (
            <div className="p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Form Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="form-title">Form Title</Label>
                      <Input
                        id="form-title"
                        value={builderState.schema.title}
                        onChange={(e) =>
                          dispatch({
                            type: "LOAD_SCHEMA",
                            schema: { ...builderState.schema, title: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="form-description">Description</Label>
                      <Textarea
                        id="form-description"
                        value={builderState.schema.description || ""}
                        onChange={(e) =>
                          dispatch({
                            type: "LOAD_SCHEMA",
                            schema: { ...builderState.schema, description: e.target.value },
                          })
                        }
                        rows={3}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="multi-step"
                          checked={builderState.schema.settings.multiStep || false}
                          onCheckedChange={(checked) =>
                            dispatch({
                              type: "UPDATE_SETTINGS",
                              updates: { multiStep: !!checked },
                            })
                          }
                        />
                        <Label htmlFor="multi-step">Multi-step form</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="show-progress"
                          checked={builderState.schema.settings.showProgress || false}
                          onCheckedChange={(checked) =>
                            dispatch({
                              type: "UPDATE_SETTINGS",
                              updates: { showProgress: !!checked },
                            })
                          }
                        />
                        <Label htmlFor="show-progress">Show progress indicator</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="save-draft"
                          checked={builderState.schema.settings.allowSaveAsDraft || false}
                          onCheckedChange={(checked) =>
                            dispatch({
                              type: "UPDATE_SETTINGS",
                              updates: { allowSaveAsDraft: !!checked },
                            })
                          }
                        />
                        <Label htmlFor="save-draft">Allow save as draft</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="require-auth"
                          checked={builderState.schema.settings.requireAuthentication || false}
                          onCheckedChange={(checked) =>
                            dispatch({
                              type: "UPDATE_SETTINGS",
                              updates: { requireAuthentication: !!checked },
                            })
                          }
                        />
                        <Label htmlFor="require-auth">Require authentication</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="multiple-submissions"
                          checked={builderState.schema.settings.allowMultipleSubmissions || false}
                          onCheckedChange={(checked) =>
                            dispatch({
                              type: "UPDATE_SETTINGS",
                              updates: { allowMultipleSubmissions: !!checked },
                            })
                          }
                        />
                        <Label htmlFor="multiple-submissions">Allow multiple submissions</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {builderState.mode === "preview" && (
            <div className="p-6 overflow-y-auto bg-gray-50">
              <div className="max-w-2xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>{builderState.schema.title}</CardTitle>
                    {builderState.schema.description && (
                      <p className="text-gray-600">{builderState.schema.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {fieldArray.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label className="flex items-center gap-1">
                          {field.label}
                          {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        {field.description && <p className="text-sm text-gray-600">{field.description}</p>}

                        {/* Render preview of field based on type */}
                        {field.type === "text" && <Input placeholder={field.placeholder} disabled />}
                        {field.type === "email" && <Input type="email" placeholder={field.placeholder} disabled />}
                        {field.type === "number" && <Input type="number" placeholder={field.placeholder} disabled />}
                        {field.type === "date" && <Input type="date" disabled />}
                        {field.type === "textarea" && (
                          <Textarea placeholder={field.placeholder} rows={field.properties?.rows || 4} disabled />
                        )}
                        {field.type === "select" && (
                          <Select disabled>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option, index) => (
                                <SelectItem key={index} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {field.type === "radio" && (
                          <div className="space-y-2">
                            {field.options?.map((option, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <input type="radio" disabled />
                                <Label>{option.label}</Label>
                              </div>
                            ))}
                          </div>
                        )}
                        {field.type === "checkbox" && (
                          <div className="space-y-2">
                            {field.options?.map((option, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Checkbox disabled />
                                <Label>{option.label}</Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="pt-4">
                      <Button disabled className="w-full">
                        Submit Form (Preview Mode)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

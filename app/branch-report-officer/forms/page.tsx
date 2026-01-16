"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ProjectSelectionDialog from "@/components/project-selection-dialog"
import {
  FileText,
  Plus,
  PieChart,
  LogOut,
  Menu,
  BarChart3,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Search,
  Edit,
  Trash2,
  Filter,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
} from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getUserProfile } from "@/lib/admin-actions"
import {
  saveDraftForm,
  submitForm,
  getFormsByUser,
  getFormById,
  deleteForm,
  searchForms,
  type FormSubmission,
} from "@/lib/enhanced-forms-actions"
import ConfirmationDialog from "@/components/confirmation-dialog"

interface FormField {
  id: string
  name: string
  label: string
  type: "text" | "number" | "date" | "select" | "textarea" | "currency"
  required: boolean
  options?: string[]
  placeholder?: string
  description?: string
}

interface FormData {
  [key: string]: string
}

export default function BranchReportOfficerForms() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0)
  const [formData, setFormData] = useState<FormData>({})
  const [editingFormId, setEditingFormId] = useState<string | null>(null)
  const [editingForm, setEditingForm] = useState<FormSubmission | null>(null)
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [saveMessageType, setSaveMessageType] = useState<"success" | "error">("success")
  const [forms, setForms] = useState<FormSubmission[]>([])
  const [filteredForms, setFilteredForms] = useState<FormSubmission[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [groupFilter, setGroupFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [formToDelete, setFormToDelete] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showProjectSelection, setShowProjectSelection] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const router = useRouter()

  // Define all form fields in sequential order
  const formFields: FormField[] = [
    {
      id: "group_name",
      name: "group_name",
      label: "Group name",
      type: "text",
      required: true,
      placeholder: "Enter the group name",
    },
    {
      id: "location",
      name: "location",
      label: "Location",
      type: "text",
      required: true,
      placeholder: "Enter the location",
    },
    {
      id: "credit_sources",
      name: "credit_sources",
      label: "Credit sources/ Bank /MFIs Name",
      type: "text",
      required: true,
      placeholder: "Enter credit sources, bank or MFI names",
    },
    {
      id: "num_mfis",
      name: "num_mfis",
      label: "Number of MFIs accessing the area",
      type: "number",
      required: true,
      placeholder: "0",
    },
    {
      id: "groups_bank_account",
      name: "groups_bank_account",
      label: "Groups with Bank Account",
      type: "number",
      required: true,
      placeholder: "0",
    },
    {
      id: "members_bank_account",
      name: "members_bank_account",
      label: "Members with Bank Account",
      type: "number",
      required: true,
      placeholder: "0",
    },
    {
      id: "inactive_accounts",
      name: "inactive_accounts",
      label: "Members with inactive accounts (churn accounts)",
      type: "number",
      required: true,
      placeholder: "0",
    },
    {
      id: "num_insurers",
      name: "num_insurers",
      label: "Number of insurers in the area",
      type: "number",
      required: true,
      placeholder: "0",
    },
    {
      id: "members_insurance",
      name: "members_insurance",
      label: "No. of members with Insurance (agricultural/livestock/credit)",
      type: "number",
      required: true,
      placeholder: "0",
    },
    {
      id: "borrowed_groups",
      name: "borrowed_groups",
      label: "No. of borrowed groups",
      type: "number",
      required: true,
      placeholder: "0",
    },
    {
      id: "members_applying_loans",
      name: "members_applying_loans",
      label: "Number of group Members applying loans",
      type: "number",
      required: true,
      placeholder: "0",
    },
    {
      id: "loan_amount_applied",
      name: "loan_amount_applied",
      label: "Amount of loan applied",
      type: "currency",
      required: true,
      placeholder: "0",
      description: "Amount in Tanzanian Shillings (TZS)",
    },
    {
      id: "date_loan_applied",
      name: "date_loan_applied",
      label: "Date loan applied",
      type: "date",
      required: true,
    },
    {
      id: "loan_amount_approved",
      name: "loan_amount_approved",
      label: "Amount of Loan(approved/received)",
      type: "currency",
      required: true,
      placeholder: "0",
      description: "Amount in Tanzanian Shillings (TZS)",
    },
    {
      id: "members_received_loans",
      name: "members_received_loans",
      label: "No. of members received loans",
      type: "number",
      required: true,
      placeholder: "0",
    },
    {
      id: "date_loan_received",
      name: "date_loan_received",
      label: "Date loan received",
      type: "date",
      required: true,
    },
    {
      id: "members_complaining_delay",
      name: "members_complaining_delay",
      label: "No. of members complaining long disbursement lead time",
      type: "number",
      required: true,
      placeholder: "0",
    },
    {
      id: "loan_uses",
      name: "loan_uses",
      label: "Loan uses (write only members with 3 value chain activities)",
      type: "textarea",
      required: true,
      placeholder: "Describe loan uses for members with 3 value chain activities",
    },
    {
      id: "loan_cost_high",
      name: "loan_cost_high",
      label: "Loan cost-high? Ask members.",
      type: "number", // Changed from "textarea" to "number"
      required: false,
      placeholder: "0", // Changed placeholder to reflect numeric input
    },
    {
      id: "loan_delinquency",
      name: "loan_delinquency",
      label: "Loan on delinquency",
      type: "currency",
      required: true,
      placeholder: "0",
      description: "Amount in Tanzanian Shillings (TZS)",
    },
    {
      id: "loan_dropout",
      name: "loan_dropout",
      label: "Loan Dropout members/ groups",
      type: "number",
      required: true,
      placeholder: "0",
    },
    {
      id: "money_fraud",
      name: "money_fraud",
      label: "Money fraud incidence",
      type: "number",
      required: false,
      placeholder: "0",
    },
    {
      id: "trust_erosion",
      name: "trust_erosion",
      label: "Trust erosion in MFIs",
      type: "number",
      required: false,
      placeholder: "0",
    },
    {
      id: "documentation_delay",
      name: "documentation_delay",
      label: "Documentation delay",
      type: "number",
      required: false,
      placeholder: "0",
    },
    {
      id: "loan_cost_high",
      name: "loan_cost_high",
      label: "Loan cost-high? Ask members.",
      type: "number", // Changed from "textarea" to "number"
      required: false,
      placeholder: "0", // Changed placeholder to reflect numeric input
    },
    {
      id: "explain_barriers",
      name: "explain_barriers",
      label: "Explain barriers for no loans/ no bank account/not approved by bank, no insurance etc.",
      type: "textarea",
      required: false,
      placeholder: "Explain barriers preventing access to financial services",
    },
    {
      id: "number_of_groups",
      name: "number_of_groups",
      label: "Number of groups",
      type: "number",
      required: true,
      placeholder: "0",
    },
    {
      id: "members_at_start",
      name: "members_at_start",
      label: "Number of members at start",
      type: "number",
      required: true,
      placeholder: "0",
    },
    {
      id: "members_at_end",
      name: "members_at_end",
      label: "Number of members at end",
      type: "number",
      required: true,
      placeholder: "0",
    },
    {
      id: "bros_at_start",
      name: "bros_at_start",
      label: "Number of BROs at start",
      type: "number",
      required: true,
      placeholder: "0",
    },
    {
      id: "bros_at_end",
      name: "bros_at_end",
      label: "Number of BROs at end",
      type: "number",
      required: true,
      placeholder: "0",
    },
    {
      id: "notes",
      name: "notes",
      label: "Additional Notes",
      type: "textarea",
      required: false,
      placeholder: "Add any additional notes or comments...",
    },
  ]

  useEffect(() => {
    async function loadUserData() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push("/")
          return
        }

        const profileResult = await getUserProfile(user.id)

        if (profileResult.error) {
          setError(profileResult.error)
        } else if (profileResult.profile) {
          setProfile(profileResult.profile)

          if (profileResult.profile.role !== "branch_report_officer") {
            router.push("/dashboard")
            return
          }

          await loadForms(user.id)
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        setError("Failed to load user data")
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  const loadForms = async (userId: string) => {
    try {
      setRefreshing(true)
      const result = await getFormsByUser(userId)
      if (result.success && result.data) {
        setForms(result.data)
        setFilteredForms(result.data)
      } else {
        showMessage(result.error || "Failed to load forms", "error")
      }
    } catch (error) {
      console.error("Error loading forms:", error)
      showMessage("Error loading forms", "error")
    } finally {
      setRefreshing(false)
    }
  }

  const showMessage = (message: string, type: "success" | "error" = "success") => {
    setSaveMessage(message)
    setSaveMessageType(type)
    setTimeout(() => setSaveMessage(""), type === "error" ? 7000 : 3000)
  }

  // Enhanced search functionality
  const performSearch = async () => {
    if (!profile) return

    try {
      setRefreshing(true)
      const result = await searchForms(profile.id, {
        searchTerm,
        dateFrom: dateFilter,
        groupFilter,
        status: statusFilter,
      })

      if (result.success && result.data) {
        setFilteredForms(result.data)
      } else {
        showMessage(result.error || "Search failed", "error")
      }
    } catch (error) {
      console.error("Search error:", error)
      showMessage("Search failed", "error")
    } finally {
      setRefreshing(false)
    }
  }

  // Filter forms based on search criteria
  useEffect(() => {
    if (!searchTerm && !dateFilter && !groupFilter && statusFilter === "all") {
      setFilteredForms(forms)
      return
    }

    performSearch()
  }, [searchTerm, dateFilter, groupFilter, statusFilter, forms])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleAddForm = () => {
    setShowProjectSelection(true)
  }

  const handleProjectSelected = (projectId: string) => {
    setSelectedProjectId(projectId)
    setShowProjectSelection(false)
    setIsFormOpen(true)
    setCurrentFieldIndex(0)
    setFormData({})
    setEditingFormId(null)
    setEditingForm(null)
  }

  const handleEditForm = async (formId: string) => {
    try {
      const result = await getFormById(formId, profile.id)
      if (result.success && result.data) {
        const form = result.data
        const editData: FormData = {}

        // Convert form data to FormData format
        formFields.forEach((field) => {
          const value = form[field.name as keyof FormSubmission]
          editData[field.name] = value ? String(value) : ""
        })

        setFormData(editData)
        setEditingFormId(formId)
        setEditingForm(form)
        setIsFormOpen(true)
        setCurrentFieldIndex(0)
      } else {
        showMessage(result.error || "Failed to load form for editing", "error")
      }
    } catch (error) {
      console.error("Error loading form for editing:", error)
      showMessage("Error loading form for editing", "error")
    }
  }

  const handleDeleteForm = (formId: string) => {
    setFormToDelete(formId)
    setShowDeleteConfirmation(true)
  }

  const confirmDeleteForm = async () => {
    if (!formToDelete) return

    try {
      const result = await deleteForm(formToDelete, profile.id)
      if (result.success) {
        showMessage("Form deleted successfully!", "success")
        await loadForms(profile.id)
      } else {
        showMessage(result.error || "Failed to delete form", "error")
      }
    } catch (error) {
      showMessage("Error deleting form", "error")
    } finally {
      setShowDeleteConfirmation(false)
      setFormToDelete(null)
    }
  }

  const handleCloseForm = async () => {
    if (Object.keys(formData).length > 0) {
      setShowCloseConfirmation(true)
    } else {
      setIsFormOpen(false)
      setCurrentFieldIndex(0)
      setFormData({})
      setEditingFormId(null)
      setEditingForm(null)
    }
  }

  const handleConfirmClose = async () => {
    // Save draft before closing if there's data
    if (Object.keys(formData).length > 0) {
      try {
        setSaving(true)
        const result = await handleSaveDraft(true)
        if (result && !result.success) {
          showMessage("Failed to save draft before closing", "error")
          setShowCloseConfirmation(false)
          return // Don't close if save failed
        }
        // Reload forms to ensure the new draft appears in the list
        await loadForms(profile.id)
      } catch (error) {
        console.error("Error saving draft before close:", error)
        showMessage("Error saving draft", "error")
        setShowCloseConfirmation(false)
        return
      } finally {
        setSaving(false)
      }
    }

    setIsFormOpen(false)
    setCurrentFieldIndex(0)
    setFormData({})
    setEditingFormId(null)
    setEditingForm(null)
    setShowCloseConfirmation(false)
  }

  const handleFieldChange = (value: string) => {
    const currentField = formFields[currentFieldIndex]
    setFormData((prev) => ({
      ...prev,
      [currentField.name]: value,
    }))
  }

  const handleNext = () => {
    if (currentFieldIndex < formFields.length - 1) {
      setCurrentFieldIndex(currentFieldIndex + 1)
    }
  }

  const handleBack = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(currentFieldIndex - 1)
    }
  }

  const handleSaveDraft = async (silent = false) => {
    setSaving(true)
    try {
      const dataToSave = { ...formData }
      if (editingFormId) {
        dataToSave.id = editingFormId
      }
      if (selectedProjectId) {
        dataToSave.project_id = selectedProjectId
      }

      const result = await saveDraftForm(profile.id, dataToSave)

      if (result.success) {
        if (!silent) {
          showMessage("Draft saved successfully!", "success")
        }
        if (result.data && !editingFormId) {
          setEditingFormId(result.data.id)
        }

        // Update the local forms state with the updated data
        if (result.data) {
          setForms((prevForms) => {
            const existingIndex = prevForms.findIndex((form) => form.id === result.data.id)
            if (existingIndex >= 0) {
              // Update existing form
              const updatedForms = [...prevForms]
              updatedForms[existingIndex] = result.data
              return updatedForms
            } else {
              // Add new form
              return [result.data, ...prevForms]
            }
          })
          setFilteredForms((prevForms) => {
            const existingIndex = prevForms.findIndex((form) => form.id === result.data.id)
            if (existingIndex >= 0) {
              // Update existing form
              const updatedForms = [...prevForms]
              updatedForms[existingIndex] = result.data
              return updatedForms
            } else {
              // Add new form
              return [result.data, ...prevForms]
            }
          })
        }

        return result
      } else {
        showMessage(result.error || "Failed to save draft", "error")
        return result
      }
    } catch (error) {
      console.error("Save draft exception:", error)
      showMessage("Error saving draft", "error")
      return { success: false, error: "Save draft exception" }
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const dataToSubmit = { ...formData }
      if (editingFormId) {
        dataToSubmit.id = editingFormId
      }
      if (selectedProjectId) {
        dataToSubmit.project_id = selectedProjectId
      }

      const result = await submitForm(profile.id, dataToSubmit)

      if (result.success) {
        showMessage("Form submitted successfully!", "success")
        setIsFormOpen(false)
        setCurrentFieldIndex(0)
        setFormData({})
        setEditingFormId(null)
        setEditingForm(null)
        setSelectedProjectId(null)
        await loadForms(profile.id)
      } else {
        showMessage(result.error || "Failed to submit form", "error")
      }
    } catch (error) {
      console.error("Submit form exception:", error)
      showMessage("Error submitting form", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const isCurrentFieldValid = () => {
    const currentField = formFields[currentFieldIndex]
    const value = formData[currentField.name] || ""

    if (currentField.required && !value.trim()) {
      return false
    }
    return true
  }

  // Add this function to check if all required fields are filled
  const areAllRequiredFieldsFilled = () => {
    const requiredFields = formFields.filter((field) => field.required)
    return requiredFields.every((field) => {
      const value = formData[field.name] || ""
      return value.trim() !== ""
    })
  }

  // Function to extract and display the "sent back" reason from notes
  const getSentBackReason = (notes: string | undefined): string | null => {
    if (!notes) return null

    const sentBackMatch = notes.match(/Sent back by Program Officer: (.+?)(?:\n|$)/i)
    return sentBackMatch ? sentBackMatch[1].trim() : null
  }

  // Function to check if form was sent back
  const isFormSentBack = (form: FormSubmission): boolean => {
    return form.status === "draft" && form.notes && form.notes.includes("Sent back by Program Officer")
  }

  const renderField = () => {
    const field = formFields[currentFieldIndex]
    const value = formData[field.name] || ""

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && field.type !== "textarea") {
        e.preventDefault()
        if (isCurrentFieldValid()) {
          handleNext()
        }
      }
    }

    switch (field.type) {
      case "text":
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={field.placeholder}
            className="w-full"
          />
        )
      case "number":
      case "currency":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={field.placeholder}
            min="0"
            className="w-full"
          />
        )
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
          />
        )
      case "select":
        return (
          <Select value={value} onValueChange={handleFieldChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option.toLowerCase()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full"
          />
        )
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Submitted</Badge>
      case "reviewed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Reviewed</Badge>
      case "approved":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Approved</Badge>
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Draft</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const clearFilters = () => {
    setSearchTerm("")
    setDateFilter("")
    setGroupFilter("")
    setStatusFilter("all")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4"
            style={{ borderColor: "#009edb", borderTopColor: "transparent" }}
          ></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Card className="w-full max-w-md">
          <CardContent className="text-center space-y-4 p-6">
            <AlertCircle className="h-12 w-12 mx-auto" style={{ color: "#009edb" }} />
            <h2 className="text-xl font-semibold" style={{ color: "#009edb" }}>
              Error
            </h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full" style={{ backgroundColor: "#009edb" }}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const navigationItems = [
    { icon: BarChart3, label: "Dashboard", href: "/branch-report-officer" },
    { icon: FileText, label: "Forms", href: "/branch-report-officer/forms" },
  ]

  const currentField = formFields[currentFieldIndex]
  const progress = ((currentFieldIndex + 1) / formFields.length) * 100

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-16 transition-transform duration-300 lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ backgroundColor: "#009edb" }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16">
            <div className="bg-white p-2 rounded-lg">
              <PieChart className="h-6 w-6" style={{ color: "#009edb" }} />
            </div>
          </div>

          <nav className="flex-1 p-2 space-y-1">
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="flex items-center justify-center w-full p-3 rounded-lg text-white hover:bg-opacity-80 transition-colors"
                title={item.label}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            ))}
          </nav>

          <div className="p-2">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center w-full p-3 rounded-lg text-white hover:bg-opacity-80 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="flex h-16 items-center justify-between border-b bg-white px-4 lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-gray-900">Branch Report Officer</h1>
          <div className="w-8" />
        </div>

        <div className="p-6 flex-1 overflow-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Financial Inclusion Report Forms</h1>
            <p className="text-muted-foreground">Create and manage your monthly financial inclusion reports</p>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div className="mb-6">
              <Alert
                className={saveMessageType === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}
              >
                {saveMessageType === "error" ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <AlertDescription className={saveMessageType === "error" ? "text-red-700" : "text-green-700"}>
                  {saveMessage}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search forms by title, group, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-40"
                  placeholder="Filter by date"
                />
                <Input
                  placeholder="Filter by group"
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="w-40"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={clearFilters} variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button onClick={() => loadForms(profile.id)} variant="outline" disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </div>

          {/* Add Form Button */}
          <div className="mb-6">
            <Button onClick={handleAddForm} size="lg" style={{ backgroundColor: "#009edb" }}>
              <Plus className="mr-2 h-5 w-5" />
              Add New Form
            </Button>
          </div>

          {/* Forms List */}
          {filteredForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredForms.map((form) => (
                <Card key={form.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                          {form.group_name || form.title}
                        </CardTitle>
                      </div>
                      {getStatusBadge(form.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Show sent back reason if applicable */}
                      {isFormSentBack(form) && (
                        <Alert className="border-orange-200 bg-orange-50">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <AlertDescription className="text-orange-700">
                            <div className="font-medium mb-1">Sent back by Program Officer:</div>
                            <div className="text-sm">{getSentBackReason(form.notes)}</div>
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => handleEditForm(form.id)}
                          disabled={
                            form.status === "submitted" || form.status === "reviewed" || form.status === "approved"
                          }
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {form.status === "submitted" || form.status === "reviewed" || form.status === "approved"
                            ? "View"
                            : "Edit"}
                        </Button>
                        {form.status === "draft" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteForm(form.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No forms found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || dateFilter || groupFilter || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by creating your first form"}
              </p>
              <Button onClick={handleAddForm} style={{ backgroundColor: "#009edb" }}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Form
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Project Selection Dialog */}
      <ProjectSelectionDialog
        isOpen={showProjectSelection}
        onClose={() => setShowProjectSelection(false)}
        onSelectProject={handleProjectSelected}
        branchId={profile?.branch_id}
      />

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" onInteractOutside={handleCloseForm}>
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <DialogTitle className="text-lg font-semibold">
              {editingFormId ? "Edit" : "Create"} Financial Inclusion Report
            </DialogTitle>
          </DialogHeader>

          {/* Show sent back reason prominently at the top of the form */}
          {editingForm && isFormSentBack(editingForm) && (
            <Alert className="border-orange-200 bg-orange-50 mb-6">
              <MessageSquare className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700">
                <div className="font-medium mb-2">This form was sent back by the Program Officer:</div>
                <div className="bg-white p-3 rounded border text-sm">"{getSentBackReason(editingForm.notes)}"</div>
                <div className="text-xs mt-2 text-orange-600">
                  Please address the feedback above and resubmit the form.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>
                {currentFieldIndex + 1} of {formFields.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: "#009edb",
                }}
              ></div>
            </div>
          </div>

          {/* Current Field */}
          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor={currentField.id} className="text-base font-medium">
                {currentField.label}
                {currentField.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {currentField.description && <p className="text-sm text-muted-foreground">{currentField.description}</p>}
              {renderField()}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-3 flex-1">
              {currentFieldIndex > 0 && (
                <Button variant="outline" onClick={handleBack} className="flex-1 bg-transparent">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}

              {currentFieldIndex < formFields.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!isCurrentFieldValid()}
                  className="flex-1"
                  style={{ backgroundColor: "#009edb" }}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <div className="flex gap-2 flex-1">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const result = await handleSaveDraft(true)
                      if (result && result.success) {
                        setIsFormOpen(false)
                        setCurrentFieldIndex(0)
                        setFormData({})
                        setEditingFormId(null)
                        setEditingForm(null)
                      }
                    }}
                    disabled={saving}
                    className="flex-1"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Save Draft"}
                  </Button>
                  {areAllRequiredFieldsFilled() && (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1"
                      style={{ backgroundColor: "#009edb" }}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {submitting ? "Submitting..." : "Submit"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showCloseConfirmation}
        onClose={() => setShowCloseConfirmation(false)}
        onConfirm={handleConfirmClose}
        title="Close Form?"
        description="Your progress has been automatically saved as a draft. Do you want to close this form?"
        confirmText="Yes, Close"
        cancelText="Continue Editing"
        variant="default"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDeleteForm}
        title="Delete Form?"
        description="Are you sure you want to delete this form? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  )
}

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Search,
  FileText,
  Edit,
  Users,
  Target,
  Menu,
  X,
  LogOut,
  AlertCircle,
  Filter,
  RefreshCw,
  CheckCircle,
  Info,
  DollarSign,
  Save,
  Send,
  ArrowLeft,
  Clock,
  User,
  MapPin,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase-client"
import { getUserProfile } from "@/lib/auth"
import {
  getFormsByBranch,
  getFormStatistics,
  type FormSubmission,
  sendFormBack,
  updateFormByProgramOfficer,
  markFormAsRead,
} from "@/lib/enhanced-forms-actions"
import { BarChart3 } from "lucide-react"

interface EditFormDialogProps {
  form: FormSubmission
  isOpen: boolean
  onClose: () => void
  onSave: (formData: any) => void
  onSendBack: (reason: string) => void
  onMarkAsRead: () => void
}

const EditFormDialog: React.FC<EditFormDialogProps> = ({ form, isOpen, onClose, onSave, onSendBack, onMarkAsRead }) => {
  const [formData, setFormData] = useState<any>({})
  const [sendBackReason, setSendBackReason] = useState("")
  const [showSendBackInput, setShowSendBackInput] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (form) {
      setFormData({
        // All 30 fields from branch-report-officer forms
        group_name: form.group_name || "",
        location: form.location || "",
        credit_sources: form.credit_sources || "",
        num_mfis: form.num_mfis || 0,
        groups_bank_account: form.groups_bank_account || 0,
        members_bank_account: form.members_bank_account || 0,
        inactive_accounts: form.inactive_accounts || 0,
        num_insurers: form.num_insurers || 0,
        members_insurance: form.members_insurance || 0,
        borrowed_groups: form.borrowed_groups || 0,
        members_applying_loans: form.members_applying_loans || 0,
        loan_amount_applied: form.loan_amount_applied || 0,
        date_loan_applied: form.date_loan_applied || "",
        loan_amount_approved: form.loan_amount_approved || 0,
        members_received_loans: form.members_received_loans || 0,
        date_loan_received: form.date_loan_received || "",
        members_complaining_delay: form.members_complaining_delay || 0,
        loan_uses: form.loan_uses || 0,
        loan_default: form.loan_default || 0,
        loan_delinquency: form.loan_delinquency || 0,
        loan_dropout: form.loan_dropout || 0,
        money_fraud: form.money_fraud || 0,
        trust_erosion: form.trust_erosion || "",
        documentation_delay: form.documentation_delay || "",
        loan_cost_high: form.loan_cost_high || 0,
        explain_barriers: form.explain_barriers || "",
        number_of_groups: form.number_of_groups || 0,
        members_at_start: form.members_at_start || 0,
        members_at_end: form.members_at_end || 0,
        bros_at_start: form.bros_at_start || 0,
        bros_at_end: form.bros_at_end || 0,
        notes: form.notes || "",
      })
    }
  }, [form])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(formData)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleSendBack = () => {
    if (sendBackReason.trim()) {
      onSendBack(sendBackReason)
      setSendBackReason("")
      setShowSendBackInput(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Review Form: {form?.group_name || "Unknown Group"}
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>
                Submitted by: <span className="font-medium">{form?.creator_name || "Branch Report Officer"}</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{form?.submitted_at ? new Date(form.submitted_at).toLocaleDateString() : "Unknown Date"}</span>
            </div>
            <Badge
              className={
                form?.status === "submitted"
                  ? "bg-blue-100 text-blue-800"
                  : form?.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
              }
            >
              {form?.status || "Unknown"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* All 30+ form fields in one long form - exactly as they appear in program-officer forms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="group_name">Group name *</Label>
              <Input
                id="group_name"
                value={formData.group_name || ""}
                onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                placeholder="Enter the group name"
              />
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter the location"
              />
            </div>

            <div>
              <Label htmlFor="credit_sources">Credit sources/ Bank /MFIs Name *</Label>
              <Input
                id="credit_sources"
                value={formData.credit_sources || ""}
                onChange={(e) => setFormData({ ...formData, credit_sources: e.target.value })}
                placeholder="Enter credit sources, bank or MFI names"
              />
            </div>

            <div>
              <Label htmlFor="num_mfis">Number of MFIs accessing the area *</Label>
              <Input
                id="num_mfis"
                type="number"
                value={formData.num_mfis || ""}
                onChange={(e) => setFormData({ ...formData, num_mfis: Number.parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="groups_bank_account">Groups with Bank Account *</Label>
              <Input
                id="groups_bank_account"
                type="number"
                value={formData.groups_bank_account || ""}
                onChange={(e) =>
                  setFormData({ ...formData, groups_bank_account: Number.parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="members_bank_account">Members with Bank Account *</Label>
              <Input
                id="members_bank_account"
                type="number"
                value={formData.members_bank_account || ""}
                onChange={(e) =>
                  setFormData({ ...formData, members_bank_account: Number.parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="inactive_accounts">Members with inactive accounts (churn accounts) *</Label>
              <Input
                id="inactive_accounts"
                type="number"
                value={formData.inactive_accounts || ""}
                onChange={(e) => setFormData({ ...formData, inactive_accounts: Number.parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="num_insurers">Number of insurers in the area *</Label>
              <Input
                id="num_insurers"
                type="number"
                value={formData.num_insurers || ""}
                onChange={(e) => setFormData({ ...formData, num_insurers: Number.parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="members_insurance">No. of members with Insurance (agricultural/livestock/credit) *</Label>
              <Input
                id="members_insurance"
                type="number"
                value={formData.members_insurance || ""}
                onChange={(e) => setFormData({ ...formData, members_insurance: Number.parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="borrowed_groups">No. of borrowed groups *</Label>
              <Input
                id="borrowed_groups"
                type="number"
                value={formData.borrowed_groups || ""}
                onChange={(e) => setFormData({ ...formData, borrowed_groups: Number.parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="members_applying_loans">Number of group Members applying loans *</Label>
              <Input
                id="members_applying_loans"
                type="number"
                value={formData.members_applying_loans || ""}
                onChange={(e) =>
                  setFormData({ ...formData, members_applying_loans: Number.parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="loan_amount_applied">Amount of loan applied *</Label>
              <Input
                id="loan_amount_applied"
                type="number"
                value={formData.loan_amount_applied || ""}
                onChange={(e) =>
                  setFormData({ ...formData, loan_amount_applied: Number.parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
              />
              <p className="text-sm text-gray-500 mt-1">Amount in Tanzanian Shillings (TZS)</p>
            </div>

            <div>
              <Label htmlFor="date_loan_applied">Date loan applied *</Label>
              <Input
                id="date_loan_applied"
                type="date"
                value={formData.date_loan_applied || ""}
                onChange={(e) => setFormData({ ...formData, date_loan_applied: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="loan_amount_approved">Amount of Loan(approved/received) *</Label>
              <Input
                id="loan_amount_approved"
                type="number"
                value={formData.loan_amount_approved || ""}
                onChange={(e) =>
                  setFormData({ ...formData, loan_amount_approved: Number.parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
              />
              <p className="text-sm text-gray-500 mt-1">Amount in Tanzanian Shillings (TZS)</p>
            </div>

            <div>
              <Label htmlFor="members_received_loans">No. of members received loans *</Label>
              <Input
                id="members_received_loans"
                type="number"
                value={formData.members_received_loans || ""}
                onChange={(e) =>
                  setFormData({ ...formData, members_received_loans: Number.parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="date_loan_received">Date loan received *</Label>
              <Input
                id="date_loan_received"
                type="date"
                value={formData.date_loan_received || ""}
                onChange={(e) => setFormData({ ...formData, date_loan_received: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="members_complaining_delay">
                No. of members complaining long disbursement lead time *
              </Label>
              <Input
                id="members_complaining_delay"
                type="number"
                value={formData.members_complaining_delay || ""}
                onChange={(e) =>
                  setFormData({ ...formData, members_complaining_delay: Number.parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="loan_default">Loan on default *</Label>
              <Input
                id="loan_default"
                type="number"
                value={formData.loan_default || ""}
                onChange={(e) => setFormData({ ...formData, loan_default: Number.parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-sm text-gray-500 mt-1">Amount in Tanzanian Shillings (TZS)</p>
            </div>

            <div>
              <Label htmlFor="loan_delinquency">Loan on delinquency *</Label>
              <Input
                id="loan_delinquency"
                type="number"
                value={formData.loan_delinquency || ""}
                onChange={(e) => setFormData({ ...formData, loan_delinquency: Number.parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-sm text-gray-500 mt-1">Amount in Tanzanian Shillings (TZS)</p>
            </div>

            <div>
              <Label htmlFor="loan_dropout">Loan Dropout members/ groups *</Label>
              <Input
                id="loan_dropout"
                type="number"
                value={formData.loan_dropout || ""}
                onChange={(e) => setFormData({ ...formData, loan_dropout: Number.parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="money_fraud">Money fraud incidence</Label>
              <Input
                id="money_fraud"
                type="number"
                value={formData.money_fraud || ""}
                onChange={(e) => setFormData({ ...formData, money_fraud: Number.parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="trust_erosion">Trust erosion in MFIs</Label>
              <Input
                id="trust_erosion"
                type="number"
                value={formData.trust_erosion || ""}
                onChange={(e) => setFormData({ ...formData, trust_erosion: Number.parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="documentation_delay">Documentation delay</Label>
              <Input
                id="documentation_delay"
                type="number"
                value={formData.documentation_delay || ""}
                onChange={(e) =>
                  setFormData({ ...formData, documentation_delay: Number.parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="number_of_groups">Number of groups *</Label>
              <Input
                id="number_of_groups"
                type="number"
                value={formData.number_of_groups || ""}
                onChange={(e) => setFormData({ ...formData, number_of_groups: Number.parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="members_at_start">Number of members at start *</Label>
              <Input
                id="members_at_start"
                type="number"
                value={formData.members_at_start || ""}
                onChange={(e) => setFormData({ ...formData, members_at_start: Number.parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="members_at_end">Number of members at end *</Label>
              <Input
                id="members_at_end"
                type="number"
                value={formData.members_at_end || ""}
                onChange={(e) => setFormData({ ...formData, members_at_end: Number.parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="bros_at_start">Number of BROs at start *</Label>
              <Input
                id="bros_at_start"
                type="number"
                value={formData.bros_at_start || ""}
                onChange={(e) => setFormData({ ...formData, bros_at_start: Number.parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="bros_at_end">Number of BROs at end *</Label>
              <Input
                id="bros_at_end"
                type="number"
                value={formData.bros_at_end || ""}
                onChange={(e) => setFormData({ ...formData, bros_at_end: Number.parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Textarea fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="loan_uses">Loan uses (write only members with 3 value chain activities) *</Label>
              <Input
                id="loan_uses"
                type="number"
                value={formData.loan_uses || ""}
                onChange={(e) => setFormData({ ...formData, loan_uses: Number.parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="loan_cost_high">Loan cost-high? Ask members.</Label>
              <Input
                type="number"
                id="loan_cost_high"
                value={formData.loan_cost_high || ""}
                onChange={(e) => setFormData({ ...formData, loan_cost_high: e.target.value })}
                placeholder="0"
                min="0"
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="explain_barriers">
                Explain barriers for no loans/ no bank account/not approved by bank, no insurance etc.
              </Label>
              <Textarea
                id="explain_barriers"
                value={formData.explain_barriers || ""}
                onChange={(e) => setFormData({ ...formData, explain_barriers: e.target.value })}
                placeholder="Explain barriers preventing access to financial services"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes..."
                rows={4}
              />
            </div>
          </div>

          {/* Send Back Section */}
          {showSendBackInput && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <Label htmlFor="sendback_reason">Reason for sending back *</Label>
              <Textarea
                id="sendback_reason"
                value={sendBackReason}
                onChange={(e) => setSendBackReason(e.target.value)}
                placeholder="Please provide a reason for sending this form back..."
                rows={3}
                className="mt-2"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button onClick={onClose} variant="outline" className="flex-1 bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>

            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#009edb] hover:bg-[#007bb5]">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>

            <Button onClick={onMarkAsRead} className="flex-1 bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Read
            </Button>

            {!showSendBackInput ? (
              <Button
                onClick={() => setShowSendBackInput(true)}
                variant="outline"
                className="flex-1 text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Back
              </Button>
            ) : (
              <Button
                onClick={handleSendBack}
                disabled={!sendBackReason.trim()}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Back
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AssistanceProgramOfficerFormsPage() {
  const [forms, setForms] = useState<FormSubmission[]>([])
  const [filteredForms, setFilteredForms] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("success")
  const [statistics, setStatistics] = useState<any>(null)
  // Replaced viewingForm with editingForm
  const [editingForm, setEditingForm] = useState<FormSubmission | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true)
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push("/")
          return
        }

        const profileResult = await getUserProfile(user.id)
        if (profileResult.error || !profileResult.profile) {
          setError("Failed to load profile")
          return
        }

        const userProfile = profileResult.profile

        if (userProfile.role !== "assistance_program_officer") {
          router.push("/")
          return
        }

        if (userProfile.status !== "active") {
          setError("Your account is not active. Please contact administrator.")
          return
        }

        setProfile(userProfile)
        await Promise.all([loadForms(userProfile.branch_id), loadStatistics(userProfile.branch_id)])
      } catch (error) {
        console.error("Error loading user data:", error)
        setError("Failed to load user data")
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  const loadForms = async (branchId: string) => {
    try {
      setRefreshing(true)
      console.log("[v0] Loading forms for branch:", branchId)
      const result = await getFormsByBranch(branchId)
      if (result.success && result.data) {
        console.log("[v0] Forms loaded:", result.data.length)
        setForms(result.data)
        setFilteredForms(result.data)
      } else {
        showMessage(result.error || "Failed to load forms", "error")
      }
    } catch (error) {
      console.error("[v0] Error loading forms:", error)
      showMessage("Error loading forms", "error")
    } finally {
      setRefreshing(false)
    }
  }

  const loadStatistics = async (branchId: string) => {
    try {
      const result = await getFormStatistics(branchId)
      if (result.success && result.data) {
        setStatistics(result.data)
      }
    } catch (error) {
      console.error("Error loading statistics:", error)
    }
  }

  const showMessage = (message: string, type: "success" | "error" = "success") => {
    setMessage(message)
    setMessageType(type)
    setTimeout(() => setMessage(""), type === "error" ? 7000 : 3000)
  }

  useEffect(() => {
    let filtered = forms

    if (searchTerm) {
      filtered = filtered.filter(
        (form) =>
          form.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (form.creator_name && form.creator_name.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((form) => form.status === statusFilter)
    }

    setFilteredForms(filtered)
  }, [forms, searchTerm, statusFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Submitted</Badge>
      case "reviewed":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Under Review</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
  }

  const navigationItems = [
    { icon: BarChart3, label: "Dashboard", href: "/assistance-program-officer", active: false },
    { icon: FileText, label: "Forms", href: "/assistance-program-officer/forms", active: true },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleEditForm = (form: FormSubmission) => {
    setEditingForm(form)
  }

  const handleSaveForm = async (formData: any) => {
    if (!editingForm) return

    try {
      const result = await updateFormByProgramOfficer(editingForm.id, profile.id, formData)
      if (result.success) {
        showMessage("Form updated successfully!", "success")
        await loadForms(profile.branch_id)
      } else {
        showMessage(result.error || "Failed to update form", "error")
      }
    } catch (error) {
      showMessage("Error updating form", "error")
    }
  }

  const handleSendBack = async (reason: string) => {
    if (!editingForm) return

    try {
      const result = await sendFormBack(editingForm.id, profile.id, reason)
      if (result.success) {
        showMessage("Form sent back successfully!", "success")
        await loadForms(profile.branch_id)
      } else {
        showMessage(result.error || "Failed to send form back", "error")
      }
    } catch (error) {
      showMessage("Error sending form back", "error")
    }
  }

  const handleMarkAsRead = async () => {
    if (!editingForm) return

    try {
      console.log("[v0] Attempting to mark form as read:", editingForm.id)
      const result = await markFormAsRead(editingForm.id, profile.id)
      if (result.success) {
        console.log("[v0] Form marked as read successfully")
        showMessage("Form marked as read!", "success")
        setEditingForm(null)
        await loadForms(profile.branch_id)
      } else {
        console.error("[v0] Failed to mark form as read:", result.error)
        showMessage(result.error || "Failed to mark form as read", "error")
      }
    } catch (error) {
      console.error("[v0] Error marking form as read:", error)
      showMessage("Error marking form as read", "error")
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#009edb] border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading forms...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Card className="w-full max-w-md">
          <CardContent className="text-center space-y-4 p-6">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-600">Access Error</h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => router.push("/")} className="w-full bg-red-600 hover:bg-red-700">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div
        className={`
          fixed inset-y-0 left-0 z-50 bg-[#009edb] transition-all duration-300 lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${sidebarCollapsed ? "w-16" : "w-64"}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="bg-white p-2 rounded-lg shadow-md">
                  <Target className="h-6 w-6 text-[#009edb]" />
                </div>
                <div className="text-white">
                  <h2 className="font-semibold text-sm">Assistance PO</h2>
                  <p className="text-xs text-blue-100">HIH Financial</p>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="flex items-center justify-center w-full">
                <div className="bg-white p-2 rounded-lg shadow-md">
                  <Target className="h-6 w-6 text-[#009edb]" />
                </div>
              </div>
            )}

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-white hover:bg-blue-500 transition-colors"
            >
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`
                  flex items-center gap-3 w-full p-3 rounded-lg text-white transition-all duration-200
                  ${item.active ? "bg-white/20 shadow-lg" : "hover:bg-white/10"}
                  ${sidebarCollapsed ? "justify-center" : ""}
                `}
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>

          <div className="p-4">
            <button
              onClick={handleSignOut}
              className={`
                flex items-center gap-3 w-full p-3 rounded-lg text-white hover:bg-white/10 transition-colors
                ${sidebarCollapsed ? "justify-center" : ""}
              `}
              title={sidebarCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex h-16 items-center justify-between border-b bg-white px-4 lg:hidden shadow-sm">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-gray-900">Forms</h1>
          <div className="w-8" />
        </div>

        <div className="hidden lg:flex h-20 items-center justify-between border-b bg-white px-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Branch Report Forms</h1>
            <p className="text-gray-600 text-sm mt-1">View forms submitted by Branch Report Officers</p>
          </div>
          <Button
            onClick={() => loadForms(profile.branch_id)}
            variant="outline"
            disabled={refreshing}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-6">
          {message && (
            <div className="mb-8">
              <Alert
                className={`shadow-md ${messageType === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}
              >
                {messageType === "error" ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <AlertDescription className={messageType === "error" ? "text-red-700" : "text-green-700"}>
                  {message}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Forms</p>
                    <p className="text-2xl font-bold">{statistics?.total_forms || 0}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Submitted</p>
                    <p className="text-2xl font-bold">{statistics?.submitted_forms || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Members</p>
                    <p className="text-2xl font-bold">{Math.round(statistics?.avg_members || 0)}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Loans</p>
                    <p className="text-lg font-bold">{formatCurrency(statistics?.total_loan_approved || 0)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by group name or submitted by..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="reviewed">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={clearFilters} variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </div>

          {filteredForms.length > 0 ? (
            <div className="space-y-4">
              {filteredForms.map((form) => (
                <Card key={form.id} className="bg-white shadow-sm border hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{form.group_name}</h3>
                          {getStatusBadge(form.status)}
                          {(form as any).reviewed && (
                            <CheckCircle
                              className="h-5 w-5 text-green-600"
                              title="Reviewed by Business Development Officer"
                            />
                          )}
                          {form.status === "approved" && <CheckCircle className="h-5 w-5 text-green-600" />}
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Submitted by: {form.creator_name || "Unknown User"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(form.submitted_at || form.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{form.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleEditForm(form)}
                          className="bg-[#009edb] hover:bg-[#007bb5] text-white"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Review
                        </Button>
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
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "No forms have been submitted by Branch Report Officers yet"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-blue-700">
                    Forms submitted by Branch Report Officers in your branch will appear here automatically.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {editingForm && (
        <EditFormDialog
          form={editingForm}
          isOpen={!!editingForm}
          onClose={() => setEditingForm(null)}
          onSave={handleSaveForm}
          onSendBack={handleSendBack}
          onMarkAsRead={handleMarkAsRead}
        />
      )}
    </div>
  )
}

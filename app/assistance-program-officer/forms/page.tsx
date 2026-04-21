"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search,
  FileText,
  Eye,
  AlertCircle,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getUserProfile } from "@/lib/auth"
import {
  getFormsByBranch,
  getFormStatistics,
  type FormSubmission,
  markFormAsRead,
} from "@/lib/enhanced-forms-actions"
import RoleLayout from "@/components/role-layout"
import { FormFieldsEditor, formSubmissionToData } from "@/components/form-fields-editor"

// ---------- View-Only Dialog ----------
interface ViewFormDialogProps {
  form: FormSubmission
  isOpen: boolean
  onClose: () => void
  onMarkAsRead: () => void
  marking: boolean
}

function ViewFormDialog({ form, isOpen, onClose, onMarkAsRead, marking }: ViewFormDialogProps) {
  const formData = formSubmissionToData(form)
  const alreadyRead = form.status === "under_review" || form.status === "approved"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Review Form: {form?.group_name || "Unknown Group"}
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {form?.creator_name || "Branch Report Officer"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {form?.submitted_at ? new Date(form.submitted_at).toLocaleDateString() : "Unknown"}
            </span>
            <Badge className={
              form?.status === "submitted" ? "bg-blue-100 text-blue-800" :
              form?.status === "approved" ? "bg-green-100 text-green-800" :
              form?.status === "under_review" ? "bg-yellow-100 text-yellow-800" :
              "bg-gray-100 text-gray-800"
            }>
              {form?.status?.replace("_", " ")}
            </Badge>
          </div>
        </DialogHeader>

        {/* Read-only form fields */}
        <FormFieldsEditor formData={formData} onChange={() => {}} readOnly={true} />

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t mt-4">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Close
          </Button>
          {!alreadyRead && (
            <Button
              onClick={onMarkAsRead}
              disabled={marking}
              className="flex-1 bg-[#009edb] hover:bg-[#007bb5] text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {marking ? "Marking..." : "Mark as Read"}
            </Button>
          )}
          {alreadyRead && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium px-3">
              <CheckCircle2 className="h-4 w-4" />
              Already marked as read
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Main Page ----------
export default function AssistanceProgramOfficerFormsPage() {
  const [forms, setForms] = useState<FormSubmission[]>([])
  const [filteredForms, setFilteredForms] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("success")
  const [statistics, setStatistics] = useState<any>(null)
  const [viewingForm, setViewingForm] = useState<FormSubmission | null>(null)
  const [marking, setMarking] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true)
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) { router.push("/"); return }

        const profileResult = await getUserProfile(user.id)
        if (profileResult.error || !profileResult.profile) {
          setError("Failed to load profile"); setLoading(false); return
        }

        const userProfile = profileResult.profile
        const allowedRoles = ["assistance_program_officer", "business_development_officer"]
        if (!allowedRoles.includes(userProfile.role)) { router.push("/"); return }

        setProfile(userProfile)

        if (!userProfile.branch_id) {
          setError("No branch assigned. Please contact an administrator.")
          setLoading(false); return
        }

        await loadForms(userProfile.branch_id)
        const statsResult = await getFormStatistics(userProfile.branch_id)
        if (statsResult.success) setStatistics(statsResult.data)
      } catch {
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }
    loadUserData()
  }, [router])

  async function loadForms(branchId: string) {
    setRefreshing(true)
    try {
      const result = await getFormsByBranch(branchId)
      if (result.success && result.data) {
        setForms(result.data)
        applyFilters(result.data, searchTerm, statusFilter)
      }
    } finally {
      setRefreshing(false)
    }
  }

  function applyFilters(data: FormSubmission[], search: string, status: string) {
    let filtered = [...data]
    if (status !== "all") filtered = filtered.filter((f) => f.status === status)
    if (search.trim()) {
      const lower = search.toLowerCase()
      filtered = filtered.filter(
        (f) =>
          f.group_name?.toLowerCase().includes(lower) ||
          f.location?.toLowerCase().includes(lower) ||
          f.creator_name?.toLowerCase().includes(lower),
      )
    }
    setFilteredForms(filtered)
  }

  useEffect(() => { applyFilters(forms, searchTerm, statusFilter) }, [searchTerm, statusFilter, forms])

  function showMessage(msg: string, type: "success" | "error") {
    setMessage(msg); setMessageType(type)
    setTimeout(() => setMessage(""), 4000)
  }

  async function handleMarkAsRead() {
    if (!viewingForm || !profile) return
    setMarking(true)
    try {
      const result = await markFormAsRead(viewingForm.id, profile.id)
      if (result.success) {
        showMessage("Form marked as read", "success")
        setViewingForm(null)
        await loadForms(profile.branch_id)
      } else {
        showMessage(result.error || "Failed to mark form as read", "error")
      }
    } finally {
      setMarking(false)
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700",
      submitted: "bg-blue-100 text-blue-700",
      under_review: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      sent_back: "bg-orange-100 text-orange-700",
    }
    return map[status] || "bg-gray-100 text-gray-700"
  }

  if (loading) {
    return (
      <RoleLayout userRole="assistance_program_officer">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#009edb] border-t-transparent mx-auto" />
            <p className="mt-2 text-gray-600">Loading forms...</p>
          </div>
        </div>
      </RoleLayout>
    )
  }

  if (error) {
    return (
      <RoleLayout userRole="assistance_program_officer">
        <div className="flex h-full items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="text-center space-y-4 p-6">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
              <h2 className="text-xl font-semibold text-red-600">Error</h2>
              <p className="text-gray-600">{error}</p>
              <Button onClick={() => router.push("/assistance-program-officer")} className="w-full bg-[#009edb] hover:bg-[#0087c0]">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </RoleLayout>
    )
  }

  return (
    <RoleLayout userRole="assistance_program_officer" userName={profile?.full_name}>
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Header */}
        <div className="flex h-20 items-center justify-between border-b bg-white px-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Inclusion Forms</h1>
            <p className="text-gray-600 text-sm mt-1">View and mark forms as read</p>
          </div>
          <Button onClick={() => loadForms(profile?.branch_id)} variant="outline" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {message && (
            <Alert className={messageType === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertDescription className={messageType === "success" ? "text-green-700" : "text-red-700"}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Stats */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total", value: statistics.total || 0 },
                { label: "Submitted", value: statistics.submitted || 0 },
                { label: "Approved", value: statistics.approved || 0 },
                { label: "Sent Back", value: statistics.sent_back || 0 },
              ].map((s) => (
                <Card key={s.label} className="bg-white shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search forms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="sent_back">Sent Back</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Forms List */}
          {filteredForms.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No forms found</h3>
              <p className="text-gray-500 text-sm">
                {searchTerm || statusFilter !== "all" ? "Try adjusting your filters" : "No forms submitted yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredForms.map((form) => (
                <Card key={form.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold text-gray-900 line-clamp-2">
                        {form.title || form.group_name || `Form ${form.id.slice(0, 8)}`}
                      </CardTitle>
                      <Badge className={`${statusBadge(form.status)} shrink-0 text-xs`}>
                        {form.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {form.location && <p className="text-sm text-gray-600 truncate">{form.location}</p>}
                    {form.creator_name && <p className="text-sm text-gray-500">By: {form.creator_name}</p>}
                    {form.submitted_at && (
                      <p className="text-xs text-gray-400">{new Date(form.submitted_at).toLocaleDateString()}</p>
                    )}
                    <Button
                      size="sm"
                      onClick={() => setViewingForm(form)}
                      className="w-full mt-2 bg-[#009edb] hover:bg-[#007bb5] text-white"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {viewingForm && (
        <ViewFormDialog
          form={viewingForm}
          isOpen={!!viewingForm}
          onClose={() => setViewingForm(null)}
          onMarkAsRead={handleMarkAsRead}
          marking={marking}
        />
      )}
    </RoleLayout>
  )
}

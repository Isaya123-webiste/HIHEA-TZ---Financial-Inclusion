"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  FileText,
  Search,
  Eye,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  User,
  MapPin,
  Calendar,
  Building2,
} from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getUserProfileSimple } from "@/lib/admin-actions"
import { getFormsByBranch, type FormSubmission } from "@/lib/enhanced-forms-actions"
import RoleLayout from "@/components/role-layout"

export default function BranchManagerFormsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [forms, setForms] = useState<FormSubmission[]>([])
  const [filteredForms, setFilteredForms] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewingForm, setViewingForm] = useState<FormSubmission | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !authUser) {
          router.push("/")
          return
        }

        setUser(authUser)

        const profileResult = await getUserProfileSimple(authUser.id)
        if (!profileResult.success || !profileResult.profile) {
          setError("Failed to load user profile")
          setLoading(false)
          return
        }

        const userProfile = profileResult.profile

        if (userProfile.role !== "branch_manager") {
          router.push("/")
          return
        }

        setProfile(userProfile)

        if (!userProfile.branch_id) {
          setError("No branch assigned to your account. Please contact an administrator.")
          setLoading(false)
          return
        }

        await loadForms(userProfile.branch_id)
      } catch (err) {
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  async function loadForms(branchId: string) {
    setRefreshing(true)
    try {
      const result = await getFormsByBranch(branchId)
      if (result.success && result.data) {
        // Branch manager sees ONLY approved forms
        const approvedForms = result.data.filter((f: FormSubmission) => f.status === "approved")
        setForms(approvedForms)
        setFilteredForms(approvedForms)
      } else {
        setForms([])
        setFilteredForms([])
      }
    } finally {
      setRefreshing(false)
    }
  }

  // Filter by search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredForms(forms)
      return
    }
    const lower = searchTerm.toLowerCase()
    setFilteredForms(
      forms.filter(
        (f) =>
          f.title?.toLowerCase().includes(lower) ||
          f.group_name?.toLowerCase().includes(lower) ||
          f.location?.toLowerCase().includes(lower) ||
          f.creator_name?.toLowerCase().includes(lower),
      ),
    )
  }, [searchTerm, forms])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getFormDisplayTitle = (form: FormSubmission) => {
    return form.title || form.group_name || `Form ${form.id.slice(0, 8)}`
  }

  if (loading) {
    return (
      <RoleLayout userRole="branch_manager">
        <div className="flex h-full items-center justify-center bg-white">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#009edb] border-t-transparent mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading approved forms...</p>
          </div>
        </div>
      </RoleLayout>
    )
  }

  if (error) {
    return (
      <RoleLayout userRole="branch_manager">
        <div className="flex h-full items-center justify-center bg-white">
          <Card className="w-full max-w-md">
            <CardContent className="text-center space-y-4 p-6">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
              <h2 className="text-xl font-semibold text-red-600">Error</h2>
              <p className="text-gray-600">{error}</p>
              <Button onClick={() => router.push("/branch-manager")} className="w-full bg-[#009edb] hover:bg-[#0087c0]">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </RoleLayout>
    )
  }

  return (
    <RoleLayout userRole="branch_manager" userName={profile?.full_name}>
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Header */}
        <div className="flex h-20 items-center justify-between border-b bg-white px-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Approved Forms</h1>
            <p className="text-gray-600 text-sm mt-1">
              Read-only view of all approved forms from your branch
            </p>
          </div>
          <Button
            onClick={() => loadForms(profile?.branch_id)}
            variant="outline"
            disabled={refreshing}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-white border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Approved</p>
                    <p className="text-2xl font-bold text-gray-900">{forms.length}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {
                        forms.filter((f) => {
                          const d = new Date(f.submitted_at || f.created_at)
                          const now = new Date()
                          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                        }).length
                      }
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Branch</p>
                    <p className="text-lg font-bold text-gray-900 truncate">{profile?.branch_name || "My Branch"}</p>
                  </div>
                  <div className="bg-cyan-100 p-3 rounded-full">
                    <Building2 className="h-6 w-6 text-cyan-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by title, group, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Forms List */}
          {filteredForms.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {searchTerm ? "No forms match your search" : "No approved forms yet"}
              </h3>
              <p className="text-gray-500 text-sm">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Approved forms from your branch will appear here"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredForms.map((form) => (
                <Card
                  key={form.id}
                  className="bg-white border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setViewingForm(form)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold text-gray-900 line-clamp-2">
                        {getFormDisplayTitle(form)}
                      </CardTitle>
                      <Badge className="bg-green-100 text-green-700 border-green-200 shrink-0 text-xs">
                        Approved
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {form.group_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{form.group_name}</span>
                      </div>
                    )}
                    {form.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{form.location}</span>
                      </div>
                    )}
                    {form.creator_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">By: {form.creator_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{formatDate(form.reviewed_at || form.submitted_at || form.created_at)}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-3 text-[#009edb] border-[#009edb] hover:bg-[#009edb]/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        setViewingForm(form)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Dialog - Read Only */}
      <Dialog open={!!viewingForm} onOpenChange={() => setViewingForm(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                {viewingForm ? getFormDisplayTitle(viewingForm) : "Form Preview"}
              </DialogTitle>
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                Approved
              </Badge>
            </div>
          </DialogHeader>

          {viewingForm && (
            <div className="space-y-4 pt-2">
              {/* Meta info */}
              <Alert className="border-blue-200 bg-blue-50">
                <Eye className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700 text-sm">
                  This form has been approved and is read-only.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {viewingForm.group_name && (
                  <div>
                    <p className="text-gray-500 font-medium">Group Name</p>
                    <p className="text-gray-900">{viewingForm.group_name}</p>
                  </div>
                )}
                {viewingForm.location && (
                  <div>
                    <p className="text-gray-500 font-medium">Location</p>
                    <p className="text-gray-900">{viewingForm.location}</p>
                  </div>
                )}
                {viewingForm.creator_name && (
                  <div>
                    <p className="text-gray-500 font-medium">Submitted By</p>
                    <p className="text-gray-900">{viewingForm.creator_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500 font-medium">Approved On</p>
                  <p className="text-gray-900">{formatDate(viewingForm.reviewed_at)}</p>
                </div>
              </div>

              <hr />

              {/* Form data fields */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Form Data</h3>

                {[
                  { label: "Credit Sources", value: viewingForm.credit_sources },
                  { label: "Number of MFIs", value: viewingForm.num_mfis },
                  { label: "Groups with Bank Account", value: viewingForm.groups_bank_account },
                  { label: "Members with Bank Account", value: viewingForm.members_bank_account },
                  { label: "Inactive Accounts", value: viewingForm.inactive_accounts },
                  { label: "Number of Insurers", value: viewingForm.num_insurers },
                  { label: "Members with Insurance", value: viewingForm.members_insurance },
                  { label: "Borrowed Groups", value: viewingForm.borrowed_groups },
                  { label: "Members Applying Loans", value: viewingForm.members_applying_loans },
                  { label: "Loan Amount Applied (TZS)", value: viewingForm.loan_amount_applied?.toLocaleString() },
                  { label: "Loan Amount Approved (TZS)", value: viewingForm.loan_amount_approved?.toLocaleString() },
                  { label: "Members Received Loans", value: viewingForm.members_received_loans },
                  { label: "Loan Uses", value: viewingForm.loan_uses },
                  { label: "Loan Default", value: viewingForm.loan_default },
                  { label: "Loan Delinquency", value: viewingForm.loan_delinquency },
                  { label: "Loan Dropout", value: viewingForm.loan_dropout },
                  { label: "Money Fraud", value: viewingForm.money_fraud },
                  { label: "High Loan Cost", value: viewingForm.loan_cost_high === 1 ? "Yes" : viewingForm.loan_cost_high === 0 ? "No" : null },
                  { label: "Trust Erosion", value: viewingForm.trust_erosion },
                  { label: "Documentation Delay", value: viewingForm.documentation_delay },
                  { label: "Explain Barriers", value: viewingForm.explain_barriers },
                  { label: "Number of Groups", value: viewingForm.number_of_groups },
                  { label: "Members at Start", value: viewingForm.members_at_start },
                  { label: "Members at End", value: viewingForm.members_at_end },
                ].filter((item) => item.value !== null && item.value !== undefined && item.value !== "").map((item) => (
                  <div key={item.label} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-600 text-sm font-medium w-1/2">{item.label}</span>
                    <span className="text-gray-900 text-sm text-right w-1/2">{String(item.value)}</span>
                  </div>
                ))}
              </div>

              {/* Review notes */}
              {viewingForm.review_notes && (
                <div>
                  <p className="text-gray-500 font-medium text-sm mb-1">Review Notes</p>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border">
                    {viewingForm.review_notes}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setViewingForm(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </RoleLayout>
  )
}

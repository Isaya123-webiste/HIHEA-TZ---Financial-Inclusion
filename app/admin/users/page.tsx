"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Download,
  Upload,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  User,
  FileText,
  Users,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getAllBranches, checkAdminRole } from "@/lib/admin-actions"
import {
  getAllNonAdminUsers,
  createUserWithInvitation,
  createUserDirectActivation,
  bulkImportUsers,
  resendInvitation,
  deleteUser,
} from "@/lib/user-management-actions"
import { ToastContainer, useToast } from "@/components/toast"
import ConfirmationDialog from "@/components/confirmation-dialog"

interface AdminUser {
  id: string
  full_name: string
  email: string
  role: string
  branch_id?: string
  branch_name?: string
  phone?: string
  status: "active" | "inactive" | "pending"
  invitation_sent: boolean
  invitation_status: "sent" | "pending" | "completed" | "expired"
  created_at: string
  updated_at: string
}

interface Branch {
  id: string
  name: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterBranch, setFilterBranch] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Modals and dialogs
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  const [showSingleUserModal, setShowSingleUserModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedBranchForTemplate, setSelectedBranchForTemplate] = useState("")
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Bulk import states
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [selectedBranchForImport, setSelectedBranchForImport] = useState("")
  const [importLoading, setImportLoading] = useState(false)
  const [importResults, setImportResults] = useState<any>(null)

  // Single user form
  const [singleUserForm, setSingleUserForm] = useState({
    full_name: "",
    email: "",
    role: "",
    branch_id: "",
    phone: "",
    password: "",
  })
  const [singleUserLoading, setSingleUserLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [userCreationMethod, setUserCreationMethod] = useState<"invitation" | "direct">("invitation")

  const router = useRouter()
  const { toasts, showSuccess, showError, removeToast } = useToast()

  const roles = [
    { value: "branch_manager", label: "Branch Manager" },
    { value: "program_officer", label: "Program Officer" },
    { value: "branch_report_officer", label: "Branch Report Officer" },
  ]

  useEffect(() => {
    async function loadData() {
      try {
        // Get current user and verify admin
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push("/")
          return
        }

        setCurrentUser(user)

        // Check if user is admin
        const adminCheck = await checkAdminRole(user.id)
        if (adminCheck.error || !adminCheck.isAdmin) {
          setError("Access denied. Admin privileges required.")
          setTimeout(() => router.push("/dashboard"), 3000)
          return
        }

        // Load users (excluding admins) and branches
        const [usersResult, branchesResult] = await Promise.all([getAllNonAdminUsers(), getAllBranches()])

        if (usersResult.users) {
          setUsers(usersResult.users)
          setFilteredUsers(usersResult.users)
        } else if (usersResult.error) {
          setError(usersResult.error)
        }

        if (branchesResult.branches) {
          setBranches(branchesResult.branches)
        }
      } catch (error) {
        console.error("Load data error:", error)
        setError("Failed to load users")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.branch_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Role filter
    if (filterRole !== "all") {
      filtered = filtered.filter((user) => user.role === filterRole)
    }

    // Branch filter
    if (filterBranch !== "all") {
      filtered = filtered.filter((user) => user.branch_id === filterBranch)
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((user) => user.status === filterStatus)
    }

    setFilteredUsers(filtered)
  }, [searchTerm, filterRole, filterBranch, filterStatus, users])

  const downloadCSVTemplate = () => {
    if (!selectedBranchForTemplate) {
      showError("Please select a branch first")
      return
    }

    const selectedBranch = branches.find((b) => b.id === selectedBranchForTemplate)
    if (!selectedBranch) {
      showError("Invalid branch selected")
      return
    }

    // Create CSV template content
    const csvContent = [
      "full_name,email,role,phone",
      "John Doe,john@example.com,branch_manager,+255123456789",
      "Jane Smith,jane@example.com,program_officer,+255987654321",
      "Mike Johnson,mike@example.com,branch_report_officer,+255456789123",
    ].join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `users_template_${selectedBranch.name.replace(/\s+/g, "_")}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    setShowTemplateModal(false)
    setSelectedBranchForTemplate("")
    showSuccess(`CSV template for ${selectedBranch.name} downloaded successfully!`)
  }

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCsvFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n").filter((line) => line.trim())
      const headers = lines[0].split(",").map((h) => h.trim())

      const data = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim())
        const obj: any = {}
        headers.forEach((header, index) => {
          obj[header] = values[index] || ""
        })
        return obj
      })

      setCsvData(data)
    }
    reader.readAsText(file)
  }

  const handleBulkImport = async () => {
    if (!csvData.length || !selectedBranchForImport) {
      showError("Please upload a CSV file and select a branch")
      return
    }

    setImportLoading(true)

    try {
      const result = await bulkImportUsers(currentUser.id, csvData, selectedBranchForImport)

      if (result.success) {
        setImportResults(result.results)
        showSuccess(`Bulk import completed! ${result.results.successful.length} users created successfully.`)

        // Reload users
        const usersResult = await getAllNonAdminUsers()
        if (usersResult.users) {
          setUsers(usersResult.users)
          setFilteredUsers(usersResult.users)
        }
      } else {
        showError(result.error || "Failed to import users")
      }
    } catch (error) {
      console.error("Bulk import error:", error)
      showError("An unexpected error occurred during import")
    } finally {
      setImportLoading(false)
    }
  }

  const handleSingleUserCreate = async () => {
    if (!singleUserForm.full_name || !singleUserForm.email || !singleUserForm.role || !singleUserForm.branch_id) {
      showError("Please fill in all required fields")
      return
    }

    if (userCreationMethod === "direct" && !singleUserForm.password) {
      showError("Password is required for direct activation")
      return
    }

    setSingleUserLoading(true)

    try {
      let result

      if (userCreationMethod === "direct") {
        // Create user with direct activation (no email required)
        result = await createUserDirectActivation(currentUser.id, singleUserForm)
      } else {
        // Create user with invitation email
        result = await createUserWithInvitation(currentUser.id, singleUserForm)
      }

      if (result.success) {
        const message =
          userCreationMethod === "direct"
            ? `User ${singleUserForm.full_name} created and activated successfully!`
            : `User ${singleUserForm.full_name} created successfully! Invitation email will be sent.`

        showSuccess(message)
        setShowSingleUserModal(false)
        setSingleUserForm({ full_name: "", email: "", role: "", branch_id: "", phone: "", password: "" })

        // Reload users
        const usersResult = await getAllNonAdminUsers()
        if (usersResult.users) {
          setUsers(usersResult.users)
          setFilteredUsers(usersResult.users)
        }
      } else {
        showError(result.error || "Failed to create user")
      }
    } catch (error) {
      console.error("Create user error:", error)
      showError("An unexpected error occurred")
    } finally {
      setSingleUserLoading(false)
    }
  }

  const handleDeleteClick = (user: AdminUser) => {
    setDeletingUser(user)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!currentUser || !deletingUser) return

    setDeleteLoading(true)

    try {
      const result = await deleteUser(currentUser.id, deletingUser.id)
      if (result.success) {
        setUsers(users.filter((user) => user.id !== deletingUser.id))
        setShowDeleteDialog(false)
        showSuccess(`User "${deletingUser.full_name}" deleted successfully!`)
        setDeletingUser(null)
      } else {
        showError(result.error || "Failed to delete user")
      }
    } catch (error) {
      console.error("Delete user error:", error)
      showError("Failed to delete user")
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleResendInvitation = async (userId: string, userName: string) => {
    try {
      const result = await resendInvitation(currentUser.id, userId)
      if (result.success) {
        showSuccess(`Invitation resent to ${userName}`)
        // Update user status in local state
        setUsers(users.map((user) => (user.id === userId ? { ...user, invitation_status: "sent" as const } : user)))
      } else {
        showError(result.error || "Failed to resend invitation")
      }
    } catch (error) {
      console.error("Resend invitation error:", error)
      showError("Failed to resend invitation")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "branch_manager":
        return "bg-blue-100 text-blue-800"
      case "program_officer":
        return "bg-green-100 text-green-800"
      case "branch_report_officer":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getInvitationStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "expired":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-muted-foreground">Manage HAND IN HAND EA-TZ members and their access</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Download Template Modal */}
          <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download CSV Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Download CSV Template
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select the branch for which you want to download the CSV template. Users can only belong to one
                  branch.
                </p>
                <div className="space-y-2">
                  <label htmlFor="branch" className="text-sm font-medium">
                    Select Branch
                  </label>
                  <Select value={selectedBranchForTemplate} onValueChange={setSelectedBranchForTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTemplateModal(false)
                      setSelectedBranchForTemplate("")
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={downloadCSVTemplate} className="flex-1 bg-red-600 hover:bg-red-700">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bulk Import Modal */}
          <Dialog open={showBulkImportModal} onOpenChange={setShowBulkImportModal}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-red-600 hover:bg-red-700">
                <Upload className="h-4 w-4" />
                Bulk Import Users
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Bulk Import Users
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Branch</label>
                    <Select value={selectedBranchForImport} onValueChange={setSelectedBranchForImport}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a branch for all users" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upload CSV File</label>
                    <Input type="file" accept=".csv" onChange={handleCSVUpload} disabled={importLoading} />
                    <p className="text-xs text-muted-foreground">
                      CSV should contain: full_name, email, role, phone (optional)
                    </p>
                  </div>

                  {csvData.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Preview ({csvData.length} users)</label>
                      <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-gray-50">
                        {csvData.slice(0, 5).map((user, index) => (
                          <div key={index} className="text-xs py-1">
                            {user.full_name} - {user.email} - {user.role}
                          </div>
                        ))}
                        {csvData.length > 5 && (
                          <div className="text-xs text-muted-foreground">... and {csvData.length - 5} more users</div>
                        )}
                      </div>
                    </div>
                  )}

                  {importResults && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Import Results</label>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {importResults.successful.length} users created successfully
                        </div>
                        {importResults.failed.length > 0 && (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            {importResults.failed.length} users failed to create
                          </div>
                        )}
                        {importResults.duplicates.length > 0 && (
                          <div className="flex items-center gap-2 text-yellow-600">
                            <AlertCircle className="h-4 w-4" />
                            {importResults.duplicates.length} duplicate emails found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBulkImportModal(false)
                      setCsvFile(null)
                      setCsvData([])
                      setSelectedBranchForImport("")
                      setImportResults(null)
                    }}
                    className="flex-1"
                    disabled={importLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkImport}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={importLoading || !csvData.length || !selectedBranchForImport}
                  >
                    {importLoading ? "Importing..." : "Import Users"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Single User Modal with Tabs */}
          <Dialog open={showSingleUserModal} onOpenChange={setShowSingleUserModal}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4" />
                Add Single User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Single User
                </DialogTitle>
              </DialogHeader>

              <Tabs value={userCreationMethod} onValueChange={(value) => setUserCreationMethod(value as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="invitation" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Invitation
                  </TabsTrigger>
                  <TabsTrigger value="direct" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Direct Activation
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="invitation" className="space-y-4">
                  <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
                    <strong>Email Invitation:</strong> User will receive an email with a setup link to create their
                    password.
                  </div>
                </TabsContent>

                <TabsContent value="direct" className="space-y-4">
                  <div className="text-sm text-muted-foreground bg-green-50 p-3 rounded-md">
                    <strong>Direct Activation:</strong> User account is created immediately with the password you set.
                    No email required.
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input
                    placeholder="Enter full name"
                    value={singleUserForm.full_name}
                    onChange={(e) => setSingleUserForm({ ...singleUserForm, full_name: e.target.value })}
                    disabled={singleUserLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={singleUserForm.email}
                    onChange={(e) => setSingleUserForm({ ...singleUserForm, email: e.target.value })}
                    disabled={singleUserLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Role *</label>
                  <Select
                    value={singleUserForm.role}
                    onValueChange={(value) => setSingleUserForm({ ...singleUserForm, role: value })}
                    disabled={singleUserLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Branch *</label>
                  <Select
                    value={singleUserForm.branch_id}
                    onValueChange={(value) => setSingleUserForm({ ...singleUserForm, branch_id: value })}
                    disabled={singleUserLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone (Optional)</label>
                  <Input
                    placeholder="Enter phone number"
                    value={singleUserForm.phone}
                    onChange={(e) => setSingleUserForm({ ...singleUserForm, phone: e.target.value })}
                    disabled={singleUserLoading}
                  />
                </div>

                {userCreationMethod === "direct" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        className="pl-10 pr-10"
                        value={singleUserForm.password}
                        onChange={(e) => setSingleUserForm({ ...singleUserForm, password: e.target.value })}
                        disabled={singleUserLoading}
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        disabled={singleUserLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSingleUserModal(false)
                      setSingleUserForm({ full_name: "", email: "", role: "", branch_id: "", phone: "", password: "" })
                    }}
                    className="flex-1"
                    disabled={singleUserLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSingleUserCreate}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={singleUserLoading}
                  >
                    {singleUserLoading
                      ? "Creating..."
                      : userCreationMethod === "direct"
                        ? "Create & Activate"
                        : "Create & Send Invitation"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Branch Managers</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.role === "branch_manager").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Program Officers</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.role === "program_officer").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Report Officers</CardTitle>
            <User className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.role === "branch_report_officer").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
            <Mail className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.invitation_status === "pending" || u.invitation_status === "sent").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterBranch} onValueChange={setFilterBranch}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => {
            setSearchTerm("")
            setFilterRole("all")
            setFilterBranch("all")
            setFilterStatus("all")
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between border-b pb-4 last:border-b-0">
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-gray-100 p-2">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.full_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {user.email}
                      {user.phone && (
                        <>
                          <Phone className="h-3 w-3 ml-2" />
                          {user.phone}
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.branch_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRoleColor(user.role)}>
                    {roles.find((r) => r.value === user.role)?.label || user.role}
                  </Badge>
                  <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                  <Badge className={getInvitationStatusColor(user.invitation_status)}>{user.invitation_status}</Badge>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(user)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    {(user.invitation_status === "pending" || user.invitation_status === "expired") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvitation(user.id, user.full_name)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Mail className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterRole !== "all" || filterBranch !== "all" || filterStatus !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by importing users or adding them individually"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setDeletingUser(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete "${deletingUser?.full_name}"? This action cannot be undone and will remove all their data.`}
        confirmText="Delete User"
        cancelText="Cancel"
        isDestructive={true}
        loading={deleteLoading}
      />
    </div>
  )
}

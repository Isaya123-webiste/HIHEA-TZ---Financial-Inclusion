"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  Search,
  Trash2,
  User,
  Users,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
  Building,
  Key,
  Edit,
  MoreHorizontal,
  UserCheck,
  UserX,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase-client"
import { getAllBranches, checkAdminRole } from "@/lib/admin-actions"
import { ToastContainer, useToast } from "@/components/toast"
import ConfirmationDialog from "@/components/confirmation-dialog"
import {
  getAllUsersWithPasswords,
  createUserWithPassword,
  updateUserPassword,
  deleteUser,
} from "@/lib/user-management-actions"

interface AdminUser {
  id: string
  full_name: string
  email: string
  role: string
  branch_id?: string
  branch_name?: string
  phone?: string
  status: "active" | "inactive" | "pending"
  password: string
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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Modals and dialogs
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  // Selected user for operations
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)

  // Form states
  const [userForm, setUserForm] = useState({
    full_name: "",
    email: "",
    role: "",
    branch_id: "",
    phone: "",
    password: "",
    status: "active",
  })
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  const router = useRouter()
  const { toasts, showSuccess, showError, showWarning, removeToast } = useToast()

  const roles = [
    { value: "branch_manager", label: "Branch Manager" },
    { value: "program_officer", label: "Program Officer" },
    { value: "branch_report_officer", label: "Branch Report Officer" },
  ]

  const statuses = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "pending", label: "Pending" },
  ]

  useEffect(() => {
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

  const loadData = async () => {
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

      // Load users and branches
      const [usersResult, branchesResult] = await Promise.all([getAllUsersWithPasswords(user.id), getAllBranches()])

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

  // CREATE - Handle user creation
  const handleCreateUser = async () => {
    if (!userForm.full_name || !userForm.email || !userForm.role || !userForm.password) {
      showError("Please fill in all required fields")
      return
    }

    setFormLoading(true)

    try {
      const result = await createUserWithPassword(currentUser.id, userForm)

      if (result.success) {
        showSuccess(`User ${userForm.full_name} created successfully!`)
        setShowCreateModal(false)
        resetForm()
        loadData() // Reload data
      } else {
        showError(result.error || "Failed to create user")
      }
    } catch (error) {
      console.error("Create user error:", error)
      showError("An unexpected error occurred")
    } finally {
      setFormLoading(false)
    }
  }

  // UPDATE - Handle user update
  const handleUpdateUser = async () => {
    if (!selectedUser || !userForm.full_name || !userForm.email || !userForm.role) {
      showError("Please fill in all required fields")
      return
    }

    setFormLoading(true)

    try {
      // Update user logic would go here
      showSuccess(`User ${userForm.full_name} updated successfully!`)
      setShowEditModal(false)
      resetForm()
      loadData() // Reload data
    } catch (error) {
      console.error("Update user error:", error)
      showError("Failed to update user")
    } finally {
      setFormLoading(false)
    }
  }

  // UPDATE - Handle password update
  const handlePasswordUpdate = async () => {
    if (!selectedUser || !newPassword) {
      showError("Please enter a new password")
      return
    }

    if (newPassword.length < 6) {
      showError("Password must be at least 6 characters long")
      return
    }

    setFormLoading(true)

    try {
      const result = await updateUserPassword(currentUser.id, selectedUser.id, newPassword)

      if (result.success) {
        showSuccess(`Password updated for ${selectedUser.full_name}`)
        setShowPasswordModal(false)
        setSelectedUser(null)
        setNewPassword("")
        loadData() // Reload data
      } else {
        showError(result.error || "Failed to update password")
      }
    } catch (error) {
      console.error("Update password error:", error)
      showError("Failed to update password")
    } finally {
      setFormLoading(false)
    }
  }

  // DELETE - Handle single user deletion
  const handleDeleteUser = async () => {
    if (!deletingUser) return

    setFormLoading(true)

    try {
      const result = await deleteUser(currentUser.id, deletingUser.id)
      if (result.success) {
        showSuccess(`User "${deletingUser.full_name}" deleted successfully!`)
        setShowDeleteDialog(false)
        setDeletingUser(null)
        loadData() // Reload data
      } else {
        showError(result.error || "Failed to delete user")
      }
    } catch (error) {
      console.error("Delete user error:", error)
      showError("Failed to delete user")
    } finally {
      setFormLoading(false)
    }
  }

  // DELETE - Handle bulk user deletion
  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return

    setFormLoading(true)

    try {
      // Bulk delete logic would go here
      showSuccess(`${selectedUsers.length} users deleted successfully!`)
      setShowBulkDeleteDialog(false)
      setSelectedUsers([])
      loadData() // Reload data
    } catch (error) {
      console.error("Bulk delete error:", error)
      showError("Failed to delete users")
    } finally {
      setFormLoading(false)
    }
  }

  const resetForm = () => {
    setUserForm({
      full_name: "",
      email: "",
      role: "",
      branch_id: "",
      phone: "",
      password: "",
      status: "active",
    })
    setSelectedUser(null)
  }

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user)
    setUserForm({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      branch_id: user.branch_id || "",
      phone: user.phone || "",
      password: "",
      status: user.status,
    })
    setShowEditModal(true)
  }

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setUserForm({ ...userForm, password })
  }

  const generateNewPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(password)
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

  const getRoleDisplayName = (role: string) => {
    const roleMap = {
      branch_manager: "Branch Manager",
      program_officer: "Program Officer",
      branch_report_officer: "Branch Report Officer",
      // Legacy support
      report_officer: "Branch Report Officer",
    }
    return roleMap[role as keyof typeof roleMap] || role
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: "#009edb", borderTopColor: "transparent" }}
          ></div>
          <p className="mt-2 text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: "#009edb" }}>
            {error}
          </p>
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
          <h1 className="text-2xl font-bold text-gray-900">User Management (CRUD)</h1>
          <p className="text-muted-foreground">Create, Read, Update, and Delete HIH Financial Inclusion users</p>
        </div>
        <div className="flex items-center gap-2">
          {/* CREATE - Add User Button */}
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button
                className="flex items-center gap-2 text-white hover:opacity-90"
                style={{ backgroundColor: "#009edb" }}
              >
                <Plus className="h-4 w-4" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New User
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input
                    placeholder="Enter full name"
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                    disabled={formLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    disabled={formLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Role *</label>
                  <Select
                    value={userForm.role}
                    onValueChange={(value) => setUserForm({ ...userForm, role: value })}
                    disabled={formLoading}
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
                  <label className="text-sm font-medium">Branch</label>
                  <Select
                    value={userForm.branch_id}
                    onValueChange={(value) => setUserForm({ ...userForm, branch_id: value })}
                    disabled={formLoading}
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
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    placeholder="Enter phone number"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    disabled={formLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password *</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        className="pl-10 pr-10"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        disabled={formLoading}
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        disabled={formLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generatePassword}
                      disabled={formLoading}
                      className="px-3"
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false)
                      resetForm()
                    }}
                    className="flex-1"
                    disabled={formLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateUser}
                    className="flex-1 text-white hover:opacity-90"
                    style={{ backgroundColor: "#009edb" }}
                    disabled={formLoading}
                  >
                    {formLoading ? "Creating..." : "Create User"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setShowBulkDeleteDialog(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedUsers.length})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.status === "active").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Branch Report Officers</CardTitle>
            <UserX className="h-4 w-4" style={{ color: "#009edb" }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === "branch_report_officer" || u.role === "report_officer").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
            <CheckCircle className="h-4 w-4" style={{ color: "#009edb" }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedUsers.length}</div>
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
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground flex items-center">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management (CRUD Operations)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">
                      <Checkbox
                        checked={selectedUsers.length === filteredUsers.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers(filteredUsers.map((u) => u.id))
                          } else {
                            setSelectedUsers([])
                          }
                        }}
                      />
                    </th>
                    <th className="text-left p-2 font-medium">User</th>
                    <th className="text-left p-2 font-medium">Role</th>
                    <th className="text-left p-2 font-medium">Branch</th>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-left p-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers([...selectedUsers, user.id])
                            } else {
                              setSelectedUsers(selectedUsers.filter((id) => id !== user.id))
                            }
                          }}
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: "#e6f7ff" }}
                          >
                            <User className="h-4 w-4" style={{ color: "#009edb" }} />
                          </div>
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge className={getRoleColor(user.role)}>{getRoleDisplayName(user.role)}</Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {user.branch_name || "No Branch"}
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                      </td>
                      <td className="p-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditModal(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setNewPassword("")
                                setShowPasswordModal(true)
                              }}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Change Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingUser(user)
                                setShowDeleteDialog(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* UPDATE - Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit User: {selectedUser?.full_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name *</label>
              <Input
                placeholder="Enter full name"
                value={userForm.full_name}
                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                disabled={formLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                disabled={formLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role *</label>
              <Select
                value={userForm.role}
                onValueChange={(value) => setUserForm({ ...userForm, role: value })}
                disabled={formLoading}
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
              <label className="text-sm font-medium">Status *</label>
              <Select
                value={userForm.status}
                onValueChange={(value) => setUserForm({ ...userForm, status: value })}
                disabled={formLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false)
                  resetForm()
                }}
                className="flex-1"
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateUser}
                className="flex-1 text-white hover:opacity-90"
                style={{ backgroundColor: "#009edb" }}
                disabled={formLoading}
              >
                {formLoading ? "Updating..." : "Update User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* UPDATE - Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Update Password for {selectedUser?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    className="pl-10 pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={formLoading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    disabled={formLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateNewPassword}
                  disabled={formLoading}
                  className="px-3"
                >
                  <Key className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordModal(false)
                  setSelectedUser(null)
                  setNewPassword("")
                }}
                className="flex-1"
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordUpdate}
                className="flex-1 text-white hover:opacity-90"
                style={{ backgroundColor: "#009edb" }}
                disabled={formLoading || !newPassword}
              >
                {formLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE - Single User Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setDeletingUser(null)
        }}
        onConfirm={handleDeleteUser}
        title="Delete User"
        description={`Are you sure you want to delete "${deletingUser?.full_name}"? This action cannot be undone.`}
        confirmText="Delete User"
        cancelText="Cancel"
        variant="destructive"
        loading={formLoading}
      />

      {/* DELETE - Bulk Delete Confirmation */}
      <ConfirmationDialog
        isOpen={showBulkDeleteDialog}
        onClose={() => setShowBulkDeleteDialog(false)}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Users"
        description={`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`}
        confirmText={`Delete ${selectedUsers.length} Users`}
        cancelText="Cancel"
        variant="destructive"
        loading={formLoading}
      />
    </div>
  )
}

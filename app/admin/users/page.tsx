"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Edit, Plus, Search, RefreshCw, Eye, EyeOff, AlertCircle } from "lucide-react"
import {
  getAllUsers,
  updateUser,
  deleteUser,
  createUser,
  searchUsers,
  changeUserPassword,
} from "@/lib/user-management-actions"
import { getAllBranches } from "@/lib/branch-actions"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: "admin" | "branch_manager" | "program_officer" | "assistance_program_officer" | "branch_report_officer"
  branch_id: string | null
  status: "active" | "inactive" | "pending"
  created_at: string
  updated_at: string
  last_login?: string | null
  phone?: string | null
  branch_name?: string
}

interface Branch {
  id: string
  name: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [branchesLoading, setBranchesLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    role: "" as UserProfile["role"],
    branch_id: "",
    status: "" as UserProfile["status"],
    phone: "",
    password: "",
    changePassword: false,
  })

  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    role: "" as UserProfile["role"],
    branch_id: "",
    phone: "",
    password: "",
  })

  useEffect(() => {
    loadUsers()
    loadBranches()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Loading users...")
      const result = await getAllUsers()

      if (result.success) {
        console.log("[v0] Users loaded successfully:", result.data?.length)
        setUsers(result.data || [])
      } else {
        console.error("[v0] Failed to load users:", result.error)
        setError(result.error || "Failed to load users")
        toast({
          title: "Error",
          description: result.error || "Failed to load users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error loading users:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred while loading users"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadBranches = async () => {
    try {
      setBranchesLoading(true)
      console.log("Loading branches...")
      const result = await getAllBranches()

      if (result.success) {
        console.log("Branches loaded successfully:", result.data?.length)
        setBranches(result.data || [])
      } else {
        console.error("Error loading branches:", result.error)
        toast({
          title: "Warning",
          description: result.error || "Failed to load branches",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading branches:", error)
      toast({
        title: "Warning",
        description: "Failed to load branches",
        variant: "destructive",
      })
    } finally {
      setBranchesLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadUsers()
      return
    }

    try {
      setLoading(true)
      const result = await searchUsers(searchTerm)

      if (result.success) {
        setUsers(result.data || [])
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to search users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error searching users:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while searching",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user)
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      branch_id: user.branch_id || "",
      status: user.status,
      phone: user.phone || "",
      password: "",
      changePassword: false,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      setIsSubmitting(true)
      console.log("Updating user:", selectedUser.id, "with data:", editForm)

      const result = await updateUser(selectedUser.id, {
        full_name: editForm.full_name,
        email: editForm.email,
        role: editForm.role,
        branch_id: editForm.branch_id || null,
        status: editForm.status,
        phone: editForm.phone || null,
      })

      if (!result.success) {
        console.error("Failed to update user:", result.error)
        toast({
          title: "Error",
          description: result.error || "Failed to update user",
          variant: "destructive",
        })
        return
      }

      if (editForm.changePassword && editForm.password) {
        const passwordResult = await changeUserPassword(selectedUser.id, editForm.password)

        if (!passwordResult.success) {
          console.error("Failed to update password:", passwordResult.error)
          toast({
            title: "Warning",
            description: `User updated but password change failed: ${passwordResult.error}`,
            variant: "destructive",
          })
        } else {
          console.log("Password updated successfully")
        }
      }

      console.log("User updated successfully:", result.data)

      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === selectedUser.id ? { ...user, ...result.data } : user)),
      )

      toast({
        title: "Success",
        description:
          editForm.changePassword && editForm.password
            ? "User and password updated successfully"
            : "User updated successfully",
      })

      setIsEditDialogOpen(false)
      setSelectedUser(null)

      setTimeout(() => {
        loadUsers()
      }, 500)
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async (user: UserProfile) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const result = await deleteUser(userToDelete.id)

      if (result.success) {
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userToDelete.id))

        toast({
          title: "Success",
          description: "User deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the user",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const handleCreateUser = async () => {
    if (!createForm.full_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Full name is required",
        variant: "destructive",
      })
      return
    }

    if (!createForm.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive",
      })
      return
    }

    if (!createForm.role) {
      toast({
        title: "Validation Error",
        description: "Role is required",
        variant: "destructive",
      })
      return
    }

    if (!createForm.branch_id) {
      toast({
        title: "Validation Error",
        description: "Branch is required",
        variant: "destructive",
      })
      return
    }

    if (!createForm.password || createForm.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      console.log("Creating user with data:", { ...createForm, password: "[REDACTED]" })

      const result = await createUser({
        email: createForm.email.trim(),
        full_name: createForm.full_name.trim(),
        role: createForm.role,
        branch_id: createForm.branch_id,
        phone: createForm.phone.trim() || undefined,
        password: createForm.password,
      })

      if (result.success) {
        console.log("User created successfully:", result.data)

        setUsers((prevUsers) => [result.data, ...prevUsers])

        toast({
          title: "Success",
          description: "User created successfully",
        })

        setIsCreateDialogOpen(false)
        setCreateForm({
          full_name: "",
          email: "",
          role: "" as UserProfile["role"],
          branch_id: "",
          phone: "",
          password: "",
        })

        setTimeout(() => {
          loadUsers()
        }, 500)
      } else {
        console.error("Failed to create user:", result.error)
        toast({
          title: "Error",
          description: result.error || "Failed to create user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating the user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "branch_manager":
        return "default"
      case "program_officer":
        return "secondary"
      case "assistance_program_officer":
        return "default"
      case "branch_report_officer":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "inactive":
        return "secondary"
      case "pending":
        return "outline"
      default:
        return "outline"
    }
  }

  const formatRole = (role: string) => {
    if (role === "assistance_program_officer") {
      return "Business Development Officer"
    }
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading users...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold">Failed to load users</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-sm mt-2">
              This may be due to missing environment variables or Supabase configuration issues.
            </p>
          </AlertDescription>
        </Alert>
        <Button onClick={loadUsers} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their permissions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              {branchesLoading && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Loading branches... Please wait.</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="create-name">Full Name *</Label>
                <Input
                  id="create-name"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="create-password">Password *</Label>
                <div className="relative">
                  <Input
                    id="create-password"
                    type={showPassword ? "text" : "password"}
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Enter password (min 6 characters)"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="create-role">Role *</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value: UserProfile["role"]) => setCreateForm({ ...createForm, role: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="branch_manager">Branch Manager</SelectItem>
                    <SelectItem value="program_officer">Program Officer</SelectItem>
                    <SelectItem value="assistance_program_officer">Business Development Officer</SelectItem>
                    <SelectItem value="branch_report_officer">Branch Report Officer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="create-branch">Branch *</Label>
                <Select
                  value={createForm.branch_id}
                  onValueChange={(value) => setCreateForm({ ...createForm, branch_id: value })}
                  disabled={branchesLoading}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={branchesLoading ? "Loading branches..." : "Select branch"} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.length === 0 && !branchesLoading ? (
                      <SelectItem value="none" disabled>
                        No branches available
                      </SelectItem>
                    ) : (
                      branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {branches.length === 0 && !branchesLoading && (
                  <p className="text-sm text-red-600">No branches found. Please create branches first.</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="create-phone">Phone (Optional)</Label>
                <Input
                  id="create-phone"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={isSubmitting || branchesLoading || branches.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Total users: {users.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button onClick={loadUsers} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getRoleBadgeVariant(user.role)}
                        className={`font-medium ${
                          user.role === "admin"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : user.role === "branch_manager"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : user.role === "program_officer"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : user.role === "assistance_program_officer"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-purple-100 text-purple-800 border-purple-200"
                        }`}
                      >
                        {formatRole(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.branch_name || "No Branch"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(user.status)}
                        className={`font-medium ${
                          user.status === "active"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : user.status === "inactive"
                              ? "bg-gray-100 text-gray-800 border-gray-200"
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                        }`}
                      >
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user.role !== "admin" && (
                          <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and permissions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value: UserProfile["role"]) => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="branch_manager">Branch Manager</SelectItem>
                  <SelectItem value="program_officer">Program Officer</SelectItem>
                  <SelectItem value="assistance_program_officer">Business Development Officer</SelectItem>
                  <SelectItem value="branch_report_officer">Branch Report Officer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-branch">Branch</Label>
              <Select
                value={editForm.branch_id}
                onValueChange={(value) => setEditForm({ ...editForm, branch_id: value })}
                disabled={branchesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={branchesLoading ? "Loading branches..." : "Select branch"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Branch</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value: UserProfile["status"]) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  id="change-password"
                  checked={editForm.changePassword}
                  onChange={(e) => setEditForm({ ...editForm, changePassword: e.target.checked, password: "" })}
                  className="rounded"
                />
                <Label htmlFor="change-password" className="text-sm font-medium">
                  Change Password
                </Label>
              </div>

              {editForm.changePassword && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="edit-password"
                      type={showEditPassword ? "text" : "password"}
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="Enter new password (min 6 characters)"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                    >
                      {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {editForm.password && editForm.password.length < 6 && (
                    <p className="text-sm text-red-600">Password must be at least 6 characters long</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={isSubmitting || (editForm.changePassword && editForm.password.length < 6)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.full_name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

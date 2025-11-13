"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2, MapPin, Phone, Mail, User } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getAllBranches, checkAdminRole } from "@/lib/admin-actions"
import { createBranch, updateBranch, deleteBranch } from "@/lib/branch-actions"
import BranchModal from "@/components/branch-modal"
import ConfirmationDialog from "@/components/confirmation-dialog"
import { ToastContainer, useToast } from "@/components/toast"

interface Branch {
  id: string
  name: string
  address: string
  city: string
  state: string
  postal_code: string
  phone: string
  email: string
  manager_name: string
  status: "active" | "inactive" | "pending"
  created_at: string
  updated_at: string
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const router = useRouter()
  const { toasts, showSuccess, showError, removeToast } = useToast()

  useEffect(() => {
    async function loadBranches() {
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

        // Load branches
        const branchesResult = await getAllBranches()
        if (branchesResult.branches) {
          setBranches(branchesResult.branches)
          setFilteredBranches(branchesResult.branches)
        } else if (branchesResult.error) {
          setError(branchesResult.error)
        }
      } catch (error) {
        console.error("Load branches error:", error)
        setError("Failed to load branches")
      } finally {
        setLoading(false)
      }
    }

    loadBranches()
  }, [router])

  // Filter branches based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredBranches(branches)
    } else {
      const filtered = branches.filter(
        (branch) =>
          branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          branch.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          branch.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
          branch.manager_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredBranches(filtered)
    }
  }, [searchTerm, branches])

  const handleCreateBranch = async (branchName: string) => {
    if (!currentUser) {
      showError("Not authenticated")
      return { error: "Not authenticated" }
    }

    console.log("[v0] handleCreateBranch called with:", branchName)

    const result = await createBranch(currentUser.id, branchName)

    console.log("[v0] createBranch result:", result)

    if (result.success && result.branch) {
      setBranches([result.branch, ...branches])
      showSuccess(`Branch "${branchName}" created successfully!`)
      return { success: true }
    }

    showError(result.error || "Failed to create branch")
    return { error: result.error }
  }

  const handleUpdateBranch = async (branchName: string) => {
    if (!currentUser || !editingBranch) {
      showError("Not authenticated or no branch selected")
      return { error: "Not authenticated or no branch selected" }
    }

    const result = await updateBranch(currentUser.id, editingBranch.id, branchName)

    if (result.success && result.branch) {
      setBranches(branches.map((b) => (b.id === editingBranch.id ? result.branch : b)))
      setEditingBranch(null)
      showSuccess(`Branch "${branchName}" updated successfully!`)
      return { success: true }
    }

    showError(result.error || "Failed to update branch")
    return { error: result.error }
  }

  const handleDeleteClick = (branch: Branch) => {
    setDeletingBranch(branch)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!currentUser || !deletingBranch) {
      return
    }

    setDeleteLoading(true)

    try {
      const result = await deleteBranch(currentUser.id, deletingBranch.id)
      if (result.success) {
        setBranches(branches.filter((branch) => branch.id !== deletingBranch.id))
        setShowDeleteDialog(false)
        showSuccess(`Branch "${deletingBranch.name}" deleted successfully!`)
        setDeletingBranch(null)
      } else {
        showError(result.error || "Failed to delete branch")
      }
    } catch (error) {
      console.error("Delete branch error:", error)
      showError("Failed to delete branch")
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
    setDeletingBranch(null)
  }

  const handleEditClick = (branch: Branch) => {
    setEditingBranch(branch)
    setShowEditModal(true)
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

  // Helper function to check if a field has meaningful data
  const hasData = (value: string) => {
    return value && value.trim() !== ""
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading branches...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Branch Management</h1>
          <p className="text-muted-foreground">Manage HIH Financial Inclusion branches</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Add Branch
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
            <span className="material-icons text-muted-foreground">business</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Branches</CardTitle>
            <span className="material-icons text-green-600">check_circle</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.filter((b) => b.status === "active").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Branches</CardTitle>
            <span className="material-icons text-yellow-600">pending</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.filter((b) => b.status === "pending").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Branches</CardTitle>
            <span className="material-icons text-red-600">cancel</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.filter((b) => b.status === "inactive").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search branches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredBranches.map((branch) => (
          <Card key={branch.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{branch.name}</CardTitle>
                  {hasData(branch.manager_name) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {branch.manager_name}
                    </p>
                  )}
                </div>
                <Badge className={getStatusColor(branch.status)}>{branch.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Only show address if it has data */}
              {(hasData(branch.address) || hasData(branch.city) || hasData(branch.state)) && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    {hasData(branch.address) && <p>{branch.address}</p>}
                    {(hasData(branch.city) || hasData(branch.state) || hasData(branch.postal_code)) && (
                      <p>{[branch.city, branch.state, branch.postal_code].filter(hasData).join(", ")}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Only show phone if it has data */}
              {hasData(branch.phone) && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{branch.phone}</p>
                </div>
              )}

              {/* Only show email if it has data */}
              {hasData(branch.email) && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{branch.email}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(branch.created_at).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(branch)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(branch)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBranches.length === 0 && (
        <div className="text-center py-12">
          <span className="material-icons text-6xl text-muted-foreground mb-4">business</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No branches found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first branch"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowCreateModal(true)} className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Branch
            </Button>
          )}
        </div>
      )}

      {/* Modals */}
      <BranchModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateBranch}
        mode="create"
        title="Create New Branch"
      />

      <BranchModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingBranch(null)
        }}
        onSubmit={handleUpdateBranch}
        mode="edit"
        initialValue={editingBranch?.name || ""}
        title="Edit Branch"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Branch"
        message={`Are you sure you want to delete "${deletingBranch?.name}" branch? This action cannot be undone.`}
        confirmText="Delete Branch"
        cancelText="Cancel"
        isDestructive={true}
        loading={deleteLoading}
      />
    </div>
  )
}

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
import PageHeader from "@/components/page-header"

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
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push("/")
          return
        }

        setCurrentUser(user)

        const adminCheck = await checkAdminRole(user.id)
        if (adminCheck.error || !adminCheck.isAdmin) {
          setError("Access denied. Admin privileges required.")
          setTimeout(() => router.push("/dashboard"), 3000)
          return
        }

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

    const result = await createBranch(currentUser.id, branchName)

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
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
    }
  }

  const hasData = (value: string) => {
    return value && value.trim() !== ""
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-800">
        <PageHeader title="Branches" />
        <div className="px-4 md:px-8 py-12 flex items-center justify-center">
          <div className="space-y-3 text-center">
            <div className="animate-spin inline-flex items-center justify-center w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading branches...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-800">
      <PageHeader title="Branches" />

      <div className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Manage HIH Financial Inclusion branches</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Add Branch
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-900 dark:text-white">Total Branches</CardTitle>
              <span className="material-icons text-slate-500 dark:text-slate-400">business</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{branches.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-900 dark:text-white">Active Branches</CardTitle>
              <span className="material-icons text-green-600">check_circle</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{branches.filter((b) => b.status === "active").length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-900 dark:text-white">Pending Branches</CardTitle>
              <span className="material-icons text-yellow-600">pending</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{branches.filter((b) => b.status === "pending").length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-900 dark:text-white">Inactive Branches</CardTitle>
              <span className="material-icons text-red-600">cancel</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{branches.filter((b) => b.status === "inactive").length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-600" />
            <Input
              placeholder="Search branches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Branches Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBranches.map((branch) => (
            <Card key={branch.id} className="hover:shadow-lg transition-shadow bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">{branch.name}</CardTitle>
                    {hasData(branch.manager_name) && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {branch.manager_name}
                      </p>
                    )}
                  </div>
                  <Badge className={getStatusColor(branch.status)}>{branch.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {(hasData(branch.address) || hasData(branch.city) || hasData(branch.state)) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-0.5" />
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                      {hasData(branch.address) && <p>{branch.address}</p>}
                      {(hasData(branch.city) || hasData(branch.state) || hasData(branch.postal_code)) && (
                        <p>{[branch.city, branch.state, branch.postal_code].filter(hasData).join(", ")}</p>
                      )}
                    </div>
                  </div>
                )}

                {hasData(branch.phone) && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <p className="text-sm text-slate-700 dark:text-slate-300">{branch.phone}</p>
                  </div>
                )}

                {hasData(branch.email) && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <p className="text-sm text-slate-700 dark:text-slate-300">{branch.email}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Created: {new Date(branch.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(branch)} className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(branch)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
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
            <span className="material-icons text-6xl text-slate-400 dark:text-slate-600 mb-4">business</span>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No branches found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first branch"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateModal(true)} className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Branch
              </Button>
            )}
          </div>
        )}

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
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

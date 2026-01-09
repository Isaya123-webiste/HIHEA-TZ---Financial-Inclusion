"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  checkProjectUsageInBranchReports,
  getAllBranches,
} from "@/lib/projects-crud-actions"
import type { Project } from "@/lib/projects-crud-actions"
import { ToastContainer, useToast } from "@/components/toast"
import ConfirmationDialog from "@/components/ui/confirmation-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDeleteWarningModal, setShowDeleteWarningModal] = useState(false)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [projectUsedInReports, setProjectUsedInReports] = useState(false)
  const { toasts, showSuccess, showError, removeToast } = useToast()
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const [createForm, setCreateForm] = useState({
    name: "",
    branch_id: "",
  })

  const [editForm, setEditForm] = useState({
    name: "",
    status: "active" as "active" | "inactive" | "completed",
    branch_id: "", // added branch_id to edit form
  })

  useEffect(() => {
    loadProjects()
    loadBranches()
  }, [])

  useEffect(() => {
    if (!searchTerm) {
      setFilteredProjects(projects)
    } else {
      const filtered = projects.filter((project) => project.name.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredProjects(filtered)
    }
  }, [searchTerm, projects])

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getAllProjects()
      if (result.success && result.data) {
        setProjects(result.data)
        setFilteredProjects(result.data)
      } else {
        const errorMsg = result.error || "Failed to load projects"
        setError(errorMsg)
        showError(errorMsg)
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to load projects"
      setError(errorMsg)
      showError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const loadBranches = async () => {
    try {
      const result = await getAllBranches()
      if (result.success && result.data) {
        setBranches(result.data)
      } else {
        console.error("[v0] Branch load failed:", result.error)
      }
    } catch (error) {
      console.error("[v0] Load branches exception:", error)
    }
  }

  const handleCreateProject = async () => {
    if (!createForm.name.trim()) {
      showError("Project name is required")
      return
    }

    if (!createForm.branch_id) {
      showError("Branch selection is required")
      return
    }

    const result = await createProject(createForm.name, createForm.branch_id)

    if (result.success && result.project) {
      setProjects([result.project, ...projects])
      showSuccess(`Project "${createForm.name}" created successfully!`)
      setShowCreateModal(false)
      setCreateForm({ name: "", branch_id: "" })
    } else {
      showError(result.error || "Failed to create project")
    }
  }

  const handleUpdateProject = async () => {
    if (!editingProject) return

    const result = await updateProject(editingProject.id, {
      name: editForm.name,
      status: editForm.status,
      branch_id: editForm.branch_id || null,
    })

    if (result.success && result.project) {
      setProjects(projects.map((p) => (p.id === editingProject.id ? result.project : p)))
      showSuccess(`Project "${editForm.name}" updated successfully!`)
      setShowEditModal(false)
      setEditingProject(null)
    } else {
      showError(result.error || "Failed to update project")
    }
  }

  const handleDeleteClick = async (project: Project) => {
    setDeletingProject(project)

    const checkResult = await checkProjectUsageInBranchReports(project.id)

    if (checkResult.success && checkResult.isUsed) {
      setProjectUsedInReports(true)
      setShowDeleteWarningModal(true)
    } else {
      setProjectUsedInReports(false)
      setShowDeleteDialog(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingProject) return

    setDeleteLoading(true)

    try {
      const result = await deleteProject(deletingProject.id)
      if (result.success) {
        setProjects(projects.filter((project) => project.id !== deletingProject.id))
        setShowDeleteDialog(false)
        setShowDeleteWarningModal(false)
        showSuccess(`Project "${deletingProject.name}" deleted successfully!`)
        setDeletingProject(null)
      } else {
        showError(result.error || "Failed to delete project")
      }
    } catch (error) {
      console.error("Delete project error:", error)
      showError("Failed to delete project")
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
    setShowDeleteWarningModal(false)
    setDeletingProject(null)
    setProjectUsedInReports(false)
  }

  const handleEditClick = (project: Project) => {
    setEditingProject(project)
    setEditForm({
      name: project.name,
      status: project.status,
      branch_id: project.branch_id || "", // populate existing branch_id
    })
    setShowEditModal(true)
  }

  const getBranchName = (branchId: string | null): string => {
    if (!branchId) return "No branch assigned"
    const branch = branches.find((b) => b.id === branchId)
    return branch?.name || branchId
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (error && !loading) {
    return (
      <div className="p-6">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Projects</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={loadProjects} className="bg-red-600 hover:bg-red-700">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button onClick={() => setShowCreateModal(true)} className="bg-[#009edb] hover:bg-[#0087b8]">
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No projects found</p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{project.name}</span>
                  <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{getBranchName(project.branch_id)}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(project)} className="flex-1">
                      <Edit className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(project)}
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showDeleteDialog && deletingProject && !projectUsedInReports && (
        <ConfirmationDialog
          isOpen={true}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete The Project?"
          message={`Are you sure you want to delete the project "${deletingProject.name}"? This action cannot be undone.`}
          confirmText="Yes, Delete"
          cancelText="No, Cancel"
          isDestructive={true}
          loading={deleteLoading}
        />
      )}

      {showDeleteWarningModal && deletingProject && projectUsedInReports && (
        <ConfirmationDialog
          isOpen={true}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete The Project?"
          message={`This project is currently used in Branch Reports. If deleted, all related reports and metrics will be permanently lost. This action cannot be undone.`}
          confirmText="Yes, Delete"
          cancelText="No, Cancel"
          isDestructive={true}
          loading={deleteLoading}
          variant="warning"
        />
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Add a new NGO project to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name *</label>
              <Input
                placeholder="Enter project name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Branch *</label>
              <Select
                value={createForm.branch_id}
                onValueChange={(value) => setCreateForm({ ...createForm, branch_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a branch" />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} className="bg-[#009edb] hover:bg-[#0087b8]">
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input
                placeholder="Enter project name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Branch</label>
              <Select
                value={editForm.branch_id}
                onValueChange={(value) => setEditForm({ ...editForm, branch_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a branch" />
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
              <label className="text-sm font-medium">Status</label>
              <Select
                value={editForm.status}
                onValueChange={(value: any) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProject} className="bg-[#009edb] hover:bg-[#0087b8]">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { RBACContext } from "@/lib/rbac-utils"

interface DashboardFilterProps {
  context: RBACContext | null
  selectedBranch: string | null
  selectedProject: string | null
  onBranchChange: (branchId: string) => void
  onProjectChange: (projectId: string) => void
  branches: Array<{ id: string; name: string }>
  projects: Array<{ id: string; name: string }>
  loading?: boolean
}

export default function DashboardFilter({
  context,
  selectedBranch,
  selectedProject,
  onBranchChange,
  onProjectChange,
  branches,
  projects,
  loading = false,
}: DashboardFilterProps) {
  const isAdmin = context?.role === "admin"
  const userBranchId = context?.branchId

  // Auto-set branch for non-admin users
  useEffect(() => {
    if (!isAdmin && userBranchId && selectedBranch !== userBranchId) {
      onBranchChange(userBranchId)
    }
  }, [isAdmin, userBranchId, selectedBranch, onBranchChange])

  // Filter projects based on selected branch
  const filteredProjects = selectedBranch
    ? projects.filter((p) => {
        // This assumes projects have a branch_id, you may need to adjust based on your schema
        return true // For now, show all projects for selected branch
      })
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard Filters</CardTitle>
        <CardDescription>
          {isAdmin ? "View data across all branches and projects" : "Viewing data for your branch"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-4">
        {isAdmin && (
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Branch</label>
            <Select value={selectedBranch || ""} onValueChange={onBranchChange} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select branch..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {!isAdmin && (
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Your Branch</label>
            <div className="px-3 py-2 bg-gray-100 rounded-md text-sm">
              {branches.find((b) => b.id === userBranchId)?.name || "No branch assigned"}
            </div>
          </div>
        )}

        {filteredProjects.length > 0 && (
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Project</label>
            <Select value={selectedProject || ""} onValueChange={onProjectChange} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select project..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Projects</SelectItem>
                {filteredProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

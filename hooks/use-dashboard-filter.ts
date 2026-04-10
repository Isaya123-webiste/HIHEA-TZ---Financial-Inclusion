"use client"

import { useEffect, useState } from "react"
import type { RBACContext } from "@/lib/rbac-utils"

interface DashboardFilterState {
  selectedBranch: string | null
  selectedProject: string | null
}

export function useDashboardFilter(context: RBACContext | null) {
  const [filter, setFilter] = useState<DashboardFilterState>({
    selectedBranch: null,
    selectedProject: null,
  })

  // Auto-set branch for non-admin users
  useEffect(() => {
    if (context && context.role !== "admin" && context.branchId) {
      setFilter((prev) => ({
        ...prev,
        selectedBranch: context.branchId,
      }))
    }
  }, [context])

  const handleBranchChange = (branchId: string) => {
    // For non-admin users, prevent changing branch
    if (context && context.role !== "admin") {
      return
    }

    setFilter((prev) => ({
      ...prev,
      selectedBranch: branchId || null,
      selectedProject: null, // Reset project when branch changes
    }))
  }

  const handleProjectChange = (projectId: string) => {
    setFilter((prev) => ({
      ...prev,
      selectedProject: projectId || null,
    }))
  }

  // Build query filters for API calls
  const getQueryFilters = () => {
    const filters: Record<string, any> = {}

    // For non-admin, always apply branch filter
    if (context && context.role !== "admin" && context.branchId) {
      filters.branch_id = context.branchId
    } else if (filter.selectedBranch) {
      // For admin with selected branch
      filters.branch_id = filter.selectedBranch
    }

    if (filter.selectedProject) {
      filters.project_id = filter.selectedProject
    }

    return filters
  }

  return {
    filter,
    handleBranchChange,
    handleProjectChange,
    getQueryFilters,
    canFilterByBranch: context?.role === "admin",
    lockedBranch: context?.role !== "admin" ? context?.branchId : null,
  }
}

"use client"

import { useEffect, useState } from "react"
import type { RBACContext, UserRole } from "@/lib/rbac-utils"
import { hasRole, canAccessBranch, getDashboardFilterContext } from "@/lib/rbac-utils"

export function useRBAC() {
  const [context, setContext] = useState<RBACContext | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch RBAC context from the server
    async function fetchContext() {
      try {
        const response = await fetch("/api/rbac/context")
        if (response.ok) {
          const data = await response.json()
          setContext(data)
        }
      } catch (error) {
        console.error("Failed to fetch RBAC context:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContext()
  }, [])

  return {
    context,
    loading,
    hasRole: (role: UserRole | UserRole[]) => hasRole(context, role),
    canAccessBranch: (branchId: string) => canAccessBranch(context, branchId),
    getDashboardFilterContext: () => getDashboardFilterContext(context),
  }
}

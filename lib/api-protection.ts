"use server"

import { getRBACContext, hasRole, canAccessBranch, type UserRole } from "@/lib/rbac-utils"

/**
 * Server-side API protection wrapper
 * Validates user permissions before executing server actions
 */
export async function protectAPIAction<T>(
  action: () => Promise<T>,
  requiredRoles?: UserRole | UserRole[],
  requiredBranchId?: string,
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const context = await getRBACContext()

    if (!context) {
      return { success: false, error: "Not authenticated" }
    }

    // Check role if specified
    if (requiredRoles) {
      if (!hasRole(context, requiredRoles)) {
        return { success: false, error: "Insufficient permissions" }
      }
    }

    // Check branch access if specified
    if (requiredBranchId) {
      if (!canAccessBranch(context, requiredBranchId)) {
        return { success: false, error: "Cannot access this branch" }
      }
    }

    // Check account status
    if (context.status !== "active") {
      return { success: false, error: "Account not active" }
    }

    const data = await action()
    return { success: true, data }
  } catch (error) {
    console.error("[API Protection] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/**
 * Query builder that automatically adds branch filters for non-admin users
 */
export async function buildAuthenticatedQuery(
  baseQuery: any,
  requiredRoles?: UserRole | UserRole[],
) {
  const context = await getRBACContext()

  if (!context) {
    throw new Error("Not authenticated")
  }

  // Check role
  if (requiredRoles && !hasRole(context, requiredRoles)) {
    throw new Error("Insufficient permissions")
  }

  // Auto-filter by branch for non-admin users
  if (context.role !== "admin" && context.branchId) {
    return baseQuery.eq("branch_id", context.branchId)
  }

  return baseQuery
}

"use server"

import { getRBACContext, hasRole, type UserRole } from "@/lib/rbac-utils"
import { redirect } from "next/navigation"

/**
 * Protected page wrapper for server components
 * Redirects unauthorized users to their default dashboard
 */
export async function requirePageAccess(requiredRoles?: UserRole | UserRole[]) {
  const context = await getRBACContext()

  if (!context) {
    redirect("/")
  }

  // Check role if specified
  if (requiredRoles && !hasRole(context, requiredRoles)) {
    // Redirect to their default dashboard
    switch (context.role) {
      case "admin":
        redirect("/admin")
      case "branch_manager":
        redirect("/branch-manager")
      case "program_officer":
        redirect("/program-officer")
      case "assistance_program_officer":
        redirect("/assistance-program-officer")
      case "branch_report_officer":
        redirect("/branch-report-officer")
      default:
        redirect("/")
    }
  }

  // Check account status
  if (context.status !== "active") {
    redirect("/")
  }

  return context
}

/**
 * Get default dashboard URL based on user role
 */
export function getDefaultDashboardUrl(role: UserRole): string {
  const dashboards: Record<UserRole, string> = {
    admin: "/admin",
    branch_manager: "/branch-manager",
    program_officer: "/program-officer",
    assistance_program_officer: "/assistance-program-officer",
    branch_report_officer: "/branch-report-officer",
  }

  return dashboards[role] || "/"
}

/**
 * Check if route is accessible by role (non-redirecting version)
 */
export async function isRouteAccessible(requiredRoles?: UserRole | UserRole[]): Promise<boolean> {
  try {
    const context = await getRBACContext()

    if (!context) return false
    if (requiredRoles && !hasRole(context, requiredRoles)) return false
    if (context.status !== "active") return false

    return true
  } catch {
    return false
  }
}

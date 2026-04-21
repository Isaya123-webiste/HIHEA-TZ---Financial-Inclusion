import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export type UserRole =
  | "admin"
  | "branch_manager"
  | "program_officer"
  | "assistance_program_officer"
  | "branch_report_officer"

export interface RBACContext {
  userId: string
  role: UserRole
  branchId: string | null
  branchName?: string
  status: "active" | "inactive" | "pending"
}

/**
 * Get current user's RBAC context
 * Returns user info including role, branch, and permissions
 */
export async function getRBACContext(): Promise<RBACContext | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        role,
        branch_id,
        status,
        branches(name)
      `)
      .eq("id", user.id)
      .single()

    if (error || !profile) return null

    return {
      userId: profile.id,
      role: profile.role as UserRole,
      branchId: profile.branch_id,
      branchName: (profile.branches as any)?.name,
      status: profile.status,
    }
  } catch (error) {
    console.error("[RBAC] Error getting RBAC context:", error)
    return null
  }
}

/**
 * Check if user has specific role
 */
export function hasRole(context: RBACContext | null, requiredRole: UserRole | UserRole[]): boolean {
  if (!context) return false
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  return roles.includes(context.role)
}

/**
 * Check if user has access to specific branch
 * Admin can access all branches, others can only access their own
 */
export function canAccessBranch(context: RBACContext | null, branchId: string): boolean {
  if (!context) return false
  if (context.role === "admin") return true
  return context.branchId === branchId
}

/**
 * Check if user can submit forms (branch_report_officer)
 */
export function canSubmitForms(context: RBACContext | null): boolean {
  return hasRole(context, "branch_report_officer")
}

/**
 * Check if user can review/approve forms
 * (program_officer or assistance_program_officer)
 */
export function canReviewForms(context: RBACContext | null): boolean {
  return hasRole(context, ["program_officer", "assistance_program_officer"])
}

/**
 * Check if user can manage users and branches
 * (admin only)
 */
export function canManageUsers(context: RBACContext | null): boolean {
  return hasRole(context, "admin")
}

/**
 * Check if user can view reports
 * (admin, branch_manager, and report officers)
 */
export function canViewReports(context: RBACContext | null): boolean {
  return hasRole(context, ["admin", "branch_manager", "branch_report_officer"])
}

/**
 * Get dashboard filter context based on user role
 * Returns filter parameters for querying data
 */
export function getDashboardFilterContext(context: RBACContext | null) {
  if (!context) return null

  if (context.role === "admin") {
    // Admin sees all data, can filter by any branch/project
    return {
      isAdmin: true,
      defaultBranchId: null,
      defaultProjectId: null,
      canFilterByBranch: true,
      canFilterByProject: true,
    }
  }

  // Non-admin users are auto-filtered to their branch
  return {
    isAdmin: false,
    defaultBranchId: context.branchId,
    defaultProjectId: null, // Will be filtered by branch's projects
    canFilterByBranch: false, // Cannot change branch (locked to their branch)
    canFilterByProject: true, // Can filter projects within their branch
  }
}

/**
 * Get sidebar menu items based on user role
 * Returns array of menu item configurations
 */
export function getSidebarMenuItems(context: RBACContext | null) {
  if (!context) return []

  const baseMenu = [
    { label: "Dashboard", href: "/dashboard", roles: ["admin", "branch_manager", "program_officer", "assistance_program_officer", "branch_report_officer"] as UserRole[] },
  ]

  const roleMenus: Record<UserRole, typeof baseMenu> = {
    admin: [
      ...baseMenu,
      { label: "Users", href: "/admin/users", roles: ["admin"] },
      { label: "Branches", href: "/admin/branches", roles: ["admin"] },
      { label: "Projects", href: "/admin/projects", roles: ["admin"] },
      { label: "Data Overview", href: "/admin/data-overview", roles: ["admin"] },
    ],
    branch_manager: [
      ...baseMenu,
      { label: "Team", href: "/branch-manager/team", roles: ["branch_manager"] },
      { label: "Profile", href: "/branch-manager/profile", roles: ["branch_manager"] },
    ],
    program_officer: [
      ...baseMenu,
      { label: "Forms", href: "/forms", roles: ["program_officer", "assistance_program_officer"] },
    ],
    assistance_program_officer: [
      ...baseMenu,
      { label: "Forms", href: "/forms", roles: ["program_officer", "assistance_program_officer"] },
    ],
    branch_report_officer: [
      ...baseMenu,
      { label: "Forms", href: "/forms", roles: ["branch_report_officer"] },
      { label: "Reports", href: "/reports", roles: ["branch_report_officer"] },
    ],
  }

  return roleMenus[context.role] || baseMenu
}

/**
 * Verify user authentication and return RBAC context
 * Use in server components and route handlers
 */
export async function requireAuth(requiredRoles?: UserRole | UserRole[]) {
  const context = await getRBACContext()

  if (!context) {
    throw new Error("Not authenticated")
  }

  if (requiredRoles && !hasRole(context, requiredRoles)) {
    throw new Error("Insufficient permissions")
  }

  if (context.status !== "active") {
    throw new Error("Account not active")
  }

  return context
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { RBACContext, UserRole } from "@/lib/rbac-utils"
import { getSidebarMenuItems } from "@/lib/rbac-utils"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavigationItem {
  label: string
  href: string
  roles: UserRole[]
  icon?: string
  subItems?: { label: string; href: string }[]
}

interface RBACNavigationProps {
  context: RBACContext | null
  collapsed?: boolean
  isMobileOpen?: boolean
  onItemClick?: () => void
}

export default function RBACNavigation({
  context,
  collapsed = false,
  isMobileOpen = false,
  onItemClick,
}: RBACNavigationProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [visibleItems, setVisibleItems] = useState<NavigationItem[]>([])

  useEffect(() => {
    if (!context) return

    // Build menu items based on user role
    const allItems: NavigationItem[] = [
      {
        label: "Dashboard",
        href: "/dashboard",
        roles: ["admin", "branch_manager", "program_officer", "assistance_program_officer", "branch_report_officer"],
      },
      {
        label: "Users",
        href: "/admin/users",
        roles: ["admin"],
      },
      {
        label: "Branches",
        href: "/admin/branches",
        roles: ["admin"],
      },
      {
        label: "Projects",
        href: "/admin/projects",
        roles: ["admin"],
      },
      {
        label: "Data Overview",
        href: "/admin/data-overview",
        roles: ["admin"],
        subItems: [
          {
            label: "Weights",
            href: "/admin/data-overview/weights",
          },
        ],
      },
      {
        label: "Team",
        href: "/branch-manager/team",
        roles: ["branch_manager"],
      },
      {
        label: "Profile",
        href: "/branch-manager/profile",
        roles: ["branch_manager"],
      },
      {
        label: "Forms",
        href: "/forms",
        roles: ["program_officer", "assistance_program_officer", "branch_report_officer"],
      },
      {
        label: "Reports",
        href: "/reports",
        roles: ["branch_report_officer"],
      },
    ]

    // Filter items based on user role
    const filtered = allItems.filter((item) => item.roles.includes(context.role))
    setVisibleItems(filtered)
  }, [context])

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    )
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <nav className="flex flex-col space-y-1">
      {visibleItems.map((item) => (
        <div key={item.label}>
          {item.subItems ? (
            <div>
              <button
                onClick={() => toggleExpanded(item.label)}
                className={cn(
                  "w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center justify-between",
                  "hover:bg-gray-100 dark:hover:bg-slate-800",
                  expandedItems.includes(item.label) && "bg-gray-100 dark:bg-slate-800",
                )}
              >
                <span className="text-sm font-medium">{item.label}</span>
                {expandedItems.includes(item.label) ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {expandedItems.includes(item.label) && (
                <div className="ml-4 space-y-1">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      onClick={onItemClick}
                      className={cn(
                        "block px-4 py-2 rounded-lg text-sm transition-colors",
                        isActive(subItem.href)
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800",
                      )}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "block px-4 py-2 rounded-lg text-sm transition-colors",
                isActive(item.href)
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800",
              )}
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}

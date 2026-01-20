"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X, ChevronUp, ChevronDown } from "lucide-react"
import { supabase } from "@/lib/supabase-client"

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigationItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: "dashboard",
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: "people",
  },
  {
    name: "Branches",
    href: "/admin/branches",
    icon: "business",
  },
  {
    name: "Projects",
    href: "/admin/projects",
    icon: "folder",
  },
  {
    name: "Data Overview",
    href: null,
    icon: "analytics",
    subItems: [
      {
        name: "Weights Configuration",
        href: "/admin/data-overview/weights",
      },
    ],
  },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(["Data Overview"])
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName],
    )
  }

  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 shadow-lg dark:shadow-slate-950/50 transition-all duration-300 lg:relative lg:translate-x-0 border-r border-slate-200 dark:border-slate-700
          ${isCollapsed ? "w-16" : "w-64"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header */}
        <div
          className={`border-b border-slate-200 dark:border-slate-700 ${isCollapsed ? "px-2 py-4 space-y-3" : "px-4 py-4 flex items-center justify-between"}`}
        >
          {/* Hamburger button - positioned above logo when collapsed, top-right when expanded */}
          {isCollapsed && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 w-10 h-10"
              >
                <span className="material-icons text-slate-600 dark:text-slate-400 text-lg">menu</span>
              </Button>
            </div>
          )}

          {/* Logo and branding */}
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="rounded-lg p-2">
                <Image src="/icon.png" alt="HIH Logo" width={24} height={24} />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">HIH Admin</span>
            </div>
          )}

          {isCollapsed && (
            <div className="flex justify-center">
              <div className="rounded-lg p-2">
                <Image src="/icon.png" alt="HIH Logo" width={24} height={24} />
              </div>
            </div>
          )}

          {/* Hamburger button for expanded state */}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 w-10 h-10"
            >
              <span className="material-icons text-slate-600 dark:text-slate-400 text-lg">menu_open</span>
            </Button>
          )}

          {/* Mobile close button */}
          <Button variant="ghost" size="sm" onClick={() => setIsMobileOpen(false)} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${isCollapsed ? "px-2 py-4 space-y-2" : "px-2 py-2 space-y-1"}`}>
          {navigationItems.map((item) => {
            const isActive =
              item.href && (pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)))
            const hasSubItems = "subItems" in item && item.subItems
            const isExpanded = expandedItems.includes(item.name)

            return (
              <div key={item.name}>
                {hasSubItems && !item.href ? (
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={`
                      w-full flex items-center justify-between rounded-lg text-sm font-medium transition-colors
                      ${isExpanded ? "text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800" : "text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}
                      ${isCollapsed ? "justify-center p-3 w-12 h-12" : "gap-3 px-3 py-2"}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-icons text-xl">{item.icon}</span>
                      {!isCollapsed && <span>{item.name}</span>}
                    </div>
                    {!isCollapsed &&
                      (isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-500 dark:text-slate-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-500" />
                      ))}
                  </button>
                ) : (
                  <Link
                    href={item.href || "#"}
                    className={`
                      flex items-center rounded-lg text-sm font-medium transition-colors
                      ${isActive ? "text-white bg-blue-500 dark:bg-blue-600" : "text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}
                      ${isCollapsed ? "justify-center p-3 w-12 h-12" : "gap-3 px-3 py-2"}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <span className="material-icons text-xl">{item.icon}</span>
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                )}

                {!isCollapsed && hasSubItems && isExpanded && "subItems" in item && (
                  <div className="ml-2 mt-2 space-y-1 border-l border-slate-200 dark:border-slate-700 pl-3">
                    {item.subItems.map((subItem) => {
                      const isSubActive = pathname === subItem.href
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={`
                            flex items-center rounded-md text-sm font-medium transition-colors px-3 py-2
                            ${isSubActive ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-800" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"}
                          `}
                        >
                          {subItem.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className={`border-t border-slate-200 dark:border-slate-700 ${isCollapsed ? "px-2 py-4" : "px-2 py-2"}`}>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={`
              text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors
              ${isCollapsed ? "w-12 h-12 p-3 justify-center" : "w-full justify-start gap-3 px-3 py-2"}
            `}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setIsMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-slate-900 dark:text-white">HIH Admin</h1>
          <div className="w-8" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

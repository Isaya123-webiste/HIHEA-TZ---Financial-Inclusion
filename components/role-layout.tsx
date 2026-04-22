"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X, Home, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase-client"

interface RoleLayoutProps {
  children: React.ReactNode
  userRole: string
  userName?: string
}

const navigationItemsByRole = {
  branch_manager: [
    {
      name: "Dashboard",
      href: "/branch-manager",
      icon: Home,
    },
    {
      name: "Forms",
      href: "/branch-manager/forms",
      icon: FileText,
    },
    {
      name: "Team",
      href: "/branch-manager/team",
      icon: Home,
    },
  ],
  program_officer: [
    {
      name: "Dashboard",
      href: "/program-officer",
      icon: Home,
    },
    {
      name: "Forms",
      href: "/program-officer/forms",
      icon: FileText,
    },
  ],
  assistance_program_officer: [
    {
      name: "Dashboard",
      href: "/assistance-program-officer",
      icon: Home,
    },
    {
      name: "Forms",
      href: "/assistance-program-officer/forms",
      icon: FileText,
    },
  ],
  branch_report_officer: [
    {
      name: "Dashboard",
      href: "/branch-report-officer",
      icon: Home,
    },
    {
      name: "Forms",
      href: "/branch-report-officer/forms",
      icon: FileText,
    },
  ],
}

export function RoleLayout({ children, userRole, userName = "User" }: RoleLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const navigationItems =
    (navigationItemsByRole as any)[userRole] ||
    (navigationItemsByRole as any).branch_manager ||
    []

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-800">
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
          {isCollapsed && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 w-10 h-10"
              >
                <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </Button>
            </div>
          )}

          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="rounded-lg p-2">
                <Image src="/icon.png" alt="HIH Logo" width={24} height={24} />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">HIH</span>
            </div>
          )}

          {isCollapsed && (
            <div className="flex justify-center">
              <div className="rounded-lg p-2">
                <Image src="/icon.png" alt="HIH Logo" width={24} height={24} />
              </div>
            </div>
          )}

          {!isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 w-10 h-10"
            >
              <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={() => setIsMobileOpen(false)} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${isCollapsed ? "px-2 py-4 space-y-2" : "px-2 py-2 space-y-1"}`}>
          {navigationItems.map((item: any) => {
            const isActive = pathname === item.href || (item.href !== pathname.split("/")[1] && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full ${isCollapsed ? "justify-center px-2" : "justify-start px-3"} ${
                    isActive ? "bg-cyan-600 hover:bg-cyan-700 text-white" : "text-slate-700 dark:text-slate-300"
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="h-5 w-5" />
                  {!isCollapsed && <span className="ml-3">{item.name}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className={`border-t border-slate-200 dark:border-slate-700 ${isCollapsed ? "px-2 py-4" : "px-2 py-2"}`}>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={`w-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 ${
              isCollapsed ? "justify-center px-2" : "justify-start px-3"
            }`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">Sign Out</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setIsMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-slate-900 dark:text-white">{userName}</h1>
          <div className="w-10" />
        </div>

        {/* Main Content Area */}
        {children}
      </div>
    </div>
  )
}

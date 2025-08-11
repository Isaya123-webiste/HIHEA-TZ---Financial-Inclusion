"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X } from "lucide-react"
import { supabase } from "@/lib/supabase-client"

interface AdminLayoutProps {
  children: React.ReactNode
}

// Update the navigationItems array to include Users
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
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
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

  // Close mobile menu when route changes
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
          fixed inset-y-0 left-0 z-50 flex flex-col bg-white shadow-lg transition-all duration-300 lg:relative lg:translate-x-0
          ${isCollapsed ? "w-16" : "w-64"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-red-600 p-2">
                <span className="material-icons text-white text-lg">admin_panel_settings</span>
              </div>
              <span className="font-bold text-gray-900">HIH Admin</span>
            </div>
          )}
          {isCollapsed && (
            <div className="flex w-full justify-center">
              <div className="rounded-lg bg-red-600 p-2">
                <span className="material-icons text-white text-lg">admin_panel_settings</span>
              </div>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:flex">
            <span className="material-icons text-gray-600">
              {isCollapsed ? "keyboard_arrow_right" : "keyboard_arrow_left"}
            </span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsMobileOpen(false)} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                  ${isActive ? "bg-red-100 text-red-700" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}
                  ${isCollapsed ? "justify-center" : ""}
                `}
                title={isCollapsed ? item.name : undefined}
              >
                <span className="material-icons text-xl">{item.icon}</span>
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={`
              w-full justify-start gap-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900
              ${isCollapsed ? "justify-center px-3" : ""}
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
        <div className="flex h-16 items-center justify-between border-b bg-white px-4 lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setIsMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-gray-900">HIH Admin</h1>
          <div className="w-8" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

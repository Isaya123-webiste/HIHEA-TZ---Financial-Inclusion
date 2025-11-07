"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Menu, X, LogOut, AlertCircle, Target, FileText, BarChart3, CheckCircle } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase-client"
import { getUserProfile } from "@/lib/auth"

export default function AssistanceProgramOfficerDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true)
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push("/")
          return
        }

        const profileResult = await getUserProfile(user.id)
        if (profileResult.error || !profileResult.profile) {
          setError("Failed to load profile")
          return
        }

        const userProfile = profileResult.profile

        if (userProfile.role !== "assistance_program_officer") {
          router.push("/")
          return
        }

        if (userProfile.status !== "active") {
          setError("Your account is not active. Please contact administrator.")
          return
        }

        setProfile(userProfile)
      } catch (error) {
        console.error("Error loading user data:", error)
        setError("Failed to load user data")
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  const navigationItems = [
    { icon: BarChart3, label: "Dashboard", href: "/assistance-program-officer", active: true },
    { icon: FileText, label: "Forms", href: "/assistance-program-officer/forms", active: false },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#009edb] border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Card className="w-full max-w-md">
          <CardContent className="text-center space-y-4 p-6">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-600">Access Error</h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => router.push("/")} className="w-full bg-red-600 hover:bg-red-700">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 bg-[#009edb] transition-all duration-300 lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${sidebarCollapsed ? "w-16" : "w-64"}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="bg-white p-2 rounded-lg shadow-md">
                  <Target className="h-6 w-6 text-[#009edb]" />
                </div>
                <div className="text-white">
                  <h2 className="font-semibold text-sm">Assistance Program Officer</h2>
                  <p className="text-xs text-blue-100">HIH Financial</p>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="flex items-center justify-center w-full">
                <div className="bg-white p-2 rounded-lg shadow-md">
                  <Target className="h-6 w-6 text-[#009edb]" />
                </div>
              </div>
            )}

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-white hover:bg-blue-500 transition-colors"
            >
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`
                  flex items-center gap-3 w-full p-3 rounded-lg text-white transition-all duration-200
                  ${item.active ? "bg-white/20 shadow-lg" : "hover:bg-white/10"}
                  ${sidebarCollapsed ? "justify-center" : ""}
                `}
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>

          <div className="p-4">
            <button
              onClick={handleSignOut}
              className={`
                flex items-center gap-3 w-full p-3 rounded-lg text-white hover:bg-white/10 transition-colors
                ${sidebarCollapsed ? "justify-center" : ""}
              `}
              title={sidebarCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex h-16 items-center justify-between border-b bg-white px-4 lg:hidden shadow-sm">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-gray-900">Dashboard</h1>
          <div className="w-8" />
        </div>

        <div className="hidden lg:flex h-20 items-center justify-between border-b bg-white px-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {profile?.full_name || "Assistance Program Officer"}
            </h1>
            <p className="text-gray-600 text-sm mt-1">Branch: {profile?.branch_name || "N/A"}</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-6">
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              Welcome to your dashboard. You can view and read forms submitted by Branch Report Officers.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white shadow-sm border hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">View Forms</h3>
                    <p className="text-sm text-gray-600">Access and read submitted forms</p>
                  </div>
                </div>
                <Link href="/assistance-program-officer/forms">
                  <Button className="w-full mt-4 bg-[#009edb] hover:bg-[#007bb5]">Go to Forms</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

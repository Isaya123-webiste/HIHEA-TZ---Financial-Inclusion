"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, CheckCircle, Target, LogOut, Menu, AlertCircle, BarChart3, FileText, X } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getUserProfile } from "@/lib/auth"

export default function ProgramOfficerPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [metrics, setMetrics] = useState({
    totalPrograms: 0,
    activePrograms: 0,
    participants: 0,
    programStatus: "Loading...",
  })
  const router = useRouter()

  useEffect(() => {
    async function loadUserData() {
      try {
        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !authUser) {
          router.push("/")
          return
        }

        setUser(authUser)

        const profileResult = await getUserProfile(authUser.id)
        if (profileResult.error || !profileResult.profile) {
          setError("Failed to load profile")
          return
        }

        const userProfile = profileResult.profile

        if (userProfile.role !== "program_officer") {
          switch (userProfile.role) {
            case "admin":
              router.push("/admin")
              break
            case "branch_manager":
              router.push("/branch-manager")
              break
            case "branch_report_officer":
              router.push("/report-officer")
              break
            default:
              router.push("/dashboard")
          }
          return
        }

        if (userProfile.status !== "active") {
          setError("Your account is not active. Please contact administrator.")
          return
        }

        setProfile(userProfile)
        await loadMetrics(userProfile.branch_id)
      } catch (error) {
        console.error("Load user data error:", error)
        setError("Failed to load user data")
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  const loadMetrics = async (branchId: string) => {
    try {
      const { data: programOfficersData } = await supabase
        .from("profiles")
        .select("id")
        .eq("branch_id", branchId)
        .eq("role", "program_officer")

      const { data: activeProgramOfficersData } = await supabase
        .from("profiles")
        .select("id")
        .eq("branch_id", branchId)
        .eq("role", "program_officer")
        .eq("status", "active")

      const totalPrograms = programOfficersData?.length || 0
      const activePrograms = activeProgramOfficersData?.length || 0

      setMetrics({
        totalPrograms,
        activePrograms,
        participants: activePrograms * 10, // Estimated participants
        programStatus: activePrograms > 0 ? "Active" : "Inactive",
      })
    } catch (error) {
      console.error("Error loading metrics:", error)
      setMetrics({
        totalPrograms: 0,
        activePrograms: 0,
        participants: 0,
        programStatus: "Error",
      })
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent mx-auto"
            style={{ borderColor: "#009edb", borderTopColor: "transparent" }}
          ></div>
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
            <AlertCircle className="h-12 w-12 mx-auto" style={{ color: "#009edb" }} />
            <h2 className="text-xl font-semibold" style={{ color: "#009edb" }}>
              Access Error
            </h2>
            <p className="text-gray-600">{error}</p>
            <Button
              onClick={() => router.push("/")}
              className="w-full text-white hover:opacity-90"
              style={{ backgroundColor: "#009edb" }}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const navigationItems = [
    { icon: BarChart3, label: "Dashboard", href: "/program-officer", active: true },
    { icon: FileText, label: "Forms", href: "/program-officer/forms", active: false },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transition-all duration-300 lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${sidebarCollapsed ? "w-16" : "w-64"}
        `}
        style={{ backgroundColor: "#009edb" }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="bg-white p-2 rounded-lg">
                  <Target className="h-6 w-6" style={{ color: "#009edb" }} />
                </div>
                <div className="text-white">
                  <h2 className="font-semibold">Program Officer</h2>
                  <p className="text-xs opacity-80">HIH Financial</p>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="flex items-center justify-center w-full">
                <div className="bg-white p-2 rounded-lg">
                  <Target className="h-6 w-6" style={{ color: "#009edb" }} />
                </div>
              </div>
            )}

            {/* Hamburger button for desktop */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-white hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`
                  flex items-center gap-3 w-full p-3 rounded-lg text-white transition-colors
                  ${item.active ? "bg-white bg-opacity-20" : "hover:bg-white hover:bg-opacity-10"}
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

          {/* Bottom section */}
          <div className="p-4">
            <button
              onClick={handleSignOut}
              className={`
                flex items-center gap-3 w-full p-3 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-colors
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
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b bg-white px-4 lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-gray-900">Program Officer</h1>
          <div className="w-8" />
        </div>

        {/* Desktop Header with Hamburger */}
        <div className="hidden lg:flex h-16 items-center justify-between border-b bg-white px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Program Officer Dashboard</h1>
              <p className="text-gray-600 text-sm">
                Welcome, {profile?.full_name || "Officer"}! Welcome to HIH Financial Inclusion Program Panel
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Page Header */}
        <div className="bg-white px-6 py-4 lg:hidden">
          <h1 className="text-2xl font-bold text-gray-900">Program Officer Dashboard</h1>
          <p className="text-gray-600 text-sm">
            Welcome, {profile?.full_name || "Officer"}! Welcome to HIH Financial Inclusion Program Panel
          </p>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto bg-gray-50 px-6 py-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Programs Card */}
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Programs</p>
                    <h2 className="text-4xl font-bold mt-1 text-gray-900">{metrics.totalPrograms}</h2>
                    <p className="text-sm text-gray-500 mt-1">Available programs</p>
                  </div>
                  <Target className="h-6 w-6 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Active Programs Card */}
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Programs</p>
                    <h2 className="text-4xl font-bold mt-1 text-gray-900">{metrics.activePrograms}</h2>
                    <p className="text-sm text-gray-500 mt-1">Running programs</p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Participants Card */}
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Participants</p>
                    <h2 className="text-4xl font-bold mt-1 text-gray-900">{metrics.participants}</h2>
                    <p className="text-sm text-gray-500 mt-1">Program participants</p>
                  </div>
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Program Status Card */}
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Program Status</p>
                    <h2
                      className={`text-4xl font-bold mt-1 ${metrics.programStatus === "Active" ? "text-green-600" : "text-red-600"}`}
                    >
                      {metrics.programStatus}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {metrics.programStatus === "Active" ? "All programs operational" : "Needs attention"}
                    </p>
                  </div>
                  <CheckCircle
                    className={`h-6 w-6 ${metrics.programStatus === "Active" ? "text-green-500" : "text-red-500"}`}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

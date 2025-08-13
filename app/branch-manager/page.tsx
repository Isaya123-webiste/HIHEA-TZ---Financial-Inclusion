"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, CheckCircle, Building2, LogOut, Menu, AlertCircle, BarChart3, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getUserProfile } from "@/lib/auth"
import { getBranchMetrics } from "@/lib/branch-metrics-actions"

export default function BranchManagerPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [metrics, setMetrics] = useState({
    totalMembers: 0,
    activeLoans: 0,
    activeMembers: 0,
    reportOfficers: 0,
    programOfficers: 0,
    branchManagers: 0,
    branchStatus: "Loading...",
  })
  const [branch, setBranch] = useState<any>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadUserData()

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (profile?.branch_id && user?.id) {
        loadMetrics(profile.branch_id, user.id)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [profile?.branch_id, user?.id])

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError(null)

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

      if (userProfile.role !== "branch_manager") {
        switch (userProfile.role) {
          case "admin":
            router.push("/admin")
            break
          case "program_officer":
            router.push("/program-officer")
            break
          case "branch_report_officer":
          case "report_officer":
            router.push("/branch-report-officer")
            break
          default:
            router.push("/")
        }
        return
      }

      if (userProfile.status !== "active") {
        setError("Your account is not active. Please contact administrator.")
        return
      }

      setProfile(userProfile)

      if (!userProfile.branch_id) {
        setError("Your account is not assigned to a branch. Please contact administrator.")
        return
      }

      await loadMetrics(userProfile.branch_id, authUser.id)
    } catch (error) {
      console.error("Load user data error:", error)
      setError("Failed to load user data")
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async (branchId: string, currentUserId: string) => {
    try {
      console.log("Loading branch metrics...")
      const result = await getBranchMetrics(branchId, currentUserId)

      if (result.error) {
        console.error("Metrics error:", result.error)
        setError(result.error)
        return
      }

      if (result.branch) {
        setBranch(result.branch)
      }

      if (result.metrics) {
        setMetrics(result.metrics)
        setLastUpdated(new Date())
        console.log("Metrics updated:", result.metrics)
      }
    } catch (error) {
      console.error("Load metrics error:", error)
      setError("Failed to load metrics")
    }
  }

  const handleRefresh = async () => {
    if (profile?.branch_id && user?.id) {
      await loadMetrics(profile.branch_id, user.id)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const formatLastUpdated = () => {
    if (!lastUpdated) return ""
    return `Last updated: ${lastUpdated.toLocaleTimeString()}`
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
            <div className="space-y-2">
              <Button
                onClick={loadUserData}
                className="w-full text-white hover:opacity-90"
                style={{ backgroundColor: "#009edb" }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={() => router.push("/")} variant="outline" className="w-full">
                Go to Login
              </Button>
            </div>
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

      {/* Sidebar - Collapsible */}
      <div
        className={`
    fixed inset-y-0 left-0 z-50 transition-all duration-300 bg-white border-r border-gray-200 shadow-lg lg:relative lg:translate-x-0
    ${isCollapsed ? "w-16" : "w-64"}
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
  `}
      >
        <div className="flex flex-col h-full">
          {/* Header with toggle */}
          <div className="flex items-center justify-between h-16 px-4">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "#009edb" }}>
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <span className="text-gray-900 font-semibold">Branch Manager</span>
              </div>
            )}
            {isCollapsed && (
              <div className="flex w-full justify-center">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "#009edb" }}>
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-600 hover:bg-gray-100 hidden lg:flex"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1">
            <Link
              href="/branch-manager"
              className={`
    flex items-center gap-3 w-full p-3 rounded-lg bg-gray-100 text-gray-900 font-medium transition-colors
    ${isCollapsed ? "justify-center" : ""}
  `}
              title={isCollapsed ? "Dashboard" : undefined}
            >
              <BarChart3 className="h-5 w-5" />
              {!isCollapsed && <span>Dashboard</span>}
            </Link>
            <Link
              href="/branch-manager/team"
              className={`
    flex items-center gap-3 w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors
    ${isCollapsed ? "justify-center" : ""}
  `}
              title={isCollapsed ? "Team" : undefined}
            >
              <Users className="h-5 w-5" />
              {!isCollapsed && <span>Team</span>}
            </Link>
          </nav>

          {/* Bottom icon */}
          <div className="p-2">
            <button
              onClick={handleSignOut}
              className={`
    flex items-center gap-3 w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors
    ${isCollapsed ? "justify-center" : ""}
  `}
              title={isCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span>Sign Out</span>}
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
          <h1 className="font-semibold text-gray-900">Branch Manager</h1>
          <div className="w-8" />
        </div>

        {/* Page Header */}
        <div className="bg-white px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Branch Manager Dashboard</h1>
              <p className="text-gray-600 text-sm">
                Welcome, {profile?.full_name || "Manager"}! Welcome to HIH Financial Inclusion Branch Panel
              </p>
              {branch && (
                <p className="text-gray-500 text-xs mt-1">
                  {branch.name} Branch • {formatLastUpdated()}
                </p>
              )}
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto bg-gray-50 px-6 py-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Members Card */}
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Members</p>
                    <h2 className="text-4xl font-bold mt-1 text-gray-900">{metrics.totalMembers}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {metrics.reportOfficers} Report • {metrics.programOfficers} Program • {metrics.branchManagers}{" "}
                      Managers
                    </p>
                  </div>
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Active Loans Card */}
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Loans</p>
                    <h2 className="text-4xl font-bold mt-1 text-gray-900">{metrics.activeLoans}</h2>
                    <p className="text-sm text-gray-500 mt-1">Current loans</p>
                  </div>
                  <Building2 className="h-6 w-6 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Active Members Card */}
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Members</p>
                    <h2 className="text-4xl font-bold mt-1 text-gray-900">{metrics.activeMembers}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {metrics.activeMembers} of {metrics.totalMembers} members active
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </CardContent>
            </Card>

            {/* Branch Status Card */}
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Branch Status</p>
                    <h2
                      className={`text-4xl font-bold mt-1 ${
                        metrics.branchStatus === "Active"
                          ? "text-green-600"
                          : metrics.branchStatus === "Pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {metrics.branchStatus}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {metrics.branchStatus === "Active"
                        ? "All systems operational"
                        : metrics.branchStatus === "Pending"
                          ? "Members need activation"
                          : "Needs attention"}
                    </p>
                  </div>
                  <CheckCircle
                    className={`h-6 w-6 ${
                      metrics.branchStatus === "Active"
                        ? "text-green-500"
                        : metrics.branchStatus === "Pending"
                          ? "text-yellow-500"
                          : "text-red-500"
                    }`}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/branch-manager/team">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Users className="h-4 w-4 mr-2" />
                      View Team Members ({metrics.totalMembers})
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start bg-transparent" disabled>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle, PieChart, LogOut, Menu, AlertCircle, BarChart3, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getUserProfileSimple } from "@/lib/admin-actions"

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  status: string
  branch_id: string
  branch_name?: string
}

interface DashboardMetrics {
  totalReports: number
  activeReports: number
  dataPoints: number
  reportStatus: string
}

export default function BranchReportOfficerPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalReports: 0,
    activeReports: 0,
    dataPoints: 0,
    reportStatus: "Loading...",
  })
  const router = useRouter()

  useEffect(() => {
    loadUserData()
  }, [router, retryCount])

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get authenticated user with timeout
      const authPromise = supabase.auth.getUser()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Authentication timeout")), 10000),
      )

      const {
        data: { user: authUser },
        error: userError,
      } = (await Promise.race([authPromise, timeoutPromise])) as any

      if (userError) {
        console.error("Auth error:", userError)
        if (userError.message?.includes("Invalid JWT")) {
          // Clear invalid session and redirect
          await supabase.auth.signOut()
          router.push("/")
          return
        }
        throw new Error(`Authentication failed: ${userError.message}`)
      }

      if (!authUser) {
        console.log("No authenticated user found")
        router.push("/")
        return
      }

      setUser(authUser)

      // Get user profile with retry logic
      const profileResult = await getUserProfileSimple(authUser.id)

      if (!profileResult.success) {
        console.error("Profile error:", profileResult.error)

        if (profileResult.code === "RATE_LIMIT") {
          setError("Service is busy. Retrying automatically...")
          // Auto-retry after delay for rate limits
          setTimeout(() => {
            setRetryCount((prev) => prev + 1)
          }, 3000)
          return
        }

        if (profileResult.code === "NOT_FOUND") {
          setError("User profile not found. Please contact administrator.")
          return
        }

        throw new Error(profileResult.error || "Failed to load profile")
      }

      if (!profileResult.profile) {
        setError("User profile data is incomplete. Please contact administrator.")
        return
      }

      const userProfile = profileResult.profile

      // Check user role
      const validRoles = ["branch_report_officer", "report_officer"]
      if (!validRoles.includes(userProfile.role)) {
        console.log("User role mismatch:", userProfile.role)
        // Redirect based on actual role
        switch (userProfile.role) {
          case "admin":
            router.push("/admin")
            break
          case "branch_manager":
            router.push("/branch-manager")
            break
          case "program_officer":
            router.push("/program-officer")
            break
          default:
            router.push("/")
        }
        return
      }

      // Check account status
      if (userProfile.status !== "active") {
        setError("Your account is not active. Please contact administrator.")
        return
      }

      setProfile(userProfile)

      // Load metrics if user has a branch
      if (userProfile.branch_id) {
        await loadMetrics(userProfile.branch_id)
      } else {
        console.warn("User has no branch assigned")
        setMetrics({
          totalReports: 0,
          activeReports: 0,
          dataPoints: 0,
          reportStatus: "No Branch Assigned",
        })
      }
    } catch (error: any) {
      console.error("Load user data error:", error)

      if (error.message?.includes("timeout")) {
        setError("Connection timeout. Please check your internet connection and try again.")
      } else if (error.message?.includes("fetch")) {
        setError("Network error. Please check your connection and try again.")
      } else {
        setError(error.message || "An unexpected error occurred. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async (branchId: string) => {
    try {
      // Try to load from form_submissions table first
      const { data: formsData, error: formsError } = await supabase
        .from("form_submissions")
        .select("id, status")
        .eq("branch_id", branchId)

      if (formsError && !formsError.message?.includes("does not exist")) {
        console.warn("Form submissions query error:", formsError)
      }

      if (formsData) {
        // Use form_submissions data
        const totalForms = formsData.length
        const draftForms = formsData.filter((f) => f.status === "draft").length
        const submittedForms = formsData.filter((f) => f.status === "submitted").length
        const activeForms = draftForms + submittedForms

        setMetrics({
          totalReports: totalForms,
          activeReports: activeForms,
          dataPoints: totalForms * 30,
          reportStatus: totalForms > 0 ? "Active" : "No Forms",
        })
        return
      }

      // Fallback to basic metrics
      setMetrics({
        totalReports: 0,
        activeReports: 0,
        dataPoints: 0,
        reportStatus: "Ready",
      })
    } catch (error) {
      console.error("Error loading metrics:", error)
      setMetrics({
        totalReports: 0,
        activeReports: 0,
        dataPoints: 0,
        reportStatus: "Ready",
      })
    }
  }

  const handleSignOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
      }
    } catch (error) {
      console.error("Sign out exception:", error)
    } finally {
      router.push("/")
    }
  }

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 mx-auto"
            style={{ borderColor: "#009edb", borderTopColor: "transparent" }}
          ></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
          {retryCount > 0 && <p className="mt-1 text-sm text-gray-500">Retry attempt {retryCount}</p>}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Card className="w-full max-w-md">
          <CardContent className="text-center space-y-4 p-6">
            <AlertCircle className="h-12 w-12 mx-auto" style={{ color: "#009edb" }} />
            <h2 className="text-xl font-semibold" style={{ color: "#009edb" }}>
              Dashboard Error
            </h2>
            <p className="text-gray-600">{error}</p>
            <div className="flex gap-2">
              <Button onClick={handleRetry} className="flex-1" style={{ backgroundColor: "#009edb", color: "white" }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={() => router.push("/")} variant="outline" className="flex-1">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Navigation items
  const navigationItems = [
    { icon: BarChart3, label: "Dashboard", href: "/branch-report-officer", active: true },
    { icon: FileText, label: "Forms", href: "/branch-report-officer/forms", active: false },
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
          fixed inset-y-0 left-0 z-50 w-16 transition-transform duration-300 lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ backgroundColor: "#009edb" }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16">
            <div className="bg-white p-2 rounded-lg">
              <PieChart className="h-6 w-6" style={{ color: "#009edb" }} />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1">
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center justify-center w-full p-3 rounded-lg text-white transition-colors ${
                  item.active ? "bg-white bg-opacity-20" : "hover:bg-white hover:bg-opacity-10"
                }`}
                title={item.label}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            ))}
          </nav>

          {/* Sign out button */}
          <div className="p-2">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center w-full p-3 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
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
          <h1 className="font-semibold text-gray-900">Branch Report Officer</h1>
          <div className="w-8" />
        </div>

        {/* Desktop Header */}
        <div className="bg-white px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Branch Report Officer Dashboard</h1>
              <p className="text-gray-600 text-sm">
                Welcome, {profile?.full_name || "Officer"}!{profile?.branch_name && ` • ${profile.branch_name} Branch`}
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto bg-gray-50 px-6 py-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Forms Card */}
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Forms</p>
                    <h2 className="text-4xl font-bold mt-1 text-gray-900">{metrics.totalReports}</h2>
                    <p className="text-sm text-gray-500 mt-1">All forms created</p>
                  </div>
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Active Forms Card */}
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Forms</p>
                    <h2 className="text-4xl font-bold mt-1 text-gray-900">{metrics.activeReports}</h2>
                    <p className="text-sm text-gray-500 mt-1">In progress</p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Data Points Card */}
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Data Points</p>
                    <h2 className="text-4xl font-bold mt-1 text-gray-900">{metrics.dataPoints}</h2>
                    <p className="text-sm text-gray-500 mt-1">Collected data</p>
                  </div>
                  <PieChart className="h-6 w-6 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <h2
                      className="text-2xl font-bold mt-1"
                      style={{
                        color:
                          metrics.reportStatus === "Active"
                            ? "#10b981"
                            : metrics.reportStatus.includes("Error")
                              ? "#ef4444"
                              : "#009edb",
                      }}
                    >
                      {metrics.reportStatus}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Current status</p>
                  </div>
                  <CheckCircle
                    className="h-6 w-6"
                    style={{
                      color:
                        metrics.reportStatus === "Active"
                          ? "#10b981"
                          : metrics.reportStatus.includes("Error")
                            ? "#ef4444"
                            : "#009edb",
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <Link href="/branch-report-officer/forms" className="block">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: "#009edb" }}>
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Manage Forms</h4>
                        <p className="text-sm text-gray-500">Create and edit forms</p>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <Link href="/branch-report-officer/forms?filter=draft" className="block">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-yellow-500">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Draft Forms</h4>
                        <p className="text-sm text-gray-500">Continue editing drafts</p>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <Link href="/branch-report-officer/forms?filter=submitted" className="block">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-green-500">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Submitted Forms</h4>
                        <p className="text-sm text-gray-500">View submitted forms</p>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

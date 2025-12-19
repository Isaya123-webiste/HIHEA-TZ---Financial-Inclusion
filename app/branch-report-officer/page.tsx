"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  CheckCircle,
  PieChart,
  LogOut,
  Menu,
  AlertCircle,
  BarChart3,
  RefreshCw,
  TrendingUp,
  Target,
  Award,
  Calendar,
  Send,
  Edit,
} from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getUserProfileSimple } from "@/lib/admin-actions"
import { getFormsByUser, type FormSubmission } from "@/lib/enhanced-forms-actions"

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
  draftForms: number
}

export default function BranchReportOfficerPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [forms, setForms] = useState<FormSubmission[]>([])
  const [showRecentForms, setShowRecentForms] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalReports: 0,
    activeReports: 0,
    draftForms: 0,
  })
  const router = useRouter()

  useEffect(() => {
    loadUserData()
  }, [router, retryCount])

  const loadRealFormsData = async (userId: string) => {
    try {
      console.log("Loading forms data for user:", userId)
      const result = await getFormsByUser(userId)

      if (result.success && result.data) {
        console.log("Forms loaded successfully:", result.data.length, "forms")
        setForms(result.data)

        // Calculate real metrics from actual forms data
        const totalForms = result.data.length
        const approvedForms = result.data.filter((form: FormSubmission) => form.status === "approved").length
        const submittedForms = result.data.filter((form: FormSubmission) => form.status === "submitted").length
        const reviewedForms = result.data.filter((form: FormSubmission) => form.status === "reviewed").length
        const draftForms = result.data.filter((form: FormSubmission) => form.status === "draft").length

        console.log("Metrics calculated:", {
          total: totalForms,
          approved: approvedForms,
          submitted: submittedForms,
          reviewed: reviewedForms,
          draft: draftForms,
        })

        setMetrics({
          totalReports: approvedForms + draftForms, // Sum of approved and draft forms only
          activeReports: approvedForms,
          draftForms: draftForms,
        })
      } else {
        console.warn("Failed to load forms:", result.error)
        setForms([])
        setMetrics({
          totalReports: 0, // This will be 0 + 0 when no forms exist
          activeReports: 0,
          draftForms: 0,
        })
      }
    } catch (error) {
      console.error("Error loading real forms data:", error)
      setForms([])
      setMetrics({
        totalReports: 0, // This will be 0 + 0 when error occurs
        activeReports: 0,
        draftForms: 0,
      })
    }
  }

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError(null)

      await new Promise((resolve) => setTimeout(resolve, 500))

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
        if (userError.message?.includes("session") || userError.message?.includes("JWT")) {
          console.log("[v0] Session error after redirect, retrying...")
          if (retryCount < 2) {
            setTimeout(() => setRetryCount((prev) => prev + 1), 1000)
            return
          }
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

      if (userProfile.status !== "active") {
        setError("Your account is not active. Please contact administrator.")
        return
      }

      setProfile(userProfile)
      await loadRealFormsData(authUser.id)
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

  const handleRefreshData = async () => {
    if (user && !refreshing) {
      setRefreshing(true)
      console.log("Refreshing dashboard data...")

      try {
        // Force reload forms data
        await loadRealFormsData(user.id)
        console.log("Dashboard data refreshed successfully")
      } catch (error) {
        console.error("Error refreshing data:", error)
      } finally {
        setRefreshing(false)
      }
    }
  }

  const toggleRecentForms = () => {
    setShowRecentForms(!showRecentForms)
  }

  // Calculate performance metrics
  const completionRate = metrics.totalReports > 0 ? Math.round((metrics.activeReports / metrics.totalReports) * 100) : 0
  const submissionRate =
    metrics.totalReports > 0
      ? Math.round((forms.filter((f) => f.status !== "draft").length / metrics.totalReports) * 100)
      : 0
  const thisWeekForms = forms.filter((f) => {
    const formDate = new Date(f.created_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return formDate >= weekAgo
  }).length

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
          fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isCollapsed ? "w-16" : "w-64"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          shadow-lg lg:shadow-none
        `}
        style={{ backgroundColor: "#009edb" }}
      >
        <div className="flex flex-col h-full">
          {/* Header - Expanded State */}
          {!isCollapsed && (
            <div className="flex items-center justify-between h-16 px-4">
              <div className="flex items-center gap-2">
                <div className="bg-white p-2 rounded-lg">
                  <PieChart className="h-6 w-6" style={{ color: "#009edb" }} />
                </div>
                <span className="font-bold text-white">HIH Report</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex text-white hover:bg-white hover:bg-opacity-20"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Header - Collapsed State */}
          {isCollapsed && (
            <div className="flex flex-col items-center pt-4 pb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex text-white hover:bg-white hover:bg-opacity-20 mb-2"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="bg-white p-2 rounded-lg">
                <PieChart className="h-6 w-6" style={{ color: "#009edb" }} />
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className={`flex-1 p-2 space-y-1 ${isCollapsed ? "pt-2" : ""}`}>
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center gap-3 w-full p-3 rounded-lg text-white transition-colors ${
                  item.active ? "bg-white bg-opacity-20" : "hover:bg-white hover:bg-opacity-10"
                } ${isCollapsed ? "justify-center" : ""}`}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* Sign out button */}
          <div className="p-2">
            <button
              onClick={handleSignOut}
              className={`flex items-center gap-3 w-full p-3 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-colors ${
                isCollapsed ? "justify-center" : ""
              }`}
              title={isCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">Sign Out</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
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
            <div className="flex items-center gap-4">
              {/* Toggle Switch for Recent Forms */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Show Recent Forms</span>
                <button
                  onClick={toggleRecentForms}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    showRecentForms ? "bg-blue-500" : "bg-gray-300"
                  }`}
                  role="switch"
                  aria-checked={showRecentForms}
                  aria-label="Toggle recent forms display"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showRecentForms ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <Button onClick={handleRefreshData} variant="outline" size="sm" disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh Data"}
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto bg-gray-50 px-6 py-6">
          {/* Performance Overview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Performance Overview</h2>
              {completionRate >= 80 && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <Award className="h-3 w-3 mr-1" />
                  High Performer
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Completion Rate</p>
                      <p className="text-2xl font-bold">{completionRate}%</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-200" />
                  </div>
                  <Progress value={completionRate} className="mt-2 bg-blue-400" />
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Submission Rate</p>
                      <p className="text-2xl font-bold">{submissionRate}%</p>
                    </div>
                    <Send className="h-8 w-8 text-green-200" />
                  </div>
                  <Progress value={submissionRate} className="mt-2 bg-green-400" />
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">This Week</p>
                      <p className="text-2xl font-bold">{thisWeekForms}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-200" />
                  </div>
                  <p className="text-purple-100 text-xs mt-2">Forms created</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Streak</p>
                      <p className="text-2xl font-bold">{Math.min(thisWeekForms, 7)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-200" />
                  </div>
                  <p className="text-orange-100 text-xs mt-2">Days active</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

            {/* Approved Forms Card */}
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved Forms</p>
                    <h2 className="text-4xl font-bold mt-1 text-gray-900">{metrics.activeReports}</h2>
                    <p className="text-sm text-gray-500 mt-1">Successfully approved</p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </CardContent>
            </Card>

            {/* Draft Forms Card */}
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Draft Forms</p>
                    <h2 className="text-4xl font-bold mt-1 text-gray-900">{metrics.draftForms}</h2>
                    <p className="text-sm text-gray-500 mt-1">Pending completion</p>
                  </div>
                  <Edit className="h-6 w-6 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Forms Summary - Toggle */}
          {showRecentForms && forms.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Forms</h3>
              <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {forms.slice(0, 5).map((form) => (
                      <div
                        key={form.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">{form.group_name || form.title}</h4>
                          <p className="text-sm text-gray-500">{form.location}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              form.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : form.status === "submitted"
                                  ? "bg-blue-100 text-blue-800"
                                  : form.status === "reviewed"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{new Date(form.updated_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {forms.length > 5 && (
                    <div className="mt-4 text-center">
                      <Link href="/branch-report-officer/forms">
                        <Button variant="outline" size="sm">
                          View All Forms ({forms.length})
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty state when no forms and recent forms is toggled on */}
          {showRecentForms && forms.length === 0 && (
            <div className="mb-6">
              <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Forms Yet</h3>
                  <p className="text-gray-500 mb-4">You haven't created any forms yet.</p>
                  <Link href="/branch-report-officer/forms">
                    <Button style={{ backgroundColor: "#009edb", color: "white" }}>
                      <FileText className="h-4 w-4 mr-2" />
                      Create Your First Form
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

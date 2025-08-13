"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  DollarSign,
  TrendingUp,
  Target,
  Calendar,
  BarChart3,
  UserCheck,
  AlertCircle,
  Building2,
  CheckCircle,
  FileText,
  Settings,
  LogOut,
  Menu,
} from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getUserProfile } from "@/lib/auth"
import { AIChatbot } from "@/components/ai-chatbot"
import { AIReportGenerator } from "@/components/ai-report-generator"

export default function BranchManagerDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadUserData() {
      try {
        // Get current user
        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !authUser) {
          router.push("/")
          return
        }

        setUser(authUser)

        // Get user profile
        const profileResult = await getUserProfile(authUser.id)
        if (profileResult.error || !profileResult.profile) {
          setError("Failed to load profile")
          return
        }

        const userProfile = profileResult.profile

        // Check if user has the correct role
        if (userProfile.role !== "branch_manager") {
          // Redirect to appropriate dashboard based on actual role
          switch (userProfile.role) {
            case "admin":
              router.push("/admin")
              break
            case "program_officer":
              router.push("/dashboard/program-officer")
              break
            case "branch_report_officer":
              router.push("/dashboard/report-officer")
              break
            default:
              router.push("/dashboard")
          }
          return
        }

        // Check if user account is active
        if (userProfile.status !== "active") {
          setError("Your account is not active. Please contact administrator.")
          return
        }

        setProfile(userProfile)
      } catch (error) {
        console.error("Load user data error:", error)
        setError("Failed to load user data")
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center space-y-4 p-6">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
            <h2 className="text-xl font-semibold text-red-600">Access Error</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => router.push("/")} className="w-full bg-red-600 hover:bg-red-700">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const navigationItems = [
    { icon: BarChart3, label: "Dashboard", active: true },
    { icon: Users, label: "Team Management" },
    { icon: FileText, label: "Reports" },
    { icon: Target, label: "Targets" },
    { icon: Calendar, label: "Schedule" },
    { icon: Settings, label: "Settings" },
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
        fixed inset-y-0 left-0 z-50 w-16 bg-red-600 shadow-lg transition-transform duration-300 lg:relative lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-red-500">
            <div className="rounded-lg bg-white p-2">
              <Building2 className="h-6 w-6 text-red-600" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-2">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                className={`
                  flex w-full items-center justify-center rounded-lg p-3 text-white transition-colors
                  ${item.active ? "bg-red-500" : "hover:bg-red-500"}
                `}
                title={item.label}
              >
                <item.icon className="h-5 w-5" />
              </button>
            ))}
          </nav>

          {/* Sign Out */}
          <div className="p-2">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-center rounded-lg p-3 text-white hover:bg-red-500 transition-colors"
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
          <h1 className="font-semibold text-gray-900">Branch Manager</h1>
          <div className="w-8" />
        </div>

        {/* Page Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-600 p-2">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Branch Manager Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome, {profile?.full_name}! Welcome to HIH Financial Inclusion Branch Panel
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Metrics Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Members</p>
                    <p className="text-3xl font-bold text-gray-900">1,234</p>
                    <p className="text-sm text-gray-500">Registered members</p>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Loans</p>
                    <p className="text-3xl font-bold text-gray-900">156</p>
                    <p className="text-sm text-gray-500">Current loans</p>
                  </div>
                  <div className="rounded-full bg-green-100 p-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                    <p className="text-3xl font-bold text-gray-900">94.5%</p>
                    <p className="text-sm text-gray-500">Monthly performance</p>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Branch Status</p>
                    <p className="text-3xl font-bold text-green-600">Active</p>
                    <p className="text-sm text-gray-500">All systems operational</p>
                  </div>
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Content */}
          <div className="grid gap-6 lg:grid-cols-3 mb-8">
            {/* Team Performance */}
            <div className="lg:col-span-2">
              <Card className="bg-white shadow-sm border-0">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-blue-100 p-2">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Program Officers</p>
                          <p className="text-sm text-gray-500">5 active officers</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-purple-100 p-2">
                          <FileText className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Report Officers</p>
                          <p className="text-sm text-gray-500">2 active officers</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">Good</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-green-100 p-1">
                      <UserCheck className="h-3 w-3 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New member registration</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-blue-100 p-1">
                      <DollarSign className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Loan approval completed</p>
                      <p className="text-xs text-gray-500">4 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-purple-100 p-1">
                      <FileText className="h-3 w-3 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Monthly report submitted</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Features */}
          <div className="grid gap-6 lg:grid-cols-2">
            <AIChatbot userId={user?.id} />
            <AIReportGenerator userId={user?.id} />
          </div>
        </div>
      </div>
    </div>
  )
}

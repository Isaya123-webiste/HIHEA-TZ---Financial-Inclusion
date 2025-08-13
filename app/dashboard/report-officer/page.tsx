"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  MessageCircle,
  Brain,
  Clock,
  CheckCircle,
  AlertTriangle,
  PieChart,
  Activity,
} from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getUserProfile } from "@/lib/admin-actions"
import AiChatbot from "@/components/ai-chatbot"
import AiReportGenerator from "@/components/ai-report-generator"
import DashboardLayout from "@/components/dashboard-layout"

// Navigation items for report officer
const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard/branch-report-officer",
    icon: "dashboard",
  },
  {
    name: "Reports",
    href: "/dashboard/branch-report-officer/reports",
    icon: "description",
  },
  {
    name: "Forms",
    href: "/dashboard/branch-report-officer/forms",
    icon: "assignment",
  },
]

export default function ReportOfficerDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAiChat, setShowAiChat] = useState(false)
  const [showAiReports, setShowAiReports] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadUserData() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push("/")
          return
        }

        setCurrentUser(user)
        const profileResult = await getUserProfile(user.id)

        if (profileResult.error) {
          setError(profileResult.error)
        } else if (profileResult.profile) {
          setProfile(profileResult.profile)

          // Check if user has correct role
          if (profileResult.profile.role !== "branch_report_officer") {
            // Redirect to appropriate dashboard based on role
            if (profileResult.profile.role === "admin") {
              router.push("/admin")
            } else if (profileResult.profile.role === "branch_manager") {
              router.push("/dashboard/branch-manager")
            } else if (profileResult.profile.role === "program_officer") {
              router.push("/dashboard/program-officer")
            } else {
              router.push("/dashboard")
            }
            return
          } else {
            // Redirect to the new path
            router.push("/branch-report-officer")
            return
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        setError("Failed to load user data")
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout
      navigationItems={navigationItems}
      title="Report Officer"
      accentColor="orange"
      userRole="report-officer"
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Report Officer Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}! Manage reports and analytics for
            HIH Financial Inclusion
          </p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <Badge className="bg-orange-100 text-orange-800">Report Officer</Badge>
          <Button
            onClick={() => setShowAiChat(!showAiChat)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            AI Assistant
          </Button>
          <Button
            onClick={() => setShowAiReports(!showAiReports)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            AI Reports
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Points</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,847</div>
              <p className="text-xs text-muted-foreground">Analyzed this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.5%</div>
              <p className="text-xs text-muted-foreground">Data accuracy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Due this week</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Report Generator */}
        {showAiReports && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>AI Report Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <AiReportGenerator
                branches={[{ id: profile?.branch_id || "1", name: "Your Branch" }]}
                userRole="branch_report_officer"
                userId={currentUser?.id}
              />
            </CardContent>
          </Card>
        )}

        {/* AI Chatbot */}
        {showAiChat && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <AiChatbot
                userContext={{
                  userId: currentUser?.id,
                  userRole: "branch_report_officer",
                  branchName: "Your Branch",
                  recentActivity: ["Generated monthly report", "Analyzed member data", "Updated performance metrics"],
                }}
              />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Status */}
            <Card>
              <CardHeader>
                <CardTitle>Report Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium">Monthly Financial Report</p>
                        <p className="text-sm text-muted-foreground">Submitted on time</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-800">Completed</Badge>
                      <p className="text-sm text-muted-foreground mt-1">Dec 1, 2024</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-8 w-8 text-yellow-600" />
                      <div>
                        <p className="font-medium">Weekly Performance Report</p>
                        <p className="text-sm text-muted-foreground">In progress</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                      <p className="text-sm text-muted-foreground mt-1">Due Dec 15</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="font-medium">Quarterly Analysis Report</p>
                        <p className="text-sm text-muted-foreground">Overdue</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                      <p className="text-sm text-muted-foreground mt-1">Was due Dec 10</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Data Analytics Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <PieChart className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium">Member Distribution</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Active Members</span>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">New Members</span>
                        <span className="text-sm font-medium">15%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Inactive Members</span>
                        <span className="text-sm font-medium">7%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      <h3 className="font-medium">Financial Performance</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Loan Portfolio</span>
                        <span className="text-sm font-medium">$2.4M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Collections</span>
                        <span className="text-sm font-medium">94.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Growth Rate</span>
                        <span className="text-sm font-medium">+12%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Report
                </Button>
              </CardContent>
            </Card>

            {/* Report Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Report Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start text-sm">
                  Monthly Financial Summary
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  Member Activity Report
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  Performance Analytics
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  Compliance Report
                </Button>
              </CardContent>
            </Card>

            {/* Officer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Officer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <strong>Officer:</strong> {profile?.full_name}
                  </p>
                  <p>
                    <strong>Branch:</strong> Main Branch
                  </p>
                  <p>
                    <strong>Reports Generated:</strong> 47
                  </p>
                  <p>
                    <strong>Data Accuracy:</strong> 98.5%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

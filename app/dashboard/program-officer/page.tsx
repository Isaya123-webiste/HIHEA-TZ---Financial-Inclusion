"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LogOut,
  Users,
  HandHeart,
  BookOpen,
  Calendar,
  FileText,
  MessageCircle,
  UserPlus,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
} from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getUserProfile } from "@/lib/admin-actions"
import AiChatbot from "@/components/ai-chatbot"

export default function ProgramOfficerDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAiChat, setShowAiChat] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
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
          if (profileResult.profile.role !== "program_officer") {
            // Redirect to appropriate dashboard based on role
            if (profileResult.profile.role === "admin") {
              router.push("/admin")
            } else if (profileResult.profile.role === "branch_manager") {
              router.push("/dashboard/branch-manager")
            } else if (profileResult.profile.role === "branch_report_officer") {
              router.push("/dashboard/report-officer")
            } else {
              router.push("/dashboard")
            }
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-green-600 p-2">
                <HandHeart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Program Officer Dashboard</h1>
                <p className="text-sm text-muted-foreground">HIH Financial Inclusion</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-green-100 text-green-800">Program Officer</Badge>
              <Button
                onClick={() => setShowAiChat(!showAiChat)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                AI Assistant
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Welcome back, {profile?.full_name?.split(" ")[0] || "Officer"}!</h2>
          <p className="text-muted-foreground">Manage community programs and support member development.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">156</div>
                  <p className="text-xs text-muted-foreground">Under your care</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Training Sessions</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New Enrollments</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-muted-foreground">This week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">89%</div>
                  <p className="text-xs text-muted-foreground">Program completion</p>
                </CardContent>
              </Card>
            </div>

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Clock className="h-8 w-8 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium">Financial Literacy Training</p>
                      <p className="text-sm text-muted-foreground">9:00 AM - 11:00 AM</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Community Center Hall A
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Users className="h-8 w-8 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">Member Consultation</p>
                      <p className="text-sm text-muted-foreground">2:00 PM - 4:00 PM</p>
                      <p className="text-sm text-muted-foreground">Individual member meetings</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Scheduled</Badge>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <FileText className="h-8 w-8 text-orange-600" />
                    <div className="flex-1">
                      <p className="font-medium">Weekly Report Submission</p>
                      <p className="text-sm text-muted-foreground">5:00 PM - 6:00 PM</p>
                      <p className="text-sm text-muted-foreground">Submit weekly progress report</p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Member Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Member Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Sarah Mwangi</p>
                      <p className="text-sm text-muted-foreground">Microfinance Training - Week 3</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                      <p className="text-sm text-muted-foreground mt-1">95% attendance</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">John Kimani</p>
                      <p className="text-sm text-muted-foreground">Business Development - Week 2</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-yellow-100 text-yellow-800">Needs Support</Badge>
                      <p className="text-sm text-muted-foreground mt-1">60% attendance</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Grace Wanjiku</p>
                      <p className="text-sm text-muted-foreground">Digital Literacy - Week 1</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-blue-100 text-blue-800">Good</Badge>
                      <p className="text-sm text-muted-foreground mt-1">80% attendance</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Chatbot */}
            {showAiChat && (
              <AiChatbot
                userContext={{
                  userId: currentUser?.id,
                  userRole: "program_officer",
                  branchName: "Your Branch",
                  recentActivity: ["Conducted training session", "Met with 5 members", "Updated member progress"],
                }}
              />
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Member
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Schedule Training
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Submit Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Calendar
                </Button>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <strong>Officer:</strong> {profile?.full_name}
                  </p>
                  <p>
                    <strong>Branch:</strong> Main Branch
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{profile?.phone || "+255 123 456 789"}</span>
                  </p>
                  <p>
                    <strong>Members Assigned:</strong> 156
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

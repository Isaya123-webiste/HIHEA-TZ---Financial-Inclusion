"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase-client"
import { getUserProfile } from "@/lib/admin-actions"
import DashboardLayout from "@/components/dashboard-layout"

// Navigation items for report officer
const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard/report-officer",
    icon: "dashboard",
  },
  {
    name: "Reports",
    href: "/dashboard/report-officer/reports",
    icon: "description",
  },
  {
    name: "Analytics",
    href: "/dashboard/report-officer/analytics",
    icon: "analytics",
  },
  {
    name: "Forms",
    href: "/dashboard/report-officer/forms",
    icon: "assignment",
  },
  {
    name: "Profile",
    href: "/dashboard/report-officer/profile",
    icon: "person",
  },
]

export default function ReportOfficerProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

        const profileResult = await getUserProfile(user.id)

        if (profileResult.error) {
          setError(profileResult.error)
        } else if (profileResult.profile) {
          setProfile(profileResult.profile)

          // Check if user has correct role
          if (profileResult.profile.role !== "branch_report_officer") {
            router.push("/dashboard")
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
          <p className="mt-2 text-muted-foreground">Loading your profile...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Summary Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src="/placeholder.svg?height=96&width=96" alt={profile?.full_name} />
                <AvatarFallback>
                  {profile?.full_name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("") || "RO"}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold">{profile?.full_name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{profile?.email}</p>
              <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                Report Officer
              </div>
              <div className="w-full mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Branch:</span>
                  <span className="font-medium">Main Branch</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reports Generated:</span>
                  <span className="font-medium">47</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Member Since:</span>
                  <span className="font-medium">Jan 2024</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="personal">
                <TabsList className="mb-4">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" defaultValue={profile?.full_name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" defaultValue={profile?.email} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" defaultValue={profile?.phone || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch</Label>
                      <Input id="branch" defaultValue="Main Branch" disabled />
                    </div>
                  </div>
                  <Button className="mt-4">Save Changes</Button>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button className="mt-4">Update Password</Button>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Email Notifications</h3>
                        <p className="text-sm text-muted-foreground">Receive email notifications for reports</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="email-notifications" className="sr-only">
                          Email Notifications
                        </Label>
                        <input type="checkbox" id="email-notifications" className="h-4 w-4" defaultChecked />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Report Reminders</h3>
                        <p className="text-sm text-muted-foreground">Get reminders for upcoming reports</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="report-reminders" className="sr-only">
                          Report Reminders
                        </Label>
                        <input type="checkbox" id="report-reminders" className="h-4 w-4" defaultChecked />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">AI Suggestions</h3>
                        <p className="text-sm text-muted-foreground">Allow AI to suggest report improvements</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="ai-suggestions" className="sr-only">
                          AI Suggestions
                        </Label>
                        <input type="checkbox" id="ai-suggestions" className="h-4 w-4" defaultChecked />
                      </div>
                    </div>
                  </div>
                  <Button className="mt-4">Save Preferences</Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase-client"
import { getUserProfile } from "@/lib/admin-actions"
import DashboardLayout from "@/components/dashboard-layout"
import { FileText, Plus, Search } from "lucide-react"

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

export default function ReportOfficerForms() {
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
          <p className="mt-2 text-muted-foreground">Loading forms...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Report Forms</h1>
          <p className="text-muted-foreground">Create and manage report forms for data collection</p>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search forms..." className="pl-8" />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create New Form
          </Button>
        </div>

        {/* Forms Tabs */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Forms</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Monthly Financial Report Form */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Monthly Financial Report</CardTitle>
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Published</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Standard monthly financial reporting form for branch activities.
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground mb-4">
                    <FileText className="h-3 w-3 mr-1" />
                    <span>12 fields</span>
                    <span className="mx-2">•</span>
                    <span>Last updated: 2 days ago</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      Fill Out
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Member Activity Report Form */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Member Activity Report</CardTitle>
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Published</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track and report member engagement and activities.
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground mb-4">
                    <FileText className="h-3 w-3 mr-1" />
                    <span>8 fields</span>
                    <span className="mx-2">•</span>
                    <span>Last updated: 1 week ago</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      Fill Out
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quarterly Analysis Form */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Quarterly Analysis</CardTitle>
                    <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Draft</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comprehensive quarterly analysis of branch performance.
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground mb-4">
                    <FileText className="h-3 w-3 mr-1" />
                    <span>15 fields</span>
                    <span className="mx-2">•</span>
                    <span>Last updated: 3 days ago</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Report Form */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Compliance Report</CardTitle>
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Published</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Regulatory compliance reporting for branch operations.
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground mb-4">
                    <FileText className="h-3 w-3 mr-1" />
                    <span>10 fields</span>
                    <span className="mx-2">•</span>
                    <span>Last updated: 2 weeks ago</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      Fill Out
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Assessment Form */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Risk Assessment</CardTitle>
                    <div className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Archived</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Evaluate and document potential risks to branch operations.
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground mb-4">
                    <FileText className="h-3 w-3 mr-1" />
                    <span>14 fields</span>
                    <span className="mx-2">•</span>
                    <span>Last updated: 3 months ago</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Restore
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* New Form Template */}
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center h-full py-8">
                  <div className="rounded-full bg-orange-100 p-3 mb-4">
                    <Plus className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-medium mb-1">Create New Form</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">Start from scratch or use a template</p>
                  <Button>Create Form</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="draft" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Quarterly Analysis Form */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Quarterly Analysis</CardTitle>
                    <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Draft</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comprehensive quarterly analysis of branch performance.
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground mb-4">
                    <FileText className="h-3 w-3 mr-1" />
                    <span>15 fields</span>
                    <span className="mx-2">•</span>
                    <span>Last updated: 3 days ago</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="published" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Monthly Financial Report Form */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Monthly Financial Report</CardTitle>
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Published</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Standard monthly financial reporting form for branch activities.
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground mb-4">
                    <FileText className="h-3 w-3 mr-1" />
                    <span>12 fields</span>
                    <span className="mx-2">•</span>
                    <span>Last updated: 2 days ago</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      Fill Out
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Member Activity Report Form */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Member Activity Report</CardTitle>
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Published</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track and report member engagement and activities.
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground mb-4">
                    <FileText className="h-3 w-3 mr-1" />
                    <span>8 fields</span>
                    <span className="mx-2">•</span>
                    <span>Last updated: 1 week ago</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      Fill Out
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Report Form */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Compliance Report</CardTitle>
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Published</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Regulatory compliance reporting for branch operations.
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground mb-4">
                    <FileText className="h-3 w-3 mr-1" />
                    <span>10 fields</span>
                    <span className="mx-2">•</span>
                    <span>Last updated: 2 weeks ago</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1">
                      Fill Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="archived" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Risk Assessment Form */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Risk Assessment</CardTitle>
                    <div className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Archived</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Evaluate and document potential risks to branch operations.
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground mb-4">
                    <FileText className="h-3 w-3 mr-1" />
                    <span>14 fields</span>
                    <span className="mx-2">•</span>
                    <span>Last updated: 3 months ago</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Restore
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Form Builder */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Form Builder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="form-title">Form Title</Label>
                <Input id="form-title" placeholder="Enter form title..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="form-description">Description</Label>
                <Textarea id="form-description" placeholder="Enter form description..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="form-category">Category</Label>
                <Select>
                  <SelectTrigger id="form-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="member">Member Activity</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="risk">Risk Assessment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Form Fields</h3>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add Field
                  </Button>
                </div>

                <div className="border rounded-md p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-medium">Text Field</h4>
                      <p className="text-sm text-muted-foreground">Short text input field</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                  <Input placeholder="Text field example" disabled />
                </div>

                <div className="border rounded-md p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-medium">Number Field</h4>
                      <p className="text-sm text-muted-foreground">Numeric input field</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                  <Input type="number" placeholder="0" disabled />
                </div>

                <div className="border rounded-md p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-medium">Select Field</h4>
                      <p className="text-sm text-muted-foreground">Dropdown selection field</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  Save as Draft
                </Button>
                <Button className="flex-1">Publish Form</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

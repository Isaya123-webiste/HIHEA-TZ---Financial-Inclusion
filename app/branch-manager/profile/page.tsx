"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Users,
  Building2,
  FileText,
  LogOut,
  Menu,
  AlertCircle,
  BarChart3,
  User,
  ArrowLeft,
  Edit,
  Save,
  X,
} from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getUserProfile } from "@/lib/auth"

export default function BranchManagerProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    branch_name: "",
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

        if (userProfile.role !== "branch_manager") {
          router.push("/branch-manager")
          return
        }

        setProfile(userProfile)
        setFormData({
          full_name: userProfile.full_name || "",
          email: userProfile.email || "",
          phone: userProfile.phone || "",
          branch_name: userProfile.branch_name || "",
        })
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

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          branch_name: formData.branch_name,
        })
        .eq("id", user.id)

      if (error) throw error

      setProfile({ ...profile, ...formData })
      setEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update profile")
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Card className="w-full max-w-md">
          <CardContent className="text-center space-y-4 p-6">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
            <h2 className="text-xl font-semibold text-red-600">Error</h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => router.push("/branch-manager")} className="w-full bg-red-600 hover:bg-red-700">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const navigationItems = [
    { icon: BarChart3, label: "Dashboard", active: false, href: "/branch-manager" },
    { icon: User, label: "Profile", active: true, href: "/branch-manager/profile" },
    { icon: Users, label: "Team", active: false, href: "/branch-manager/team" },
    { icon: FileText, label: "Reports", active: false, href: "/branch-manager/reports" },
  ]

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-16 bg-red-600 transition-transform duration-300 lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16">
            <div className="bg-white p-2 rounded-lg">
              <Building2 className="h-6 w-6 text-red-600" />
            </div>
          </div>

          <nav className="flex-1 p-2 space-y-1">
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`
                  flex items-center justify-center w-full p-3 rounded-lg text-white transition-colors
                  ${item.active ? "bg-red-500" : "hover:bg-red-500"}
                `}
                title={item.label}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            ))}
          </nav>

          <div className="p-2">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center w-full p-3 rounded-lg text-white hover:bg-red-500 transition-colors"
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
          <h1 className="font-semibold text-gray-900">Profile</h1>
          <div className="w-8" />
        </div>

        {/* Page Header */}
        <div className="bg-white px-6 py-4 border-b">
          <div className="flex items-center gap-4">
            <Link href="/branch-manager">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
              <p className="text-gray-600 text-sm">Manage your account information</p>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="flex-1 overflow-auto bg-white px-6 py-6">
          <div className="max-w-2xl">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Profile Information</CardTitle>
                {!editing ? (
                  <Button
                    onClick={() => setEditing(true)}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm" className="bg-red-600 hover:bg-red-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setEditing(false)
                        setFormData({
                          full_name: profile?.full_name || "",
                          email: profile?.email || "",
                          phone: profile?.phone || "",
                          branch_name: profile?.branch_name || "",
                        })
                      }}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 hover:bg-gray-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium text-gray-600">
                      Full Name
                    </Label>
                    {editing ? (
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="border-gray-300"
                      />
                    ) : (
                      <p className="text-gray-900">{profile?.full_name || "Not set"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-600">
                      Email
                    </Label>
                    <p className="text-gray-900">{profile?.email || "Not set"}</p>
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-600">
                      Phone
                    </Label>
                    {editing ? (
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="border-gray-300"
                      />
                    ) : (
                      <p className="text-gray-900">{profile?.phone || "Not set"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium text-gray-600">
                      Role
                    </Label>
                    <p className="text-gray-900 capitalize">{profile?.role?.replace("_", " ") || "Not set"}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branch_name" className="text-sm font-medium text-gray-600">
                      Branch Name
                    </Label>
                    {editing ? (
                      <Input
                        id="branch_name"
                        value={formData.branch_name}
                        onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                        className="border-gray-300"
                      />
                    ) : (
                      <p className="text-gray-900">{profile?.branch_name || "Not set"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium text-gray-600">
                      Status
                    </Label>
                    <p
                      className={`text-sm font-medium ${profile?.status === "active" ? "text-green-600" : "text-red-600"}`}
                    >
                      {profile?.status || "Unknown"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

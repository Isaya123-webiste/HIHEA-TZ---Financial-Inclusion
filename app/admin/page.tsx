"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getAllUsers, getAllBranches, getUserProfileSimple } from "@/lib/admin-actions"
import { debugAdminUser, fixAdminRole } from "@/lib/debug-admin"

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [adminProfile, setAdminProfile] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [fixing, setFixing] = useState(false)

  const handleFixAdminRole = async () => {
    if (!currentUser) return

    setFixing(true)
    try {
      const result = await fixAdminRole(currentUser.id)
      console.log("Fix result:", result)

      if (result.success) {
        // Reload the page to check again
        window.location.reload()
      } else {
        setError(`Failed to fix admin role: ${result.error}`)
      }
    } catch (error) {
      console.error("Fix error:", error)
      setError("Failed to fix admin role")
    } finally {
      setFixing(false)
    }
  }

  useEffect(() => {
    async function checkAdminAndLoadData() {
      try {
        console.log("Starting admin check...")

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        console.log("Current user:", user)
        console.log("User error:", userError)

        if (userError || !user) {
          console.log("No user found, redirecting to login")
          router.push("/")
          return
        }

        setCurrentUser(user)

        // Special handling for isayaamos123@gmail.com - always grant admin access
        const isSpecialAdmin = user.email === "isayaamos123@gmail.com"

        if (isSpecialAdmin) {
          console.log("Special admin detected, granting access")
          setIsAdmin(true)

          // Load admin data
          const [usersResult, branchesResult] = await Promise.all([getAllUsers(), getAllBranches()])

          if (usersResult.success && usersResult.users) {
            setUsers(usersResult.users)
          }

          if (branchesResult.success && branchesResult.branches) {
            setBranches(branchesResult.branches)
          }

          setLoading(false)
          return
        }

        // Debug the user
        const debugResult = await debugAdminUser(user.id)
        setDebugInfo(debugResult)
        console.log("Debug result:", debugResult)

        // Get user profile first to debug
        console.log("Getting user profile for:", user.id)
        const profileResult = await getUserProfileSimple(user.id)
        console.log("Profile result:", profileResult)

        if (profileResult.success && profileResult.profile) {
          setAdminProfile(profileResult.profile)
          console.log("User profile:", profileResult.profile)
          console.log("User role:", profileResult.profile.role)

          // Check if user role is admin
          if (profileResult.profile.role === "admin") {
            console.log("User is admin, setting isAdmin to true")
            setIsAdmin(true)

            // Load users and branches for stats
            console.log("Loading admin data...")
            const [usersResult, branchesResult] = await Promise.all([getAllUsers(), getAllBranches()])

            console.log("Users result:", usersResult)
            console.log("Branches result:", branchesResult)

            if (usersResult.success && usersResult.users) {
              setUsers(usersResult.users)
            }

            if (branchesResult.success && branchesResult.branches) {
              setBranches(branchesResult.branches)
            }
          } else {
            console.log("User is not admin. Role:", profileResult.profile.role)
            setError(`Access denied. Your role is '${profileResult.profile.role}', but admin role is required.`)
          }
        } else {
          console.log("Failed to get profile:", profileResult.error)
          setError("Failed to load user profile. Profile may not exist.")
        }
      } catch (error) {
        console.error("Admin dashboard error:", error)
        setError("Failed to load admin dashboard")
      } finally {
        setLoading(false)
      }
    }

    checkAdminAndLoadData()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center max-w-2xl">
          <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 text-lg font-semibold">{error}</p>

          {currentUser && (
            <div className="mt-6">
              <button
                onClick={handleFixAdminRole}
                disabled={fixing}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {fixing ? "Fixing..." : "Fix Admin Role"}
              </button>
            </div>
          )}

          {(adminProfile || debugInfo) && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
              <h3 className="font-semibold mb-2">Debug Info:</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>User ID:</strong> {currentUser?.id}
                </p>
                <p>
                  <strong>Auth Email:</strong> {currentUser?.email}
                </p>
                {adminProfile && (
                  <>
                    <p>
                      <strong>Profile Email:</strong> {adminProfile.email}
                    </p>
                    <p>
                      <strong>Role:</strong> {adminProfile.role}
                    </p>
                    <p>
                      <strong>Status:</strong> {adminProfile.status}
                    </p>
                    <p>
                      <strong>Branch ID:</strong> {adminProfile.branch_id || "None"}
                    </p>
                  </>
                )}
                {debugInfo?.specificUser && (
                  <div className="mt-2 pt-2 border-t">
                    <p>
                      <strong>Found Profile:</strong> Yes
                    </p>
                    <p>
                      <strong>Profile Role:</strong> {debugInfo.specificUser.role}
                    </p>
                  </div>
                )}
                {debugInfo?.errors?.specificError && (
                  <div className="mt-2 pt-2 border-t">
                    <p>
                      <strong>Profile Error:</strong> {debugInfo.errors.specificError.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 text-lg font-semibold">Access denied. Admin privileges required.</p>
          <p className="text-muted-foreground mt-2">Checking permissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome{adminProfile?.full_name ? `, ${adminProfile.full_name.split(" ")[0]}` : ""}! Welcome to HIH Financial
          Inclusion Admin Panel
        </p>
      </div>

      {/* Stats Cards Only */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <span className="material-icons text-muted-foreground">people</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
            <span className="material-icons text-muted-foreground">business</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.length}</div>
            <p className="text-xs text-muted-foreground">Active locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Branches</CardTitle>
            <span className="material-icons text-green-600">check_circle</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.filter((b) => b.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">Operational branches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <span className="material-icons text-green-600">check_circle</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, Building2, FileText, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getAllUsers, getAllBranches, getUserProfileSimple } from "@/lib/admin-actions"
import { debugAdminUser, fixAdminRole } from "@/lib/debug-admin"
import UsageChart from "@/components/usage-chart"
import FactorsFilterBar from "@/components/factors-filter-bar"
import AccessTable from "@/components/access-table"

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [submittedForms, setSubmittedForms] = useState(0)
  const [approvedForms, setApprovedForms] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [adminProfile, setAdminProfile] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [fixing, setFixing] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set())

  const handleFixAdminRole = async () => {
    if (!currentUser) return

    setFixing(true)
    try {
      const result = await fixAdminRole(currentUser.id)
      console.log("Fix result:", result)

      if (result.success) {
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

  const fetchFormStats = async () => {
    try {
      const { data: submitted, error: submittedError } = await supabase
        .from("form_submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "submitted")

      const { data: approved, error: approvedError } = await supabase
        .from("form_submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved")

      if (!submittedError && submitted) {
        setSubmittedForms(submitted.length || 0)
      }

      if (!approvedError && approved) {
        setApprovedForms(approved.length || 0)
      }
    } catch (error) {
      console.error("Error fetching form stats:", error)
    }
  }

  useEffect(() => {
    async function checkAdminAndLoadData() {
      try {
        console.log("Starting admin check...")

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

          await fetchFormStats()

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

            await fetchFormStats()
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
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, <span className="font-semibold text-gray-900">{adminProfile?.full_name || "Admin"}</span>!
          </p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p className="font-medium">Last updated: Just now</p>
          <div className="mt-1 w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center text-white font-bold">
            {adminProfile?.full_name ? adminProfile.full_name.charAt(0) : "A"}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Card 1: Total Users - Black background */}
        <Card className="bg-black border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
            <Users className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{users.length}</div>
            <p className="text-xs text-gray-400">Registered users</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-400 font-semibold">
              <span>↑ 12%</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Branches - Blue background */}
        <Card className="bg-[#009EDB] border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Branches</CardTitle>
            <Building2 className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{branches.length}</div>
            <p className="text-xs text-white/80">Active locations</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-300 font-semibold">
              <span>↑ 4.1%</span>
              <span className="text-white/60">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Forms Submitted by B.R.Os - Black background */}
        <Card className="bg-black border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Forms Submitted</CardTitle>
            <FileText className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{submittedForms}</div>
            <p className="text-xs text-gray-400">By B.R.Os</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-red-400 font-semibold">
              <span>↓ 2.5%</span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Forms Approved by P.O - Blue background */}
        <Card className="bg-[#009EDB] border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Forms Approved</CardTitle>
            <CheckCircle className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{approvedForms}</div>
            <p className="text-xs text-white/80">By P.O</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-300 font-semibold">
              <span>↑ 8.1%</span>
              <span className="text-white/60">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 text-sm font-medium">
        <span className="text-gray-600">Status Range:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-gray-600">31%-50%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500"></div>
          <span className="text-gray-600">21%-30%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-gray-600">0%-20%</span>
        </div>
      </div>

      {/* Shared filter controls outside chart components */}
      <FactorsFilterBar
        selectedProjects={selectedProjects}
        setSelectedProjects={setSelectedProjects}
        selectedBranches={selectedBranches}
        setSelectedBranches={setSelectedBranches}
      />

      {/* Pass filters to Usage chart */}
      <UsageChart selectedProjects={selectedProjects} selectedBranches={selectedBranches} />

      <AccessTable selectedProjects={selectedProjects} selectedBranches={selectedBranches} />

      {/* Future: Barriers chart will also receive these same filters */}
      {/* <BarriersChart selectedProjects={selectedProjects} selectedBranches={selectedBranches} /> */}
    </div>
  )
}

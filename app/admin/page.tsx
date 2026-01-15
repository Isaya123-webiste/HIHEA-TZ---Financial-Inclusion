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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome{adminProfile?.full_name ? `, ${adminProfile.full_name.split(" ")[0]}` : ""}! Welcome to HIH Financial
          Inclusion Admin Panel
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Card 1: Total Users - White background */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Users</CardTitle>
            <Users className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{users.length}</div>
            <p className="text-xs text-gray-600">Registered users</p>
          </CardContent>
        </Card>

        {/* Card 2: Total Branches - Blue background */}
        <Card className="bg-[#009EDB]" style={{ backgroundColor: "#009EDB" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Branches</CardTitle>
            <Building2 className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{branches.length}</div>
            <p className="text-xs text-white/80">Active locations</p>
          </CardContent>
        </Card>

        {/* Card 3: Forms Submitted by B.R.Os - White background */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Forms Submitted</CardTitle>
            <FileText className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{submittedForms}</div>
            <p className="text-xs text-gray-600">By B.R.Os</p>
          </CardContent>
        </Card>

        {/* Card 4: Forms Approved by P.O - Blue background */}
        <Card className="bg-[#009EDB]" style={{ backgroundColor: "#009EDB" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Forms Approved</CardTitle>
            <CheckCircle className="h-5 w-5 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{approvedForms}</div>
            <p className="text-xs text-white/80">By P.O</p>
          </CardContent>
        </Card>
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

      {/* Future: Barriers and Access charts will also receive these same filters */}
      {/* <BarriersChart selectedProjects={selectedProjects} selectedBranches={selectedBranches} /> */}
      {/* <AccessChart selectedProjects={selectedProjects} selectedBranches={selectedBranches} /> */}
    </div>
  )
}

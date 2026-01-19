"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Shield } from "lucide-react"
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
      const submitResponse = await fetch(
        `https://dovunpjjaiagtcxmayav.supabase.co/rest/v1/form_submissions?select=id&status=eq.submitted`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}`,
          },
        },
      )

      if (!submitResponse.ok) {
        console.warn(`Form submissions fetch returned status ${submitResponse.statusText}`)
        setSubmittedForms(0)
      } else {
        const submitedData = await submitResponse.json()
        setSubmittedForms(Array.isArray(submitedData) ? submitedData.length : 0)
      }

      const approveResponse = await fetch(
        `https://dovunpjjaiagtcxmayav.supabase.co/rest/v1/form_submissions?select=id&status=eq.approved`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}`,
          },
        },
      )

      if (!approveResponse.ok) {
        console.warn(`Form approvals fetch returned status ${approveResponse.statusText}`)
        setApprovedForms(0)
      } else {
        const approveData = await approveResponse.json()
        setApprovedForms(Array.isArray(approveData) ? approveData.length : 0)
      }
    } catch (error) {
      console.error("Error fetching form stats:", error)
      // Set defaults on error to avoid blocking dashboard
      setSubmittedForms(0)
      setApprovedForms(0)
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
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-white">Analytics Overview</h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors dark:text-white dark:hover:bg-slate-900">
              <span className="material-symbols-outlined">dark_mode</span>
            </button>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Administrator
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-white">
                  {adminProfile?.full_name || "Admin User"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-500/20 dark:shadow-indigo-400/20">
                {adminProfile?.full_name ? adminProfile.full_name.charAt(0) : "A"}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 lg:p-10">
        {/* Title Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Project Analytics Performance
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Monitoring project delivery against standardized performance benchmarks.
          </p>
        </div>

        {/* Metrics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Card 1: Total Users */}
          <div className="bg-slate-950 dark:bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 dark:border-slate-700 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Total Users</span>
                <span className="material-symbols-outlined text-slate-400 text-2xl">groups</span>
              </div>
              <div className="text-4xl font-extrabold mb-1">{users.length.toLocaleString()}</div>
              <p className="text-slate-400 dark:text-slate-500 text-sm mb-4 font-medium">Registered users</p>
              <div className="flex items-center gap-1 text-green-400 dark:text-green-500 text-sm font-bold">
                <span className="material-symbols-outlined text-xs">arrow_upward</span>
                12% <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">vs last month</span>
              </div>
            </div>
          </div>

          {/* Card 2: Active Projects */}
          <div className="bg-cyan-500 dark:bg-cyan-600 p-6 rounded-2xl shadow-xl shadow-cyan-500/30 dark:shadow-cyan-600/30 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <span className="text-white/80 font-semibold text-xs uppercase tracking-wider">Active Projects</span>
                <span className="material-symbols-outlined text-white text-2xl">account_tree</span>
              </div>
              <div className="text-4xl font-extrabold mb-1">{branches.length}</div>
              <p className="text-white/70 dark:text-white/80 text-sm mb-4 font-medium">Current initiatives</p>
              <div className="flex items-center gap-1 text-white dark:text-slate-300 text-sm font-bold">
                <span className="material-symbols-outlined text-xs text-white/90 dark:text-slate-400">
                  arrow_upward
                </span>
                4.1% <span className="font-normal text-white/70 dark:text-slate-400 ml-1">vs last month</span>
              </div>
            </div>
          </div>

          {/* Card 3: Forms Submitted */}
          <div className="bg-slate-950 dark:bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 dark:border-slate-700">
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Forms Submitted</span>
              <span className="material-symbols-outlined text-slate-400 text-2xl">description</span>
            </div>
            <div className="text-4xl font-extrabold mb-1">{submittedForms.toLocaleString()}</div>
            <p className="text-slate-400 dark:text-slate-500 text-sm mb-4 font-medium">By Project Officers</p>
            <div className="flex items-center gap-1 text-red-400 dark:text-red-500 text-sm font-bold">
              <span className="material-symbols-outlined text-xs">arrow_downward</span>
              2.5% <span className="font-normal text-slate-500 dark:text-slate-400 ml-1">vs last month</span>
            </div>
          </div>

          {/* Card 4: Forms Approved */}
          <div className="bg-cyan-500 dark:bg-cyan-600 p-6 rounded-2xl shadow-xl shadow-cyan-500/30 dark:shadow-cyan-600/30 text-white">
            <div className="flex justify-between items-start mb-4">
              <span className="text-white/80 font-semibold text-xs uppercase tracking-wider">Forms Approved</span>
              <span className="material-symbols-outlined text-white text-2xl">verified</span>
            </div>
            <div className="text-4xl font-extrabold mb-1">{approvedForms.toLocaleString()}</div>
            <p className="text-white/70 dark:text-white/80 text-sm mb-4 font-medium">Aggregate Average</p>
            <div className="flex items-center gap-1 text-white dark:text-slate-300 text-sm font-bold">
              <span className="material-symbols-outlined text-xs text-white/90 dark:text-slate-400">arrow_upward</span>
              8.1% <span className="font-normal text-white/70 dark:text-slate-400 ml-1">vs last month</span>
            </div>
          </div>
        </div>

        {/* Filters and Status Legend */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
          <FactorsFilterBar
            selectedProjects={selectedProjects}
            setSelectedProjects={setSelectedProjects}
            selectedBranches={selectedBranches}
            setSelectedBranches={setSelectedBranches}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-8">
          <UsageChart selectedProjects={selectedProjects} selectedBranches={selectedBranches} />
          <AccessTable selectedProjects={selectedProjects} selectedBranches={selectedBranches} />
        </div>
      </main>
    </div>
  )
}

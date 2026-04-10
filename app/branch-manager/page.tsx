"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Shield } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getUserProfileSimple } from "@/lib/admin-actions"
import RoleLayout from "@/components/role-layout"
import UsageChart from "@/components/usage-chart"
import FactorsFilterBar from "@/components/factors-filter-bar"
import AccessTable from "@/components/access-table"
import BarriersChart from "@/components/barriers-chart"
import FINDEXCardEnhanced from "@/components/findex-card-enhanced"
import TotalLoansCardEnhanced from "@/components/total-loans-card-enhanced"
import PageHeader from "@/components/page-header"

export default function BranchManagerDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function checkRoleAndLoadData() {
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

        const profileResult = await getUserProfileSimple(user.id)

        if (!profileResult.success || !profileResult.profile) {
          setError("Failed to load user profile")
          setLoading(false)
          return
        }

        const profile = profileResult.profile

        // Check if user has correct role
        if (profile.role !== "branch_manager") {
          setError(`Access denied. Your role is '${profile.role}', but branch_manager role is required.`)
          setLoading(false)
          return
        }

        if (!profile.branch_id) {
          setError("Your account is not assigned to a branch")
          setLoading(false)
          return
        }

        setUserProfile(profile)
        setLoading(false)
      } catch (error) {
        console.error("Dashboard error:", error)
        setError("Failed to load dashboard")
        setLoading(false)
      }
    }

    checkRoleAndLoadData()
  }, [router])

  if (loading) {
    return (
      <RoleLayout userRole="branch_manager">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
            <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </RoleLayout>
    )
  }

  if (error) {
    return (
      <RoleLayout userRole="branch_manager">
        <div className="flex h-full items-center justify-center">
          <div className="text-center max-w-2xl">
            <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600 text-lg font-semibold">{error}</p>
          </div>
        </div>
      </RoleLayout>
    )
  }

  return (
    <RoleLayout userRole="branch_manager" userName={userProfile?.full_name}>
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-800">
        <PageHeader title="Dashboard" />

        <main className="max-w-[1600px] mx-auto p-6 lg:p-10">
          <div className="mb-10">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Project Analytics Performance
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Monitoring project delivery against standardized performance benchmarks.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
            <FactorsFilterBar
              selectedProjects={selectedProjects}
              setSelectedProjects={setSelectedProjects}
              selectedBranches={selectedBranches}
              setSelectedBranches={setSelectedBranches}
              userRole={userProfile?.role}
              userBranchId={userProfile?.branch_id}
            />
          </div>

          {/* Enhanced Cards with Gradients - Just Below Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <FINDEXCardEnhanced
              selectedProjects={selectedProjects}
              selectedBranches={selectedBranches}
              userRole={userProfile?.role}
              userBranchId={userProfile?.branch_id}
            />
            <TotalLoansCardEnhanced
              selectedProjects={selectedProjects}
              selectedBranches={selectedBranches}
              userRole={userProfile?.role}
              userBranchId={userProfile?.branch_id}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 gap-8">
            <UsageChart selectedProjects={selectedProjects} selectedBranches={selectedBranches} />
            <AccessTable selectedProjects={selectedProjects} selectedBranches={selectedBranches} />
            <BarriersChart selectedProjects={selectedProjects} selectedBranches={selectedBranches} />
          </div>
        </main>
      </div>
    </RoleLayout>
  )
}

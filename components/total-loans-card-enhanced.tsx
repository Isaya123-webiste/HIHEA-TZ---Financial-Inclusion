"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { fetchTotalLoansData } from "@/lib/findex-actions"
import { TrendingUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LoanEntry {
  projectId: string
  projectName: string
  branchId: string
  branchName: string
  totalLoansApproved: number
  formCount: number
}

interface TotalLoansCardEnhancedProps {
  selectedProjects: Set<string>
  selectedBranches: Set<string>
  userRole?: string
  userBranchId?: string
}

function formatTZS(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `TZS ${(amount / 1_000_000_000).toFixed(2)}B`
  }
  if (amount >= 1_000_000) {
    return `TZS ${(amount / 1_000_000).toFixed(2)}M`
  }
  if (amount >= 1_000) {
    return `TZS ${(amount / 1_000).toFixed(1)}K`
  }
  return `TZS ${amount.toLocaleString()}`
}

export default function TotalLoansCardEnhanced({
  selectedProjects,
  selectedBranches,
  userRole,
  userBranchId,
}: TotalLoansCardEnhancedProps) {
  const [entries, setEntries] = useState<LoanEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const isNonAdmin = userRole && userRole !== "admin"

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await fetchTotalLoansData()

        if (!result.success) {
          setError(result.error || "Failed to load total loans data")
          setLoading(false)
          return
        }

        const projectMap = new Map((result.projects || []).map((p: any) => [p.id, p.name]))
        const branchMap = new Map((result.branches || []).map((b: any) => [b.id, b.name]))

        const keyMap = new Map<string, LoanEntry>()

        for (const row of result.branchReports) {
          const key = `${row.project_id}__${row.branch_id}`
          const existing = keyMap.get(key)
          if (existing) {
            existing.totalLoansApproved += Number(row.loan_amount_approved) || 0
            existing.formCount += 1
          } else {
            keyMap.set(key, {
              projectId: row.project_id,
              projectName: projectMap.get(row.project_id) || "Unknown Project",
              branchId: row.branch_id,
              branchName: branchMap.get(row.branch_id) || "Unknown Branch",
              totalLoansApproved: Number(row.loan_amount_approved) || 0,
              formCount: 1,
            })
          }
        }

        setEntries(Array.from(keyMap.values()))
      } catch (err) {
        console.error("Error fetching total loans data:", err)
        setError("Failed to load total loans data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filtered = useMemo(() => {
    const ALL_BRANCHES_ID = "all-branches"
    const ALL_PROJECTS_ID = "all-projects"

    let filtered = entries

    // For non-admin users, auto-filter to their branch
    if (isNonAdmin && userBranchId) {
      filtered = filtered.filter((e) => e.branchId === userBranchId)
    }

    // Apply selected filters
    const showAllBranches = selectedBranches.has(ALL_BRANCHES_ID) || selectedBranches.size === 0
    const showAllProjects = selectedProjects.has(ALL_PROJECTS_ID) || selectedProjects.size === 0

    return filtered.filter((e) => {
      const projectMatch = showAllProjects || selectedProjects.has(e.projectId)
      const branchMatch = showAllBranches || selectedBranches.has(e.branchId)
      return projectMatch && branchMatch
    })
  }, [entries, selectedProjects, selectedBranches, isNonAdmin, userBranchId])

  const grandTotal = useMemo(
    () => filtered.reduce((sum, e) => sum + e.totalLoansApproved, 0),
    [filtered]
  )

  const totalForms = useMemo(
    () => filtered.reduce((sum, e) => sum + e.formCount, 0),
    [filtered]
  )

  if (loading) {
    return (
      <Card className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <CardContent className="p-8 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <CardContent className="p-8 text-center text-red-500">{error}</CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Big Gradient Card */}
      <div
        onClick={() => setShowModal(true)}
        className="cursor-pointer rounded-3xl p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm font-semibold text-emerald-100 mb-2 uppercase tracking-wider">Total Loans</p>
            <h2 className="text-6xl font-black tracking-tight mb-2">{formatTZS(grandTotal)}</h2>
            <p className="text-sm text-emerald-50 font-medium">Total Loans Taken (Approved)</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold">Live</span>
          </div>
        </div>

        {/* Sub-metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-100 mb-1">Approved Forms</p>
            <p className="text-2xl font-bold">{totalForms}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-100 mb-1">Average Loan</p>
            <p className="text-2xl font-bold">{formatTZS(totalForms > 0 ? grandTotal / totalForms : 0)}</p>
          </div>
        </div>

        <p className="text-xs text-emerald-100 mt-4">Click to view detailed breakdown</p>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto rounded-2xl">
            <CardContent className="p-0">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Total Loans Breakdown</h2>
                  <p className="text-sm text-emerald-50">Detailed analysis by project and branch</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6">
                {filtered.length === 0 ? (
                  <p className="text-center text-slate-400 py-6">
                    No loan data available for the selected filters.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Column headers */}
                    <div className="grid grid-cols-4 gap-3 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700 pb-3">
                      <span className="col-span-2">Project / Branch</span>
                      <span className="text-center">Reports</span>
                      <span className="text-right">Loans Approved</span>
                    </div>

                    {/* Data rows */}
                    {filtered.map((e, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-4 gap-3 items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-lg px-2 transition-colors"
                      >
                        <div className="col-span-2">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {e.projectName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{e.branchName}</p>
                        </div>
                        <span className="text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {e.formCount}
                        </span>
                        <span className="text-right text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                          {formatTZS(e.totalLoansApproved)}
                        </span>
                      </div>
                    ))}

                    {/* Summary row */}
                    {filtered.length > 1 && (
                      <div className="grid grid-cols-4 gap-3 items-center pt-4 mt-4 border-t-2 border-slate-300 dark:border-slate-600 font-bold text-slate-900 dark:text-white">
                        <div className="col-span-2">Grand Total</div>
                        <span className="text-center">{totalForms}</span>
                        <span className="text-right bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                          {formatTZS(grandTotal)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { fetchFINDEXData } from "@/lib/findex-actions"
import { TrendingUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FINDEXEntry {
  projectId: string
  projectName: string
  branchId: string
  branchName: string
  usageValue: number
  accessValue: number
  barriersValue: number
  findex: number
}

interface FINDEXCardEnhancedProps {
  selectedProjects: Set<string>
  selectedBranches: Set<string>
  userRole?: string
  userBranchId?: string
}

export default function FINDEXCardEnhanced({
  selectedProjects,
  selectedBranches,
  userRole,
  userBranchId,
}: FINDEXCardEnhancedProps) {
  const [entries, setEntries] = useState<FINDEXEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const isNonAdmin = userRole && userRole !== "admin"

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await fetchFINDEXData()

        if (!result.success) {
          setError(result.error || "Failed to load FINDEX data")
          setLoading(false)
          return
        }

        const projectMap = new Map((result.projects || []).map((p: any) => [p.id, p.name]))
        const branchMap = new Map((result.branches || []).map((b: any) => [b.id, b.name]))

        const keyMap = new Map<string, Partial<FINDEXEntry>>()

        for (const row of result.usageData) {
          const key = `${row["Project ID"]}__${row["Branch ID"]}`
          const existing = keyMap.get(key) || {
            projectId: row["Project ID"],
            projectName: projectMap.get(row["Project ID"]) || "Unknown Project",
            branchId: row["Branch ID"],
            branchName: branchMap.get(row["Branch ID"]) || "Unknown Branch",
          }
          existing.usageValue = (row["USAGE_Value"] || 0) * 100
          keyMap.set(key, existing)
        }

        for (const row of result.accessData) {
          const key = `${row["Project ID"]}__${row["Branch ID"]}`
          const existing = keyMap.get(key) || {
            projectId: row["Project ID"],
            projectName: projectMap.get(row["Project ID"]) || "Unknown Project",
            branchId: row["Branch ID"],
            branchName: branchMap.get(row["Branch ID"]) || "Unknown Branch",
          }
          existing.accessValue = (row["ACCESS_Value"] || 0) * 100
          keyMap.set(key, existing)
        }

        for (const row of result.barriersData) {
          const key = `${row["Project ID"]}__${row["Branch ID"]}`
          const existing = keyMap.get(key) || {
            projectId: row["Project ID"],
            projectName: projectMap.get(row["Project ID"]) || "Unknown Project",
            branchId: row["Branch ID"],
            branchName: branchMap.get(row["Branch ID"]) || "Unknown Branch",
          }
          existing.barriersValue = (row["BARRIERS_Value"] || 0) * 100
          keyMap.set(key, existing)
        }

        const enriched: FINDEXEntry[] = Array.from(keyMap.values()).map((e) => {
          const usage = e.usageValue || 0
          const access = e.accessValue || 0
          const barriers = e.barriersValue || 0
          const findex = (usage + access + barriers) / 3
          return { ...e, usageValue: usage, accessValue: access, barriersValue: barriers, findex } as FINDEXEntry
        })

        setEntries(enriched)
      } catch (err) {
        console.error("Error fetching FINDEX data:", err)
        setError("Failed to load FINDEX data")
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

  const overallFINDEX = useMemo(() => {
    if (filtered.length === 0) return 0
    const total = filtered.reduce((sum, e) => sum + e.findex, 0)
    return total / filtered.length
  }, [filtered])

  const usageAvg = useMemo(
    () => (filtered.length === 0 ? 0 : filtered.reduce((s, e) => s + e.usageValue, 0) / filtered.length),
    [filtered]
  )

  const accessAvg = useMemo(
    () => (filtered.length === 0 ? 0 : filtered.reduce((s, e) => s + e.accessValue, 0) / filtered.length),
    [filtered]
  )

  const barriersAvg = useMemo(
    () => (filtered.length === 0 ? 0 : filtered.reduce((s, e) => s + e.barriersValue, 0) / filtered.length),
    [filtered]
  )

  if (loading) {
    return (
      <Card className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <CardContent className="p-8 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
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
        className="cursor-pointer rounded-3xl p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 text-white"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm font-semibold text-cyan-100 mb-2 uppercase tracking-wider">FINDEX</p>
            <h2 className="text-6xl font-black tracking-tight mb-2">{overallFINDEX.toFixed(1)}%</h2>
            <p className="text-sm text-cyan-50 font-medium">Financial Inclusion Index</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold">Live</span>
          </div>
        </div>

        {/* Sub-metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-xs font-semibold text-cyan-100 mb-1">Usage</p>
            <p className="text-2xl font-bold">{usageAvg.toFixed(1)}%</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-xs font-semibold text-cyan-100 mb-1">Access</p>
            <p className="text-2xl font-bold">{accessAvg.toFixed(1)}%</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <p className="text-xs font-semibold text-cyan-100 mb-1">Barriers</p>
            <p className="text-2xl font-bold">{barriersAvg.toFixed(1)}%</p>
          </div>
        </div>

        <p className="text-xs text-cyan-100 mt-4">Click to view detailed breakdown</p>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto rounded-2xl">
            <CardContent className="p-0">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">FINDEX Breakdown</h2>
                  <p className="text-sm text-cyan-50">Detailed analysis by project and branch</p>
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
                    No data available for the selected filters.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Column headers */}
                    <div className="grid grid-cols-6 gap-3 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b-2 border-slate-200 dark:border-slate-700 pb-3">
                      <span className="col-span-2">Project / Branch</span>
                      <span className="text-center">Usage</span>
                      <span className="text-center">Access</span>
                      <span className="text-center">Barriers</span>
                      <span className="text-center">FINDEX</span>
                    </div>

                    {/* Data rows */}
                    {filtered.map((e, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-6 gap-3 items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-lg px-2 transition-colors"
                      >
                        <div className="col-span-2">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {e.projectName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{e.branchName}</p>
                        </div>
                        <span className="text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {e.usageValue.toFixed(1)}%
                        </span>
                        <span className="text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {e.accessValue.toFixed(1)}%
                        </span>
                        <span className="text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {e.barriersValue.toFixed(1)}%
                        </span>
                        <span className="text-center text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                          {e.findex.toFixed(1)}%
                        </span>
                      </div>
                    ))}

                    {/* Summary row */}
                    {filtered.length > 1 && (
                      <div className="grid grid-cols-6 gap-3 items-center pt-4 mt-4 border-t-2 border-slate-300 dark:border-slate-600 font-bold text-slate-900 dark:text-white">
                        <div className="col-span-2">Overall Average</div>
                        <span className="text-center">{usageAvg.toFixed(1)}%</span>
                        <span className="text-center">{accessAvg.toFixed(1)}%</span>
                        <span className="text-center">{barriersAvg.toFixed(1)}%</span>
                        <span className="text-center bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                          {overallFINDEX.toFixed(1)}%
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

"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchFINDEXData } from "@/lib/findex-actions"
import { TrendingUp } from "lucide-react"

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

interface FINDEXCardProps {
  selectedProjects: Set<string>
  selectedBranches: Set<string>
}

export default function FINDEXCard({ selectedProjects, selectedBranches }: FINDEXCardProps) {
  const [entries, setEntries] = useState<FINDEXEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

        // Build per-project+branch FINDEX by joining Usage, Access, Barriers on Project ID + Branch ID
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
    return entries.filter((e) => {
      const projectMatch = selectedProjects.size === 0 || selectedProjects.has(e.projectId)
      const branchMatch = selectedBranches.size === 0 || selectedBranches.has(e.branchId)
      return projectMatch && branchMatch
    })
  }, [entries, selectedProjects, selectedBranches])

  const overallFINDEX = useMemo(() => {
    if (filtered.length === 0) return 0
    const total = filtered.reduce((sum, e) => sum + e.findex, 0)
    return total / filtered.length
  }, [filtered])

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
    <Card className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
              {overallFINDEX.toFixed(1)}%
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">FINDEX (Financial Inclusion Index)</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Average of Usage + Access + Barriers
            </p>
          </div>
          <div className="flex items-center gap-1 text-green-500 text-sm font-semibold">
            <TrendingUp className="w-4 h-4" />
            Live
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-400 dark:text-slate-500 py-6">
            No data available for the selected filters.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Column headers */}
            <div className="grid grid-cols-6 gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="col-span-2">Project / Branch</span>
              <span className="text-center">Usage</span>
              <span className="text-center">Access</span>
              <span className="text-center">Barriers</span>
              <span className="text-center">FINDEX</span>
            </div>

            {filtered.map((e, i) => (
              <div
                key={i}
                className="grid grid-cols-6 gap-3 items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0"
              >
                <div className="col-span-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{e.projectName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{e.branchName}</p>
                </div>
                <span className="text-center text-sm text-slate-700 dark:text-slate-300">
                  {e.usageValue.toFixed(1)}%
                </span>
                <span className="text-center text-sm text-slate-700 dark:text-slate-300">
                  {e.accessValue.toFixed(1)}%
                </span>
                <span className="text-center text-sm text-slate-700 dark:text-slate-300">
                  {e.barriersValue.toFixed(1)}%
                </span>
                <span className="text-center text-sm font-bold text-cyan-600 dark:text-cyan-400">
                  {e.findex.toFixed(1)}%
                </span>
              </div>
            ))}

            {/* Overall average row */}
            {filtered.length > 1 && (
              <div className="grid grid-cols-6 gap-3 items-center pt-3 mt-1 border-t-2 border-slate-200 dark:border-slate-700">
                <div className="col-span-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Overall Average</p>
                </div>
                <span className="text-center text-sm font-bold text-slate-700 dark:text-slate-300">
                  {(filtered.reduce((s, e) => s + e.usageValue, 0) / filtered.length).toFixed(1)}%
                </span>
                <span className="text-center text-sm font-bold text-slate-700 dark:text-slate-300">
                  {(filtered.reduce((s, e) => s + e.accessValue, 0) / filtered.length).toFixed(1)}%
                </span>
                <span className="text-center text-sm font-bold text-slate-700 dark:text-slate-300">
                  {(filtered.reduce((s, e) => s + e.barriersValue, 0) / filtered.length).toFixed(1)}%
                </span>
                <span className="text-center text-sm font-extrabold text-cyan-600 dark:text-cyan-400">
                  {overallFINDEX.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

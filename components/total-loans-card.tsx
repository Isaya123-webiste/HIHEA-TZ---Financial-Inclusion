"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchTotalLoansData } from "@/lib/findex-actions"
import { TrendingUp } from "lucide-react"

interface LoanEntry {
  projectId: string
  projectName: string
  branchId: string
  branchName: string
  totalLoansApproved: number
  formCount: number
}

interface TotalLoansCardProps {
  selectedProjects: Set<string>
  selectedBranches: Set<string>
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

export default function TotalLoansCard({ selectedProjects, selectedBranches }: TotalLoansCardProps) {
  const [entries, setEntries] = useState<LoanEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

        // Group by project + branch
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
    return entries.filter((e) => {
      const projectMatch = selectedProjects.size === 0 || selectedProjects.has(e.projectId)
      const branchMatch = selectedBranches.size === 0 || selectedBranches.has(e.branchId)
      return projectMatch && branchMatch
    })
  }, [entries, selectedProjects, selectedBranches])

  const grandTotal = useMemo(
    () => filtered.reduce((sum, e) => sum + e.totalLoansApproved, 0),
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
    <Card className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatTZS(grandTotal)}
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total Loans Taken (Approved)</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Aggregated from branch reports
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
            No loan data available for the selected filters.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Column headers */}
            <div className="grid grid-cols-4 gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="col-span-2">Project / Branch</span>
              <span className="text-center">Reports</span>
              <span className="text-right">Loans Approved</span>
            </div>

            {filtered.map((e, i) => (
              <div
                key={i}
                className="grid grid-cols-4 gap-3 items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0"
              >
                <div className="col-span-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{e.projectName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{e.branchName}</p>
                </div>
                <span className="text-center text-sm text-slate-600 dark:text-slate-400">{e.formCount}</span>
                <span className="text-right text-sm font-bold text-cyan-600 dark:text-cyan-400">
                  {formatTZS(e.totalLoansApproved)}
                </span>
              </div>
            ))}

            {/* Grand total row */}
            {filtered.length > 1 && (
              <div className="grid grid-cols-4 gap-3 items-center pt-3 mt-1 border-t-2 border-slate-200 dark:border-slate-700">
                <div className="col-span-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Grand Total</p>
                </div>
                <span className="text-center text-sm font-bold text-slate-700 dark:text-slate-300">
                  {filtered.reduce((s, e) => s + e.formCount, 0)}
                </span>
                <span className="text-right text-sm font-extrabold text-cyan-600 dark:text-cyan-400">
                  {formatTZS(grandTotal)}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

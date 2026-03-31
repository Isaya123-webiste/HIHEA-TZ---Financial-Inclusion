"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

interface FINDEXData {
  id: string
  projectId: string
  projectName: string
  branchId: string
  branchName: string
  usageActualData: number
  accessActualData: number
  barriersActualData: number
  findexValue: number
}

interface FINDEXCardProps {
  selectedProjects: Set<string>
  selectedBranches: Set<string>
  financialInstitution?: string
}

export default function FINDEXCard({
  selectedProjects,
  selectedBranches,
  financialInstitution,
}: FINDEXCardProps) {
  const [findexData, setFindexData] = useState<FINDEXData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (financialInstitution) {
          params.append("institution", financialInstitution)
        }

        const response = await fetch(`/api/findex?${params.toString()}`)
        if (!response.ok) {
          throw new Error("Failed to fetch FINDEX data")
        }

        const result = await response.json()
        if (result.success) {
          setFindexData(result.data || [])
        } else {
          setError(result.error || "Failed to load FINDEX data")
        }
      } catch (err) {
        console.error("Error fetching FINDEX data:", err)
        setError("Failed to load FINDEX data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [financialInstitution])

  const avgFINDEXValue = useMemo(() => {
    const ALL_BRANCHES_ID = "all-branches"
    const ALL_PROJECTS_ID = "all-projects"

    const showAllBranches = selectedBranches.has(ALL_BRANCHES_ID)
    const showAllProjects = selectedProjects.has(ALL_PROJECTS_ID)

    const filtered = findexData.filter((item) => {
      const branchMatch = showAllBranches || selectedBranches.has(item.branchId)
      const projectMatch = showAllProjects || selectedProjects.has(item.projectId)
      return branchMatch && projectMatch
    })

    if (filtered.length === 0) return 0

    const sum = filtered.reduce((acc, item) => acc + item.findexValue, 0)
    return ((sum / filtered.length) * 100).toFixed(2)
  }, [findexData, selectedBranches, selectedProjects])

  if (loading) {
    return (
      <Card className="border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="bg-white dark:bg-slate-900 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">--%</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Financial Inclusion Index</p>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">FINDEX</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 bg-white dark:bg-slate-900">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
            <p className="mt-2 text-blue-600 dark:text-blue-400 font-semibold text-sm">Loading FINDEX...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="bg-white dark:bg-slate-900 pb-4 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">FINDEX</CardTitle>
        </CardHeader>
        <CardContent className="bg-white dark:bg-slate-900">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded p-3 text-red-700 dark:text-red-400 text-sm font-semibold">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
      <CardHeader className="bg-white dark:bg-slate-900 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">{avgFINDEXValue}%</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Financial Inclusion Index</p>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">FINDEX</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 bg-white dark:bg-slate-900">
        <div className="text-center py-8">
          <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm">
            FINDEX = Usage + Access + Barriers
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-2">
            {findexData.length > 0
              ? `Based on ${findexData.length} data point(s)`
              : "No data available for selected filters"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

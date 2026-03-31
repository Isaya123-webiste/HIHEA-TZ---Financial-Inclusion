"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign } from "lucide-react"

interface LoanData {
  id: string
  projectId: string
  projectName: string
  branchId: string
  branchName: string
  loanAmountApproved: number
  dateLoanReceived: string
}

interface TotalLoansCardProps {
  selectedProjects: Set<string>
  selectedBranches: Set<string>
  financialInstitution?: string
}

export default function TotalLoansCard({
  selectedProjects,
  selectedBranches,
  financialInstitution,
}: TotalLoansCardProps) {
  const [loansData, setLoansData] = useState<LoanData[]>([])
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

        const response = await fetch(`/api/total-loans?${params.toString()}`)
        if (!response.ok) {
          throw new Error("Failed to fetch loans data")
        }

        const result = await response.json()
        if (result.success) {
          setLoansData(result.data || [])
        } else {
          setError(result.error || "Failed to load loans data")
        }
      } catch (err) {
        console.error("Error fetching loans data:", err)
        setError("Failed to load loans data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [financialInstitution])

  const totalLoanAmount = useMemo(() => {
    const ALL_BRANCHES_ID = "all-branches"
    const ALL_PROJECTS_ID = "all-projects"

    const showAllBranches = selectedBranches.has(ALL_BRANCHES_ID)
    const showAllProjects = selectedProjects.has(ALL_PROJECTS_ID)

    const filtered = loansData.filter((item) => {
      const branchMatch = showAllBranches || selectedBranches.has(item.branchId)
      const projectMatch = showAllProjects || selectedProjects.has(item.projectId)
      return branchMatch && projectMatch
    })

    if (filtered.length === 0) return 0

    return filtered.reduce((sum, item) => sum + (item.loanAmountApproved || 0), 0)
  }, [loansData, selectedBranches, selectedProjects])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount)
  }

  if (loading) {
    return (
      <Card className="border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="bg-white dark:bg-slate-900 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">--</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total Loans Taken</p>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Loans</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 bg-white dark:bg-slate-900">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent mx-auto"></div>
            <p className="mt-2 text-green-600 dark:text-green-400 font-semibold text-sm">Loading loans data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="bg-white dark:bg-slate-900 pb-4 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Total Loans</CardTitle>
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
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalLoanAmount)}
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total Loans Taken</p>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Loans</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 bg-white dark:bg-slate-900">
        <div className="text-center py-8">
          <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm">
            Approved loan amounts across selected filters
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-2">
            {loansData.length > 0
              ? `${loansData.filter((item) => {
                  const ALL_BRANCHES_ID = "all-branches"
                  const ALL_PROJECTS_ID = "all-projects"
                  const showAllBranches = selectedBranches.has(ALL_BRANCHES_ID)
                  const showAllProjects = selectedProjects.has(ALL_PROJECTS_ID)
                  const branchMatch = showAllBranches || selectedBranches.has(item.branchId)
                  const projectMatch = showAllProjects || selectedProjects.has(item.projectId)
                  return branchMatch && projectMatch
                }).length} loan(s) tracked`
              : "No loans data available"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

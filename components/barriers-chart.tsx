"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { fetchBarriersChartData } from "@/lib/barriers-display-actions"

interface BarriersData {
  id: string
  projectId: string
  projectName: string
  branchId: string
  branchName: string
  incomeLevel: number
  distance: number
  trust: number
  costs: number
  registration: number
  socialCultural: number
  financialLiteracy: number
  barriersValue: number
}

interface ChartDataPoint {
  category: string
  [key: string]: any
}

interface BarriersChartProps {
  selectedProjects: Set<string>
  selectedBranches: Set<string>
}

const PROJECT_COLORS = ["#8B5CF6", "#06B6D4", "#4338CA"]

export default function BarriersChart({ selectedProjects, selectedBranches }: BarriersChartProps) {
  const [barriersData, setBarriersData] = useState<BarriersData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredBar, setHoveredBar] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await fetchBarriersChartData()

        if (!result.success) {
          setError(result.error || "Failed to load barriers data")
          setLoading(false)
          return
        }

        const projectMap = new Map(result.projects.map((p: any) => [p.id, p.name]) || [])
        const branchMap = new Map(result.branches.map((b: any) => [b.id, b.name]) || [])

        const enrichedData: BarriersData[] = (result.barriersData || []).map((row: any) => ({
          id: row.id,
          projectId: row["Project ID"],
          projectName: projectMap.get(row["Project ID"]) || "Unknown Project",
          branchId: row["Branch ID"],
          branchName: branchMap.get(row["Branch ID"]) || "Unknown Branch",
          incomeLevel: (row["SUB FACTOR: INCOME LEVEL_Value"] || 0) * 100,
          distance: (row["SUB FACTOR: DISTANCE_Value"] || 0) * 100,
          trust: (row["SUB FACTOR: TRUST_Value"] || 0) * 100,
          costs: (row["SUB FACTOR: COSTS_Value"] || 0) * 100,
          registration: (row["SUB FACTOR: REGISTRATION_Value"] || 0) * 100,
          socialCultural: (row["SUB FACTOR: SOCIAL AND CULTURAL FACTORS_Value"] || 0) * 100,
          financialLiteracy: (row["SUB FACTOR: FINANCIAL LITERACY_Value"] || 0) * 100,
          barriersValue: (row["BARRIERS_Value"] || 0) * 100,
        }))

        setBarriersData(enrichedData)
      } catch (err) {
        console.error("Error fetching barriers data:", err)
        setError("Failed to load barriers data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const chartData: ChartDataPoint[] = useMemo(() => {
    const ALL_BRANCHES_ID = "all-branches"
    const ALL_PROJECTS_ID = "all-projects"

    const showAllBranches = selectedBranches.has(ALL_BRANCHES_ID)
    const showAllProjects = selectedProjects.has(ALL_PROJECTS_ID)

    const filtered = barriersData.filter((item) => {
      const branchMatch = showAllBranches || selectedBranches.has(item.branchId)
      const projectMatch = showAllProjects || selectedProjects.has(item.projectId)
      return branchMatch && projectMatch
    })

    if (filtered.length === 0) return []

    const categories = [
      { label: "INCOME LEVEL", key: "incomeLevel" },
      { label: "DISTANCE", key: "distance" },
      { label: "TRUST", key: "trust" },
      { label: "COSTS", key: "costs" },
      { label: "REGISTRATION", key: "registration" },
      { label: "SOCIAL & CULTURAL", key: "socialCultural" },
      { label: "FINANCIAL LITERACY", key: "financialLiteracy" },
    ]
    
    return categories.map((cat) => {
      const dataPoint: ChartDataPoint = { category: cat.label }

      const uniqueProjects = [...new Set(filtered.map((d) => d.projectId))]
      uniqueProjects.forEach((projectId) => {
        const projectData = filtered.filter((d) => d.projectId === projectId)
        const projectName = projectData[0].projectName

        const values = projectData.map((d) => {
          return d[cat.key as keyof BarriersData] as number
        })
        const avgValue = values.reduce((a, b) => a + b, 0) / values.length
        dataPoint[`${projectName}-${projectId}`] = Math.min(avgValue, 100)
      })

      return dataPoint
    })
  }, [barriersData, selectedBranches, selectedProjects])

  const avgBarriersValue = useMemo(() => {
    const ALL_BRANCHES_ID = "all-branches"
    const ALL_PROJECTS_ID = "all-projects"

    const showAllBranches = selectedBranches.has(ALL_BRANCHES_ID)
    const showAllProjects = selectedProjects.has(ALL_PROJECTS_ID)

    const filtered = barriersData.filter((item) => {
      const branchMatch = showAllBranches || selectedBranches.has(item.branchId)
      const projectMatch = showAllProjects || selectedProjects.has(item.projectId)
      return branchMatch && projectMatch
    })

    if (filtered.length === 0) return 0
    const sum = filtered.reduce((acc, item) => acc + item.barriersValue, 0)
    return (sum / filtered.length).toFixed(2)
  }, [barriersData, selectedBranches, selectedProjects])

  const uniqueProjects = useMemo(() => {
    const ALL_BRANCHES_ID = "all-branches"
    const ALL_PROJECTS_ID = "all-projects"

    const showAllBranches = selectedBranches.has(ALL_BRANCHES_ID)
    const showAllProjects = selectedProjects.has(ALL_PROJECTS_ID)

    const filtered = barriersData.filter((item) => {
      const branchMatch = showAllBranches || selectedBranches.has(item.branchId)
      const projectMatch = showAllProjects || selectedProjects.has(item.projectId)
      return branchMatch && projectMatch
    })

    return [...new Set(filtered.map((d) => d.projectId))]
  }, [barriersData, selectedBranches, selectedProjects])

  if (loading) {
    return (
      <Card className="border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="bg-white dark:bg-slate-900 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">{avgBarriersValue}%</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Average Sub Factor Score</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Barriers</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 bg-white dark:bg-slate-900">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent mx-auto"></div>
            <p className="mt-2 text-rose-600 dark:text-rose-400 font-semibold text-sm">Loading barriers data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="bg-white dark:bg-slate-900 pb-4 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Barriers</CardTitle>
        </CardHeader>
        <CardContent className="bg-white dark:bg-slate-900">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded p-3 text-red-700 dark:text-red-400 text-sm font-semibold">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
      <CardHeader className="bg-white dark:bg-slate-900 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">{avgBarriersValue}%</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Average Sub Factor Score</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Barriers Sub Factors</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 bg-white dark:bg-slate-900">
        {chartData.length > 0 ? (
          <div className="w-full h-96 overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 60, left: 50, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: "#d1d5db" }}
                  height={40}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={{ stroke: "#d1d5db" }}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 12px",
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length > 0) {
                      const hoveredPayload = payload.find((entry) => {
                        const dataKey = entry.dataKey?.toString() || ""
                        return dataKey === hoveredBar
                      }) || payload[0]
                      
                      const projectName = hoveredPayload.dataKey?.toString().split("-")[0] || "Unknown"
                      return (
                        <div className="bg-slate-900 text-white px-3 py-2 rounded text-xs">
                          <p className="text-white font-semibold">{projectName}</p>
                        </div>
                      )
                    }
                    return null
                  }}
                  cursor={false}
                />
                {uniqueProjects.map((projectId, projectIndex) => {
                  const projectData = barriersData.find((d) => d.projectId === projectId)
                  const projectName = projectData?.projectName || "Unknown"
                  const barKey = `${projectName}-${projectId}`
                  const isHovered = hoveredBar === barKey
                  const shouldFade = hoveredBar !== null && !isHovered

                  return (
                    <Bar
                      key={barKey}
                      dataKey={barKey}
                      fill={PROJECT_COLORS[projectIndex % PROJECT_COLORS.length]}
                      radius={[4, 4, 0, 0]}
                      label={{
                        position: "top",
                        fill: "#6b7280",
                        fontSize: 11,
                        fontWeight: 600,
                        offset: 5,
                        formatter: (value: number) => `${(value || 0).toFixed(1)}%`,
                      }}
                      onMouseEnter={() => setHoveredBar(barKey)}
                      onMouseLeave={() => setHoveredBar(null)}
                      opacity={shouldFade ? 0.2 : 1}
                      style={{
                        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        filter: isHovered ? `drop-shadow(0 0 12px ${PROJECT_COLORS[projectIndex % PROJECT_COLORS.length]}80)` : "none",
                        transformOrigin: "bottom center",
                      }}
                    />
                  )
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm">No barriers data available</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Try adjusting your filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

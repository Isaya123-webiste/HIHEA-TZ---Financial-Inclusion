"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { fetchAccessChartData } from "@/lib/access-display-actions"

interface AccessData {
  id: string
  projectId: string
  projectName: string
  branchId: string
  branchName: string
  bankBranches: number
  agents: number
  atmsOnlineServices: number
  insurersAgents: number
  accessActualData: number
}

interface ChartDataPoint {
  category: string
  [key: string]: any
}

interface AccessTableProps {
  selectedProjects: Set<string>
  selectedBranches: Set<string>
}

const PROJECT_COLORS = ["#8B5CF6", "#06B6D4", "#4338CA"]

export default function AccessTable({ selectedProjects, selectedBranches }: AccessTableProps) {
  const [accessData, setAccessData] = useState<AccessData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredBar, setHoveredBar] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await fetchAccessChartData()

        if (!result.success) {
          setError(result.error || "Failed to load access data")
          setLoading(false)
          return
        }

        const projectMap = new Map(result.projects.map((p: any) => [p.id, p.name]) || [])
        const branchMap = new Map(result.branches.map((b: any) => [b.id, b.name]) || [])

        const enrichedData: AccessData[] = (result.accessData || []).map((row: any) => ({
          id: row.id,
          projectId: row["Project ID"],
          projectName: projectMap.get(row["Project ID"]) || "Unknown Project",
          branchId: row["Branch ID"],
          branchName: branchMap.get(row["Branch ID"]) || "Unknown Branch",
          bankBranches: (row["SUB-FACTOR: BANK BRANCHES_Value"] || 0) * 100,
          agents: (row["SUB-FACTOR: AGENTS_Value"] || 0) * 100,
          atmsOnlineServices: (row["SUB-FACTOR: ATMs AND ONLINE SERVICES_Value"] || 0) * 100,
          insurersAgents: (row["SUB-FACTOR: INSURERS AND AGENTS_Value"] || 0) * 100,
          accessActualData: (row["Access_Actual_Data"] || 0) * 100,
        }))

        setAccessData(enrichedData)
      } catch (err) {
        console.error("Error fetching access data:", err)
        setError("Failed to load access data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const chartData: ChartDataPoint[] = useMemo(() => {
    // Special IDs for "All" options
    const ALL_BRANCHES_ID = "all-branches"
    const ALL_PROJECTS_ID = "all-projects"

    const showAllBranches = selectedBranches.has(ALL_BRANCHES_ID)
    const showAllProjects = selectedProjects.has(ALL_PROJECTS_ID)

    const filtered = accessData.filter((item) => {
      const branchMatch = showAllBranches || selectedBranches.has(item.branchId)
      const projectMatch = showAllProjects || selectedProjects.has(item.projectId)
      return branchMatch && projectMatch
    })

    if (filtered.length === 0) return []

    const categories = ["BANK BRANCHES", "AGENTS", "ATMs & ONLINE SERVICES", "INSURERS & AGENTS"]
    return categories.map((category) => {
      const dataPoint: ChartDataPoint = { category }

      const uniqueProjects = [...new Set(filtered.map((d) => d.projectId))]
      uniqueProjects.forEach((projectId, projectIndex) => {
        const projectData = filtered.filter((d) => d.projectId === projectId)
        const projectName = projectData[0].projectName

        const values = projectData.map((d) => {
          switch (category) {
            case "BANK BRANCHES":
              return d.bankBranches
            case "AGENTS":
              return d.agents
            case "ATMs & ONLINE SERVICES":
              return d.atmsOnlineServices
            case "INSURERS & AGENTS":
              return d.insurersAgents
            default:
              return 0
          }
        })
        const avgValue = values.reduce((a, b) => a + b, 0) / values.length
        dataPoint[`${projectName}-${projectId}`] = Math.min(avgValue, 100)
      })

      return dataPoint
    })
  }, [accessData, selectedBranches, selectedProjects])

  const avgAccessActualData = useMemo(() => {
    // Special IDs for "All" options
    const ALL_BRANCHES_ID = "all-branches"
    const ALL_PROJECTS_ID = "all-projects"

    const showAllBranches = selectedBranches.has(ALL_BRANCHES_ID)
    const showAllProjects = selectedProjects.has(ALL_PROJECTS_ID)

    const filtered = accessData.filter((item) => {
      const branchMatch = showAllBranches || selectedBranches.has(item.branchId)
      const projectMatch = showAllProjects || selectedProjects.has(item.projectId)
      return branchMatch && projectMatch
    })

    if (filtered.length === 0) return 0
    const sum = filtered.reduce((acc, item) => acc + item.accessActualData, 0)
    return (sum / filtered.length).toFixed(2)
  }, [accessData, selectedBranches, selectedProjects])

  const uniqueProjects = useMemo(() => {
    // Special IDs for "All" options
    const ALL_BRANCHES_ID = "all-branches"
    const ALL_PROJECTS_ID = "all-projects"

    const showAllBranches = selectedBranches.has(ALL_BRANCHES_ID)
    const showAllProjects = selectedProjects.has(ALL_PROJECTS_ID)

    const filtered = accessData.filter((item) => {
      const branchMatch = showAllBranches || selectedBranches.has(item.branchId)
      const projectMatch = showAllProjects || selectedProjects.has(item.projectId)
      return branchMatch && projectMatch
    })

    return [...new Set(filtered.map((d) => d.projectId))]
  }, [accessData, selectedBranches, selectedProjects])

  if (loading) {
    return (
      <Card className="border border-[#D1D5DB] shadow-sm overflow-hidden">
        <CardHeader className="bg-white pb-4 border-b border-[#D1D5DB]">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900">{avgAccessActualData}%</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Access</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-500"></div>
              <span className="text-xs font-semibold text-gray-700">Access</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 bg-white">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent mx-auto"></div>
            <p className="mt-2 text-teal-600 font-semibold text-sm">Loading access data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border border-[#D1D5DB] shadow-sm overflow-hidden">
        <CardHeader className="bg-white pb-4 border-b border-[#D1D5DB]">
          <CardTitle className="text-xl font-bold text-gray-900">Access</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="bg-red-50 border border-red-300 rounded p-3 text-red-700 text-sm font-semibold">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-[#D1D5DB] shadow-sm overflow-hidden">
      <CardHeader className="bg-white pb-4 border-b border-[#D1D5DB]">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-3xl font-bold text-gray-900">{avgAccessActualData}%</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Access</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-500"></div>
            <span className="text-xs font-semibold text-gray-700">Access</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 bg-white">
        {chartData.length > 0 ? (
          <div className="w-full h-96 overflow-x-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 60, left: 50, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fill: "#374151", fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: "#D1D5DB" }}
                  height={40}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  tick={{ fill: "#6B7280", fontSize: 11 }}
                  axisLine={{ stroke: "#D1D5DB" }}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000000",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 12px",
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length > 0) {
                      // Find the bar that matches the hovered bar state
                      const hoveredPayload = payload.find((entry) => {
                        const dataKey = entry.dataKey?.toString() || ""
                        return dataKey === hoveredBar
                      }) || payload[0]
                      
                      const projectName = hoveredPayload.dataKey?.toString().split("-")[0] || "Unknown"
                      return (
                        <div className="bg-black text-white px-3 py-2 rounded text-xs">
                          <p className="text-white font-semibold">{projectName}</p>
                        </div>
                      )
                    }
                    return null
                  }}
                  cursor={false}
                />
                {uniqueProjects.map((projectId, projectIndex) => {
                  const projectData = accessData.find((d) => d.projectId === projectId)
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
                        fill: "#374151",
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
            <p className="text-gray-700 font-semibold text-sm">No access data available</p>
            <p className="text-gray-500 text-xs mt-1">Try adjusting your filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

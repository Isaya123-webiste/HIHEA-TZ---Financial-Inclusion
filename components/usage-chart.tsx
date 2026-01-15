"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Badge } from "@/components/ui/badge"
import { fetchUsageChartData } from "@/lib/usage-display-actions"

interface UsageData {
  id: string
  projectId: string
  projectName: string
  branchId: string
  branchName: string
  insurance: number
  account: number
  savings: number
  borrowings: number
  usageActualData: number
}

interface ChartDataPoint {
  category: string
  [key: string]: any
}

interface UsageChartProps {
  selectedProjects: Set<string>
  selectedBranches: Set<string>
}

interface TooltipPayload {
  name?: string
  value?: number
}

export default function UsageChart({ selectedProjects, selectedBranches }: UsageChartProps) {
  const [usageData, setUsageData] = useState<UsageData[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredBar, setHoveredBar] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await fetchUsageChartData()

        if (!result.success) {
          setError(result.error || "Failed to load usage data")
          setLoading(false)
          return
        }

        const projectMap = new Map(result.projects.map((p: any) => [p.id, p.name]) || [])
        const branchMap = new Map(result.branches.map((b: any) => [b.id, b.name]) || [])

        const enrichedData: UsageData[] = (result.usageData || []).map((row: any) => ({
          id: row.id,
          projectId: row["Project ID"],
          projectName: projectMap.get(row["Project ID"]) || "Unknown Project",
          branchId: row["Branch ID"],
          branchName: branchMap.get(row["Branch ID"]) || "Unknown Branch",
          insurance: (row["SUB-FACTOR: INSURANCE_Value"] || 0) * 100,
          account: (row["SUB-FACTOR: ACCOUNT_Value"] || 0) * 100,
          savings: (row["SUB-FACTOR: SAVINGS_Value"] || 0) * 100,
          borrowings: (row["SUB-FACTOR: BORROWINGS_Value"] || 0) * 100,
          usageActualData: (row["Usage_Actual_Data"] || 0) * 100,
        }))

        setUsageData(enrichedData)
        setProjects(result.projects || [])
        setBranches(result.branches || [])
      } catch (err) {
        console.error("Error fetching usage data:", err)
        setError("Failed to load usage data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const chartData: ChartDataPoint[] = useMemo(() => {
    const filtered = usageData.filter(
      (item) => selectedBranches.has(item.branchId) && selectedProjects.has(item.projectId),
    )

    const categories = ["INSURANCE", "ACCOUNT", "SAVINGS", "BORROWINGS"]
    const projectNames = [...new Set(filtered.map((d) => d.projectName))]

    return categories.map((category) => {
      const point: ChartDataPoint = { category }

      projectNames.forEach((project) => {
        const relevantData = filtered.filter((d) => d.projectName === project)
        if (relevantData.length > 0) {
          const values = relevantData.map((d) => {
            switch (category) {
              case "INSURANCE":
                return d.insurance
              case "ACCOUNT":
                return d.account
              case "SAVINGS":
                return d.savings
              case "BORROWINGS":
                return d.borrowings
              default:
                return 0
            }
          })
          const avgValue = values.reduce((a, b) => a + b, 0) / values.length
          point[project] = Math.min(avgValue, 100)
        }
      })

      return point
    })
  }, [usageData, selectedBranches, selectedProjects])

  const chartProjects = useMemo(() => {
    const filtered = usageData.filter(
      (item) => selectedBranches.has(item.branchId) && selectedProjects.has(item.projectId),
    )
    return [...new Set(filtered.map((d) => d.projectName))]
  }, [usageData, selectedBranches, selectedProjects])

  const avgUsageActualData = useMemo(() => {
    const filtered = usageData.filter(
      (item) => selectedBranches.has(item.branchId) && selectedProjects.has(item.projectId),
    )
    if (filtered.length === 0) return 0
    const sum = filtered.reduce((acc, item) => acc + item.usageActualData, 0)
    return (sum / filtered.length).toFixed(2)
  }, [usageData, selectedBranches, selectedProjects])

  const colors = ["#009EDB", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#FFD93D", "#6BCB77"]

  if (loading) {
    return (
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-[#009EDB] pb-6">
          <CardTitle className="text-3xl font-bold text-white">Usage</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96 bg-white">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#009EDB] border-t-transparent mx-auto"></div>
            <p className="mt-4 text-[#009EDB] font-semibold">Loading usage data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-[#009EDB] pb-6">
          <CardTitle className="text-3xl font-bold text-white">Usage</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-700 font-semibold">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-[#009EDB] pb-3">
        <div>
          <CardTitle className="text-3xl font-bold text-white mb-2">Usage</CardTitle>
          <div className="flex items-baseline gap-2">
            <span className="text-white text-sm font-medium opacity-90">Usage Actual Data:</span>
            <span className="text-white text-2xl font-bold">{avgUsageActualData}%</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-8 space-y-6 bg-white">
        {(selectedBranches.size > 0 || selectedProjects.size > 0) && (
          <div className="space-y-3 pb-4 border-b border-gray-100">
            {selectedProjects.size > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                {projects
                  .filter((p) => selectedProjects.has(p.id))
                  .map((project) => (
                    <Badge key={project.id} className="bg-blue-100 text-[#009EDB] hover:bg-blue-200 font-medium">
                      {project.name}
                    </Badge>
                  ))}
              </div>
            )}
            {selectedBranches.size > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                {branches
                  .filter((b) => selectedBranches.has(b.id))
                  .map((branch) => (
                    <Badge key={branch.id} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium">
                      {branch.name}
                    </Badge>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="space-y-6">
            <div className="bg-[#009EDB] rounded-xl p-6 shadow-lg transition-all duration-300">
              <div className="w-full h-96 bg-white rounded-lg p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="category"
                      tick={{ fill: "#1f2937", fontSize: 13, fontWeight: 600 }}
                      axisLine={{ stroke: "#d1d5db" }}
                    />
                    <YAxis
                      label={{
                        value: "Usage (%)",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: "#1f2937", fontWeight: 600 },
                      }}
                      domain={[0, 100]}
                      ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                      tick={{ fill: "#1f2937", fontSize: 12 }}
                      axisLine={{ stroke: "#d1d5db" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#000000",
                        border: "none",
                        borderRadius: "8px",
                        padding: "12px 16px",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                      }}
                      formatter={(value: any) => `${(value as number).toFixed(2)}%`}
                      labelFormatter={(label) => label}
                      labelStyle={{ color: "#ffffff", fontWeight: 600, marginBottom: "4px" }}
                      cursor={{ fill: "rgba(0, 158, 219, 0.05)" }}
                    />
                    {chartProjects.map((project, index) => (
                      <Bar
                        key={project}
                        dataKey={project}
                        fill={colors[index % colors.length]}
                        radius={[6, 6, 0, 0]}
                        className="transition-all duration-200 ease-out"
                        onMouseEnter={() => setHoveredBar(project)}
                        onMouseLeave={() => setHoveredBar(null)}
                        style={{
                          fill: hoveredBar === project ? "#A61E22" : colors[index % colors.length],
                          transition: "fill 0.2s ease-in-out",
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="text-xs text-gray-500 text-center font-medium">
              Displaying {chartProjects.length} project{chartProjects.length !== 1 ? "s" : ""} across{" "}
              {selectedBranches.size} branch{selectedBranches.size !== 1 ? "es" : ""}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-600 font-semibold text-lg">No usage data available</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your project or branch selection</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

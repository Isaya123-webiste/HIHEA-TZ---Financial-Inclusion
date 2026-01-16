"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
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
  value: number
  projectName: string
}

interface UsageChartProps {
  selectedProjects: Set<string>
  selectedBranches: Set<string>
}

export default function UsageChart({ selectedProjects, selectedBranches }: UsageChartProps) {
  const [usageData, setUsageData] = useState<UsageData[]>([])
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

    if (filtered.length === 0) return []

    const categories = ["INSURANCE", "ACCOUNT", "SAVINGS", "BORROWINGS"]
    return categories.map((category) => {
      const values = filtered.map((d) => {
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
      return {
        category,
        value: Math.min(avgValue, 100),
        projectName: filtered[0].projectName,
      }
    })
  }, [usageData, selectedBranches, selectedProjects])

  const getBarColor = (value: number) => {
    if (value >= 31) return "#22c55e" // green
    if (value >= 21) return "#eab308" // yellow
    return "#ef4444" // red
  }

  const avgUsageActualData = useMemo(() => {
    const filtered = usageData.filter(
      (item) => selectedBranches.has(item.branchId) && selectedProjects.has(item.projectId),
    )
    if (filtered.length === 0) return 0
    const sum = filtered.reduce((acc, item) => acc + item.usageActualData, 0)
    return (sum / filtered.length).toFixed(2)
  }, [usageData, selectedBranches, selectedProjects])

  if (loading) {
    return (
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-[#009EDB] pb-6">
          <div>
            <CardTitle className="text-2xl font-bold text-white">Usage Actual Data (X):</CardTitle>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-white/90 text-sm">Usage:</span>
            </div>
          </div>
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
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-[#009EDB] pb-6">
          <CardTitle className="text-2xl font-bold text-white">Usage Actual Data (X):</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-700 font-semibold">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="bg-[#009EDB] pb-6">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-5xl font-bold text-white">{avgUsageActualData}%</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm bg-white"></div>
            <span className="text-white text-lg font-bold">Usage</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-8 bg-[#009EDB]">
        {chartData.length > 0 ? (
          <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
                <CartesianGrid strokeDasharray="0" stroke="#ffffff" vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fill: "#ffffff", fontSize: 13, fontWeight: 600 }}
                  axisLine={{ stroke: "#ffffff" }}
                />
                <YAxis
                  label={{
                    value: "Usage (%)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#ffffff", fontWeight: 600, fontSize: 12 },
                  }}
                  domain={[0, 100]}
                  ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                  tick={{ fill: "#ffffff", fontSize: 12 }}
                  axisLine={{ stroke: "#ffffff" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000000",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 14px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload as ChartDataPoint
                      return (
                        <div className="bg-black text-white px-3 py-2 rounded-md text-sm">
                          <p className="font-semibold">{data.projectName}</p>
                          <p className="text-white/90">{data.category}</p>
                          <p className="text-white font-bold">{(payload[0].value as number).toFixed(2)}%</p>
                        </div>
                      )
                    }
                    return null
                  }}
                  cursor={false}
                />
                <Bar
                  dataKey="value"
                  radius={[8, 8, 0, 0]}
                  label={{
                    position: "top",
                    fill: "#ffffff",
                    fontSize: 12,
                    fontWeight: 600,
                    formatter: (value: number) => `${value.toFixed(2)}%`,
                  }}
                  onMouseEnter={(data, index) => setHoveredBar(`bar-${index}`)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={hoveredBar === `bar-${index}` ? "#A61E22" : getBarColor(entry.value)}
                      style={{
                        transition: "fill 0.2s ease-in-out",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-white font-semibold text-lg">No usage data available</p>
            <p className="text-white/70 text-sm mt-2">Try adjusting your project or branch selection</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Shield } from "lucide-react"
import { getBarriersKRIData, type BarriersKRIData } from "@/lib/barriers-display-actions"
import PageHeader from "@/components/page-header"

interface BranchOption {
  id: string
  name: string
}

interface ProjectOption {
  id: string
  name: string
}

export default function BarriersOverviewPage() {
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>("all")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [kriData, setKRIData] = useState<BarriersKRIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState({
    KRI: true,
    SUB_FACTORS: false,
    MAIN_FACTOR: false,
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadBarriersData()
  }, [selectedBranch, selectedProject])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      // Load branches and projects
      const branchesResponse = await fetch("/api/branches")
      const projectsResponse = await fetch("/api/projects")
      
      if (branchesResponse.ok) {
        const branchesData = await branchesResponse.json()
        setBranches(branchesData)
      }
      
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        setProjects(projectsData)
      }
    } catch (error) {
      console.error("Error loading initial data:", error)
    }
  }

  const loadBarriersData = async () => {
    try {
      setLoading(true)
      const data = await getBarriersKRIData(
        selectedBranch === "all" ? undefined : selectedBranch,
        selectedProject === "all" ? undefined : selectedProject
      )
      setKRIData(data)
    } catch (error) {
      console.error("Error loading barriers data:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (category: keyof typeof expandedCategories) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`
  }

  const getKRIStatus = (value: number) => {
    if (value <= 0.2) return { label: "Low Risk", color: "bg-green-100 text-green-800" }
    if (value <= 0.5) return { label: "Medium Risk", color: "bg-yellow-100 text-yellow-800" }
    if (value <= 0.8) return { label: "High Risk", color: "bg-orange-100 text-orange-800" }
    return { label: "Critical Risk", color: "bg-red-100 text-red-800" }
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-800">
        <PageHeader title="Barriers Overview" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin inline-flex items-center justify-center w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Loading barriers data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-800">
      <PageHeader title="Barriers Overview" />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
              Filter by Project
            </label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white mb-2 block">
              Filter by Branch
            </label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Barriers Score */}
        {kriData && (
          <>
            <Card className="mb-8 bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 border-rose-200 dark:border-rose-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-rose-600" />
                    <div>
                      <CardTitle className="text-slate-900 dark:text-white">Barriers Composite Score</CardTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Overall barrier challenges to financial inclusion</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-5xl font-bold text-rose-600">{formatPercentage(kriData.mainScore)}</div>
                  <Badge className={`${getKRIStatus(kriData.mainScore).color}`}>
                    {getKRIStatus(kriData.mainScore).label}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
                  Based on {kriData.kris.length} Key Risk Indicators and {kriData.subFactors.length} barrier sub-factors
                </p>
              </CardContent>
            </Card>

            {/* KRIs Section */}
            <Card className="mb-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <div
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => toggleCategory("KRI")}
              >
                <div className="flex items-center gap-4">
                  <div className="text-slate-600 dark:text-slate-400">
                    {expandedCategories.KRI ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Key Risk Indicators</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Risk metrics measuring barrier impact</p>
                  </div>
                </div>
                <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
                  {kriData.kris.length} indicators
                </Badge>
              </div>

              {expandedCategories.KRI && (
                <CardContent className="pt-0 px-6 pb-6 space-y-3 bg-slate-50 dark:bg-slate-900">
                  {kriData.kris.map((kri, idx) => (
                    <div
                      key={kri.id}
                      className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{kri.name}</p>
                            {kri.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{kri.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-rose-600">{formatPercentage(kri.value)}</p>
                          <Badge className={`mt-2 ${getKRIStatus(kri.value).color}`}>
                            {getKRIStatus(kri.value).label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>

            {/* Sub-Factors Section */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <div
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => toggleCategory("SUB_FACTORS")}
              >
                <div className="flex items-center gap-4">
                  <div className="text-slate-600 dark:text-slate-400">
                    {expandedCategories.SUB_FACTORS ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Barrier Sub-Factors</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Specific barrier categories and their impact</p>
                  </div>
                </div>
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                  {kriData.subFactors.length} factors
                </Badge>
              </div>

              {expandedCategories.SUB_FACTORS && (
                <CardContent className="pt-0 px-6 pb-6 space-y-3 bg-slate-50 dark:bg-slate-900">
                  {kriData.subFactors.map((factor, idx) => (
                    <div
                      key={factor.id}
                      className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{factor.name}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600">{factor.value}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Weight: {factor.weight}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

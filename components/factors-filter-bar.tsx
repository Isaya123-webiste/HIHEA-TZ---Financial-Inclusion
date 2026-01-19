"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchUsageChartData } from "@/lib/usage-display-actions"

interface FactorsFilterBarProps {
  selectedProjects: Set<string>
  setSelectedProjects: (projects: Set<string>) => void
  selectedBranches: Set<string>
  setSelectedBranches: (branches: Set<string>) => void
}

export default function FactorsFilterBar({
  selectedProjects,
  setSelectedProjects,
  selectedBranches,
  setSelectedBranches,
}: FactorsFilterBarProps) {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    async function loadFilters() {
      try {
        const result = await fetchUsageChartData()
        if (result.success) {
          setProjects(result.projects || [])
          setBranches(result.branches || [])

          const firstBranch = result.branches?.[0]?.id
          const firstProject = result.projects?.[0]?.id
          if (firstBranch) setSelectedBranches(new Set([firstBranch]))
          if (firstProject) setSelectedProjects(new Set([firstProject]))
        }
      } finally {
        setLoading(false)
      }
    }
    loadFilters()
  }, [setSelectedProjects, setSelectedBranches])

  if (loading) return null

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between gap-8">
        {/* Left: Filter Icon and Title */}
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-5xl">tune</span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Global Filters</h2>
        </div>

        {/* Center: Branch and Project Selects */}
        <div className="flex items-end gap-8 flex-1">
          {/* Branch Select */}
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
              Branch
            </label>
            <Select
              value={Array.from(selectedBranches)[0] || ""}
              onValueChange={(value) => setSelectedBranches(new Set([value]))}
            >
              <SelectTrigger className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white h-12 rounded-lg">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id} className="dark:text-white">
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Select */}
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
              Project
            </label>
            <Select
              value={Array.from(selectedProjects)[0] || ""}
              onValueChange={(value) => setSelectedProjects(new Set([value]))}
            >
              <SelectTrigger className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white h-12 rounded-lg">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-700 dark:border-slate-600">
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id} className="dark:text-white">
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right: Status Legend */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">TARGET (31%-50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">CAUTION (21%-30%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">LOW (0%-20%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

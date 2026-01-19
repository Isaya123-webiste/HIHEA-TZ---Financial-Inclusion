"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
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

  // Special IDs for "All" options
  const ALL_BRANCHES_ID = "all-branches"
  const ALL_PROJECTS_ID = "all-projects"

  useEffect(() => {
    async function loadFilters() {
      try {
        const result = await fetchUsageChartData()
        if (result.success) {
          setProjects(result.projects || [])
          setBranches(result.branches || [])

          // Default to "All" options
          setSelectedBranches(new Set([ALL_BRANCHES_ID]))
          setSelectedProjects(new Set([ALL_PROJECTS_ID]))
        }
      } finally {
        setLoading(false)
      }
    }
    loadFilters()
  }, [setSelectedProjects, setSelectedBranches])

  const handleBranchToggle = (branchId: string) => {
    const newBranches = new Set(selectedBranches)
    
    // If selecting "All Branches", clear everything and select only that
    if (branchId === ALL_BRANCHES_ID) {
      newBranches.clear()
      newBranches.add(ALL_BRANCHES_ID)
    } else {
      // If "All Branches" is selected, remove it first
      if (newBranches.has(ALL_BRANCHES_ID)) {
        newBranches.delete(ALL_BRANCHES_ID)
      }
      
      // Toggle the specific branch
      if (newBranches.has(branchId)) {
        newBranches.delete(branchId)
      } else {
        newBranches.add(branchId)
      }
      
      // If no branches selected, default to "All Branches"
      if (newBranches.size === 0) {
        newBranches.add(ALL_BRANCHES_ID)
      }
    }
    
    setSelectedBranches(newBranches)
  }

  const handleProjectToggle = (projectId: string) => {
    const newProjects = new Set(selectedProjects)
    
    // If selecting "All Projects", clear everything and select only that
    if (projectId === ALL_PROJECTS_ID) {
      newProjects.clear()
      newProjects.add(ALL_PROJECTS_ID)
    } else {
      // If "All Projects" is selected, remove it first
      if (newProjects.has(ALL_PROJECTS_ID)) {
        newProjects.delete(ALL_PROJECTS_ID)
      }
      
      // Toggle the specific project
      if (newProjects.has(projectId)) {
        newProjects.delete(projectId)
      } else {
        newProjects.add(projectId)
      }
      
      // If no projects selected, default to "All Projects"
      if (newProjects.size === 0) {
        newProjects.add(ALL_PROJECTS_ID)
      }
    }
    
    setSelectedProjects(newProjects)
  }

  const getBranchLabel = () => {
    if (selectedBranches.has(ALL_BRANCHES_ID)) return "All Branches"
    if (selectedBranches.size === 1) {
      const branchId = Array.from(selectedBranches)[0]
      return branches.find((b) => b.id === branchId)?.name || "Select branches"
    }
    return `${selectedBranches.size} branches`
  }

  const getProjectLabel = () => {
    if (selectedProjects.has(ALL_PROJECTS_ID)) return "All Projects"
    if (selectedProjects.size === 1) {
      const projectId = Array.from(selectedProjects)[0]
      return projects.find((p) => p.id === projectId)?.name || "Select projects"
    }
    return `${selectedProjects.size} projects`
  }

  if (loading) return null

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between gap-8">
        {/* Left: Filter Icon and Title */}
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-5xl">tune</span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Global Filters</h2>
        </div>

        {/* Center: Branch and Project Multi-Selects */}
        <div className="flex items-end gap-8 flex-1">
          {/* Branch Multi-Select */}
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
              Branch
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-12 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 justify-between"
                >
                  <span className="truncate">{getBranchLabel()}</span>
                  <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 dark:bg-slate-700 dark:border-slate-600">
                <DropdownMenuLabel className="dark:text-white">Select Branches</DropdownMenuLabel>
                <DropdownMenuSeparator className="dark:bg-slate-600" />
                <DropdownMenuCheckboxItem
                  checked={selectedBranches.has(ALL_BRANCHES_ID)}
                  onCheckedChange={() => handleBranchToggle(ALL_BRANCHES_ID)}
                  className="dark:text-white font-semibold"
                >
                  All Branches
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator className="dark:bg-slate-600" />
                {branches.map((branch) => (
                  <DropdownMenuCheckboxItem
                    key={branch.id}
                    checked={selectedBranches.has(branch.id)}
                    onCheckedChange={() => handleBranchToggle(branch.id)}
                    className="dark:text-white"
                  >
                    {branch.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Project Multi-Select */}
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
              Project
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-12 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 justify-between"
                >
                  <span className="truncate">{getProjectLabel()}</span>
                  <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 dark:bg-slate-700 dark:border-slate-600">
                <DropdownMenuLabel className="dark:text-white">Select Projects</DropdownMenuLabel>
                <DropdownMenuSeparator className="dark:bg-slate-600" />
                <DropdownMenuCheckboxItem
                  checked={selectedProjects.has(ALL_PROJECTS_ID)}
                  onCheckedChange={() => handleProjectToggle(ALL_PROJECTS_ID)}
                  className="dark:text-white font-semibold"
                >
                  All Projects
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator className="dark:bg-slate-600" />
                {projects.map((project) => (
                  <DropdownMenuCheckboxItem
                    key={project.id}
                    checked={selectedProjects.has(project.id)}
                    onCheckedChange={() => handleProjectToggle(project.id)}
                    className="dark:text-white"
                  >
                    {project.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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

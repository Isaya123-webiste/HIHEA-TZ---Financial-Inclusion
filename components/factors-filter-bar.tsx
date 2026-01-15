"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Filter } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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

  useEffect(() => {
    async function loadFilters() {
      try {
        const result = await fetchUsageChartData()
        if (result.success) {
          setProjects(result.projects || [])
          setBranches(result.branches || [])

          // Initialize with all selected
          setSelectedProjects(new Set((result.projects || []).map((p: any) => p.id)))
          setSelectedBranches(new Set((result.branches || []).map((b: any) => b.id)))
        }
      } finally {
        setLoading(false)
      }
    }
    loadFilters()
  }, [setSelectedProjects, setSelectedBranches])

  const handleProjectToggle = (projectId: string) => {
    const newSelected = new Set(selectedProjects)
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId)
    } else {
      newSelected.add(projectId)
    }
    setSelectedProjects(newSelected)
  }

  const handleBranchToggle = (branchId: string) => {
    const newSelected = new Set(selectedBranches)
    if (newSelected.has(branchId)) {
      newSelected.delete(branchId)
    } else {
      newSelected.add(branchId)
    }
    setSelectedBranches(newSelected)
  }

  const handleSelectAllProjects = () => {
    if (selectedProjects.size === projects.length) {
      setSelectedProjects(new Set())
    } else {
      setSelectedProjects(new Set(projects.map((p) => p.id)))
    }
  }

  const handleSelectAllBranches = () => {
    if (selectedBranches.size === branches.length) {
      setSelectedBranches(new Set())
    } else {
      setSelectedBranches(new Set(branches.map((b) => b.id)))
    }
  }

  if (loading) return null

  return (
    <Card className="border-0 shadow-md bg-gradient-to-r from-slate-50 to-blue-50">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Filter className="h-4 w-4" />
            Filters for All Factors
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
            {/* Project Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-between bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                >
                  <span className="truncate">
                    {selectedProjects.size === 0
                      ? "Select projects..."
                      : selectedProjects.size === projects.length
                        ? "All projects"
                        : `${selectedProjects.size} project${selectedProjects.size !== 1 ? "s" : ""}`}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="font-semibold">Filter by Project</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={selectedProjects.size === projects.length && projects.length > 0}
                  onCheckedChange={handleSelectAllProjects}
                >
                  {selectedProjects.size === projects.length && projects.length > 0 ? "Deselect All" : "Select All"}
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {projects.map((project) => (
                  <DropdownMenuCheckboxItem
                    key={project.id}
                    checked={selectedProjects.has(project.id)}
                    onCheckedChange={() => handleProjectToggle(project.id)}
                  >
                    {project.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Branch Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-between bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                >
                  <span className="truncate">
                    {selectedBranches.size === 0
                      ? "Select branches..."
                      : selectedBranches.size === branches.length
                        ? "All branches"
                        : `${selectedBranches.size} branch${selectedBranches.size !== 1 ? "es" : ""}`}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="font-semibold">Filter by Branch</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={selectedBranches.size === branches.length && branches.length > 0}
                  onCheckedChange={handleSelectAllBranches}
                >
                  {selectedBranches.size === branches.length && branches.length > 0 ? "Deselect All" : "Select All"}
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {branches.map((branch) => (
                  <DropdownMenuCheckboxItem
                    key={branch.id}
                    checked={selectedBranches.has(branch.id)}
                    onCheckedChange={() => handleBranchToggle(branch.id)}
                  >
                    {branch.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

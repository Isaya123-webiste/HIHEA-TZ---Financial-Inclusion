"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getProjects, type Project } from "@/lib/projects-actions"
import { AlertCircle } from 'lucide-react'

interface ProjectSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelectProject: (projectId: string) => void
}

export default function ProjectSelectionDialog({ isOpen, onClose, onSelectProject }: ProjectSelectionDialogProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadProjects()
    }
  }, [isOpen])

  const loadProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getProjects()
      if (result.success && result.data) {
        setProjects(result.data)
      } else {
        setError(result.error || "Failed to load projects")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId)
  }

  const handleContinue = () => {
    if (selectedProjectId) {
      onSelectProject(selectedProjectId)
      setSelectedProjectId(null)
    }
  }

  const handleClose = () => {
    setSelectedProjectId(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-[#009edb] mb-2">Choose The Project</DialogTitle>
          <p className="text-gray-600">Assign The Form to A Specific Project.</p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div
              className="h-8 w-8 animate-spin rounded-full border-4"
              style={{ borderColor: "#009edb", borderTopColor: "transparent" }}
            ></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <p className="text-red-600">{error}</p>
            <Button onClick={loadProjects} style={{ backgroundColor: "#009edb" }}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-6">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project.id)}
                  className={`
                    relative p-6 rounded-lg border-2 transition-all duration-200
                    ${
                      selectedProjectId === project.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300 bg-gray-100 hover:border-gray-400 hover:bg-gray-200"
                    }
                  `}
                >
                  {/* Radio button indicator */}
                  <div className="absolute top-4 left-4">
                    <div
                      className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${selectedProjectId === project.id ? "border-green-500 bg-green-500" : "border-gray-400"}
                    `}
                    >
                      {selectedProjectId === project.id && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    </div>
                  </div>

                  {/* Project name */}
                  <div className="mt-8 text-left">
                    <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!selectedProjectId}
                style={{ backgroundColor: "#009edb" }}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface BranchModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (branchName: string) => Promise<{ success?: boolean; error?: string }>
  mode: "create" | "edit"
  initialValue?: string
  title: string
}

export default function BranchModal({ isOpen, onClose, onSubmit, mode, initialValue = "", title }: BranchModalProps) {
  const [branchName, setBranchName] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setBranchName(initialValue)
      setError(null)
      setSuccess(null)
    }
  }, [isOpen, initialValue])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!branchName.trim()) {
      setError("Branch name is required")
      setLoading(false)
      return
    }

    console.log("[v0] BranchModal handleSubmit called with:", branchName.trim())

    try {
      const result = await onSubmit(branchName.trim())

      console.log("[v0] onSubmit result:", result)

      if (result.success) {
        setBranchName("")
        setTimeout(() => {
          onClose()
        }, 500)
      } else {
        setTimeout(() => {
          onClose()
        }, 1000)
      }
    } catch (error) {
      console.error(`[v0] ${mode} branch error:`, error)
      setTimeout(() => {
        onClose()
      }, 1000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="material-icons">business</span>
            {title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="branchName" className="text-sm font-medium">
              Branch Name
            </label>
            <Input
              id="branchName"
              type="text"
              placeholder="Enter branch name"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700" disabled={loading}>
              {loading
                ? `${mode === "create" ? "Creating" : "Updating"}...`
                : mode === "create"
                  ? "Create Branch"
                  : "Update Branch"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

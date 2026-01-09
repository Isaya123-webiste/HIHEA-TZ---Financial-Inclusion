"use client"

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2 } from "lucide-react"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  loading?: boolean
  variant?: "warning" | "destructive" | "default"
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Yes, Delete",
  cancelText = "No, Cancel",
  isDestructive = false,
  loading = false,
  variant = "default",
}: ConfirmationDialogProps) {
  const isDelete = isDestructive || variant === "destructive"
  const brandColor = "#009edb"
  const destructiveColor = "#ef4444"

  const getIcon = () => {
    if (isDelete) return <Trash2 className="h-16 w-16 mb-4" style={{ color: destructiveColor }} strokeWidth={1.5} />
    if (variant === "warning")
      return <AlertTriangle className="h-16 w-16 mb-4" style={{ color: "#f59e0b" }} strokeWidth={1.5} />
    return <AlertTriangle className="h-16 w-16 mb-4" style={{ color: brandColor }} strokeWidth={1.5} />
  }

  const getActionColor = () => {
    if (isDelete) return destructiveColor
    if (variant === "warning") return "#f59e0b"
    return brandColor
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-0 rounded-2xl shadow-lg">
        <div className="flex flex-col items-center text-center pt-8 pb-2">
          {/* Icon at top */}
          {getIcon()}

          {/* Title */}
          <DialogTitle className="text-2xl font-bold text-gray-900 mb-3">{title}</DialogTitle>

          {/* Message */}
          <DialogDescription className="text-base text-gray-600 leading-relaxed mb-8">{message}</DialogDescription>

          <div className="flex gap-3 w-full items-center justify-center">
            {/* Cancel Button - removed X icon, keeping only text */}
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 min-w-32 border-2 font-semibold bg-transparent"
              style={{
                borderColor: brandColor,
                color: brandColor,
              }}
            >
              {cancelText}
            </Button>

            {/* Confirm Button - removed Check icon, keeping only text */}
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="px-6 py-2.5 min-w-32 text-white font-semibold rounded-lg"
              style={{
                backgroundColor: getActionColor(),
              }}
            >
              {loading ? "Processing..." : confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

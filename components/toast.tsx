"use client"

import { useState, useEffect } from "react"
import { CheckCircle, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Toast {
  id: string
  type: "success" | "error"
  message: string
  duration?: number
}

interface ToastProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  return (
    <div
      className={`
        flex items-center gap-3 rounded-lg p-4 shadow-lg transition-all duration-300 ease-in-out
        ${toast.type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}
      `}
    >
      {toast.type === "success" ? (
        <CheckCircle className="h-5 w-5 text-green-600" />
      ) : (
        <AlertCircle className="h-5 w-5 text-red-600" />
      )}

      <p className={`flex-1 text-sm font-medium ${toast.type === "success" ? "text-green-800" : "text-red-800"}`}>
        {toast.message}
      </p>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(toast.id)}
        className={`h-6 w-6 p-0 ${toast.type === "success" ? "hover:bg-green-100" : "hover:bg-red-100"}`}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-96 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (type: "success" | "error", message: string, duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { id, type, message, duration }

    setToasts((prev) => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const showSuccess = (message: string, duration?: number) => {
    addToast("success", message, duration)
  }

  const showError = (message: string, duration?: number) => {
    addToast("error", message, duration)
  }

  return {
    toasts,
    showSuccess,
    showError,
    removeToast,
  }
}

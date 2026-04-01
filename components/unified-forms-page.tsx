"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { RBACContext } from "@/lib/rbac-utils"
import { canSubmitForms, canReviewForms } from "@/lib/rbac-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface UnifiedFormsPageProps {
  context: RBACContext | null
  children: React.ReactNode
}

/**
 * Unified Forms Page wrapper
 * Routes to appropriate form component based on user role:
 * - branch_report_officer: Shows form submission interface with project pooling
 * - program_officer/assistance_program_officer: Shows review/approval interface
 * - others: Shows access denied
 */
export default function UnifiedFormsPage({ context, children }: UnifiedFormsPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (!context) {
      router.push("/")
      return
    }

    // Verify user has access to forms
    const hasAccess = canSubmitForms(context) || canReviewForms(context)

    if (!hasAccess) {
      setAuthorized(false)
    } else {
      setAuthorized(true)
    }

    setLoading(false)
  }, [context, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>You do not have permission to access the forms section.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return <>{children}</>
}

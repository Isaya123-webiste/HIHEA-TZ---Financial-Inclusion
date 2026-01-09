"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DataOverviewPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to weights configuration by default
    router.push("/admin/data-overview/weights")
  }, [router])

  return null
}

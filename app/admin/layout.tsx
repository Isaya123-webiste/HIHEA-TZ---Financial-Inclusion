import AdminLayout from "@/components/admin-layout"
import type React from "react"

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Google Material Icons */}
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      <AdminLayout>{children}</AdminLayout>
    </>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RoleLayout } from "@/components/role-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getUserProfile, getFormsByBranch } from "@/lib/enhanced-forms-actions"

export default function BROFormsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [forms, setForms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push("/")
        return
      }
      setUser(authUser)
      const profileData = await getUserProfile(authUser.id)
      if (profileData?.profile) {
        setProfile(profileData.profile)
        const formsData = await getFormsByBranch(profileData.profile.branch_id)
        setForms(formsData?.data || [])
      }
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>

  return (
    <RoleLayout userRole="branch_report_officer" userName={user?.email}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Forms</h1>
          <Button onClick={() => router.push("/branch-report-officer/forms/new")} className="gap-2">
            <Plus className="w-4 h-4" /> New Form
          </Button>
        </div>

        <div className="grid gap-4">
          {forms.length === 0 ? (
            <Card className="p-8 text-center"><p className="text-gray-500">No forms yet</p></Card>
          ) : (
            forms.map((form) => (
              <Card key={form.id} className="p-4 hover:shadow-md cursor-pointer" onClick={() => router.push(`/branch-report-officer/forms/${form.id}`)}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{form.project_id || "Untitled"}</p>
                    <p className="text-sm text-gray-500">{new Date(form.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge>{form.status}</Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </RoleLayout>
  )
}

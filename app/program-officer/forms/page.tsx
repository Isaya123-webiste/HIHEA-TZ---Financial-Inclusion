"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RoleLayout } from "@/components/role-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getUserProfile, getFormsByBranch, approveForm, sendFormBack } from "@/lib/enhanced-forms-actions"

export default function POFormsPage() {
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

  const handleApprove = async (formId: string) => {
    try {
      await approveForm(formId)
      loadData()
    } catch (err) {
      console.error("Error:", err)
    }
  }

  const handleSendBack = async (formId: string) => {
    try {
      await sendFormBack(formId, "Please review and resubmit")
      loadData()
    } catch (err) {
      console.error("Error:", err)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>

  return (
    <RoleLayout userRole="program_officer" userName={profile?.full_name}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Forms to Review</h1>

        <div className="grid gap-4">
          {forms.filter(f => f.status === "submitted").length === 0 ? (
            <Card className="p-8 text-center"><p className="text-gray-500">No forms to review</p></Card>
          ) : (
            forms.map((form) => (
              <Card key={form.id} className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-semibold">{form.project_id}</p>
                    <p className="text-sm text-gray-500">{new Date(form.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge>{form.status}</Badge>
                </div>
                {form.status === "submitted" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(form.id)}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => handleSendBack(form.id)}>Send Back</Button>
                    <Button size="sm" variant="ghost" onClick={() => router.push(`/program-officer/forms/${form.id}`)}>View</Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </RoleLayout>
  )
}

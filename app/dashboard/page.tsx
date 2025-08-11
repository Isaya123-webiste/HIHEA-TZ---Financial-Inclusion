"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, User, Edit, Shield } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { getUserProfile, checkAdminRole } from "@/lib/admin-actions"
import type { Profile } from "@/lib/supabase-client"

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadUserData() {
      try {
        // Get current user from client-side
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          setError(userError.message)
          return
        }

        if (user) {
          // Get user profile
          const profileResult = await getUserProfile(user.id)

          if (profileResult.error) {
            setError(profileResult.error)
          } else if (profileResult.profile) {
            setProfile(profileResult.profile)

            // Check if user is admin
            const adminCheck = await checkAdminRole(user.id)
            if (adminCheck.isAdmin) {
              setIsAdmin(true)
              // Redirect admin users to admin dashboard
              router.push("/admin")
              return
            }
          }
        } else {
          // No user found, redirect to login
          router.push("/")
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        setError("Failed to load user data")
      } finally {
        setLoading(false)
      }
    }

    loadUserData()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setProfile(null)
        router.push("/")
      } else if (event === "SIGNED_IN" && session?.user) {
        // Reload profile data when user signs in
        const profileResult = await getUserProfile(session.user.id)
        if (profileResult.profile) {
          setProfile(profileResult.profile)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-teal-600 p-2">
                <User className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold">HIH Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Button
                  onClick={() => router.push("/admin")}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                >
                  <Shield className="h-4 w-4" />
                  Admin Panel
                </Button>
              )}
              <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}!
            {isAdmin && <span className="ml-2 text-red-600">(Admin)</span>}
          </h2>
          <p className="text-muted-foreground">Here's your HIH Financial Inclusion dashboard.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Profile Information</CardTitle>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Name:</strong> {profile?.full_name || "Not provided"}
                </p>
                <p>
                  <strong>Email:</strong> {profile?.email || "Not provided"}
                </p>
                <p>
                  <strong>Role:</strong> {profile?.role || "user"}
                </p>
                <p>
                  <strong>Member since:</strong>{" "}
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}
                </p>
                <p>
                  <strong>Last updated:</strong>{" "}
                  {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : "Never"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Inclusion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Access Rate:</strong> 78%
                </p>
                <p>
                  <strong>Usage Growth:</strong> +24%
                </p>
                <p>
                  <strong>Status:</strong> Active Member
                </p>
                <p>
                  <strong>Account Type:</strong> {profile?.role === "admin" ? "Administrator" : "Standard"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Community Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Members:</strong> 10K+
                </p>
                <p>
                  <strong>Branches:</strong> 50+
                </p>
                <p>
                  <strong>Satisfaction:</strong> 95%
                </p>
                <p>
                  <strong>Your Contributions:</strong> {isAdmin ? "Admin Access" : "12"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

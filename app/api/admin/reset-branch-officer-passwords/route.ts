import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { resetAllBranchReportOfficerPasswords } from "@/lib/user-management-actions"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // Create Supabase client to verify admin authorization
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch (error) {
              // Ignore cookie setting errors
            }
          },
        },
      },
    )

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to verify admin role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Only admins can reset passwords" }, { status: 403 })
    }

    // Execute the batch password reset
    const result = await resetAllBranchReportOfficerPasswords()

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error in password reset API:", error)
    return NextResponse.json({ error: "Failed to reset passwords" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { fixBranchOfficerLogins } from "@/lib/fix-branch-officer-login"
import { supabaseAdmin } from "@/lib/supabase-admin"

/**
 * POST /api/admin/fix-branch-officer-logins
 *
 * PERMANENT FIX for Branch Report Officer login issues
 *
 * This endpoint:
 * 1. Verifies the caller is an admin user
 * 2. Resets passwords for all active Branch Report Officers
 * 3. Returns new temporary passwords
 *
 * Root cause: Auth.users password hashes were corrupted/mismatched
 * Solution: Reset all passwords through Supabase Admin API
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Branch Officer Login Fix API called")

    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Verify the user is an admin
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      console.error("[v0] Auth verification failed:", userError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || profile?.role !== "admin") {
      console.error("[v0] User is not an admin")
      return NextResponse.json({ error: "Only admins can perform this action" }, { status: 403 })
    }

    console.log(`[v0] Admin ${user.email} requesting Branch Officer login fix`)

    // Execute the fix
    const result = await fixBranchOfficerLogins()

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Failed to fix some or all Branch Report Officer logins",
          results: result.results,
          totalFixed: result.totalFixed,
          totalFailed: result.totalFailed,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully reset passwords for ${result.totalFixed} Branch Report Officers`,
      results: result.results,
      totalFixed: result.totalFixed,
      totalFailed: result.totalFailed,
    })
  } catch (error: any) {
    console.error("[v0] Branch Officer Login Fix API error:", error)
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 })
  }
}

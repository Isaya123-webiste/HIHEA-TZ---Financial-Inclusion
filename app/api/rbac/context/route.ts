import { getRBACContext } from "@/lib/rbac-utils"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const context = await getRBACContext()

    if (!context) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json(context)
  } catch (error) {
    console.error("[RBAC API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

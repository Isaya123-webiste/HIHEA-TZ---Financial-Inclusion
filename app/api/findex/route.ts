import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const institution = searchParams.get("institution")

    let query = supabase
      .from("findex_data")
      .select(
        `
        id,
        project_id,
        projects(name),
        branch_id,
        branches(name),
        usage_actual_data,
        access_actual_data,
        barriers_actual_data
      `
      )

    if (institution) {
      query = query.eq("financial_institution", institution)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Calculate FINDEX for each record
    const processedData = (data || []).map((item: any) => ({
      id: item.id,
      projectId: item.project_id,
      projectName: item.projects?.name || "Unknown",
      branchId: item.branch_id,
      branchName: item.branches?.name || "Unknown",
      usageActualData: item.usage_actual_data || 0,
      accessActualData: item.access_actual_data || 0,
      barriersActualData: item.barriers_actual_data || 0,
      findexValue:
        ((item.usage_actual_data || 0) +
          (item.access_actual_data || 0) +
          (item.barriers_actual_data || 0)) /
        3,
    }))

    return NextResponse.json({
      success: true,
      data: processedData,
    })
  } catch (error: any) {
    console.error("Error fetching FINDEX data:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch FINDEX data",
      },
      { status: 500 }
    )
  }
}

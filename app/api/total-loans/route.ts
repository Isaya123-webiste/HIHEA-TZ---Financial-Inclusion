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
      .from("branch_reports")
      .select(
        `
        id,
        project_id,
        projects(name),
        branch_id,
        branches(name),
        loan_amount_approved,
        date_loan_received
      `
      )
      .not("loan_amount_approved", "is", null)
      .gt("loan_amount_approved", 0)

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

    const processedData = (data || []).map((item: any) => ({
      id: item.id,
      projectId: item.project_id,
      projectName: item.projects?.name || "Unknown",
      branchId: item.branch_id,
      branchName: item.branches?.name || "Unknown",
      loanAmountApproved: item.loan_amount_approved || 0,
      dateLoanReceived: item.date_loan_received || "",
    }))

    return NextResponse.json({
      success: true,
      data: processedData,
    })
  } catch (error: any) {
    console.error("Error fetching loans data:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch loans data",
      },
      { status: 500 }
    )
  }
}

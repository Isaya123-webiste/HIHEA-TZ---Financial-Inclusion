"use server"

import { supabaseAdmin } from "@/lib/supabase-admin"
import {
  calculateFraudIncidentRate,
  calculateTrustErosion,
  calculateMembersLoanCost,
  calculateHandInHandLoanCost,
  calculateMFILoanServiceCost,
  calculateDocumentationDelayRate,
  calculateGenderBasedBarrierRate,
  calculateFamilyAndCommunityBarrierRate,
  calculateTraineeDropoutRate,
  calculateTrainerDropoutRate,
  calculateCurriculumRelevanceComplaintRate,
  calculateLowKnowledgeRetentionRate,
} from "@/lib/barriers-kri-calculations"

export interface BarriersKRIData {
  mainScore: number
  kris: Array<{
    id: string
    name: string
    description: string
    value: number
  }>
  subFactors: Array<{
    id: string
    name: string
    value: number
    weight: number
  }>
}

export async function getBarriersKRIData(branchId?: string, projectId?: string): Promise<BarriersKRIData> {
  try {
    console.log("[v0] Fetching barriers KRI data", { branchId, projectId })

    // Fetch branch reports data
    let query = supabaseAdmin.from("branch_reports").select(`
      id,
      branch_id,
      project_id,
      members_at_start,
      members_at_end,
      members_applying_loans,
      bros_at_start,
      bros_at_end,
      money_fraud,
      trust_erosion,
      loan_cost_high,
      documentation_delay
    `)

    if (branchId) {
      query = query.eq("branch_id", branchId)
    }
    if (projectId) {
      query = query.eq("project_id", projectId)
    }

    const { data: branchReports, error: reportsError } = await query

    if (reportsError) {
      console.error("[v0] Error fetching branch reports:", reportsError)
      throw reportsError
    }

    console.log("[v0] Branch reports fetched:", branchReports?.length || 0, "records")

    // Calculate all KRIs from branch reports
    const kriValues: Record<string, number> = {
      fraudIncidentRate: 0,
      trustErosion: 0,
      membersLoanCost: 0,
      handInHandLoanCost: 0,
      mfiLoanServiceCost: 0,
      documentationDelayRate: 0,
      genderBasedBarrierRate: 0,
      familyAndCommunityBarrierRate: 0,
      traineeDropoutRate: 0,
      trainerDropoutRate: 0,
      curriculumRelevanceComplaintRate: 0,
      lowKnowledgeRetentionRate: 0,
    }

    // Average calculations if multiple records
    if (branchReports && branchReports.length > 0) {
      const data = branchReports[0] // Use first record or average if needed

      kriValues.fraudIncidentRate = calculateFraudIncidentRate(data.money_fraud, data.members_at_end)
      kriValues.trustErosion = calculateTrustErosion(data.trust_erosion, data.members_at_end)
      kriValues.membersLoanCost = calculateMembersLoanCost(data.loan_cost_high, data.members_applying_loans)
      kriValues.handInHandLoanCost = calculateHandInHandLoanCost()
      kriValues.mfiLoanServiceCost = calculateMFILoanServiceCost()
      kriValues.documentationDelayRate = calculateDocumentationDelayRate(data.documentation_delay, data.members_applying_loans)
      kriValues.genderBasedBarrierRate = calculateGenderBasedBarrierRate(0, data.members_at_end)
      kriValues.familyAndCommunityBarrierRate = calculateFamilyAndCommunityBarrierRate(0, data.members_at_end)
      kriValues.traineeDropoutRate = calculateTraineeDropoutRate(data.members_at_start, data.members_at_end)
      kriValues.trainerDropoutRate = calculateTrainerDropoutRate(data.bros_at_start, data.bros_at_end)
      kriValues.curriculumRelevanceComplaintRate = calculateCurriculumRelevanceComplaintRate(0, data.members_at_end)
      kriValues.lowKnowledgeRetentionRate = calculateLowKnowledgeRetentionRate(data.members_applying_loans, data.members_at_end)
    }

    // KRI definitions
    const kris = [
      {
        id: "fraud-incident-rate",
        name: "Fraud Incident Rate",
        description: "Percentage of fraudulent incidents among members",
        value: kriValues.fraudIncidentRate,
      },
      {
        id: "trust-erosion",
        name: "Trust Erosion in MFIs",
        description: "Rate of trust erosion within microfinance institutions",
        value: kriValues.trustErosion,
      },
      {
        id: "members-loan-cost",
        name: "Members Loan Cost",
        description: "Average loan cost for members",
        value: kriValues.membersLoanCost,
      },
      {
        id: "hand-in-hand-loan-cost",
        name: "Hand in Hand Loan Cost",
        description: "Reference loan cost standard",
        value: kriValues.handInHandLoanCost,
      },
      {
        id: "mfi-loan-service-cost",
        name: "MFI Loan Service Cost",
        description: "Overall MFI loan service cost percentage",
        value: kriValues.mfiLoanServiceCost,
      },
      {
        id: "documentation-delay-rate",
        name: "Documentation Delay Rate",
        description: "Rate of documentation delays in loan processing",
        value: kriValues.documentationDelayRate,
      },
      {
        id: "gender-based-barrier-rate",
        name: "Gender-Based Barrier Rate",
        description: "Rate of gender-based barriers to financial inclusion",
        value: kriValues.genderBasedBarrierRate,
      },
      {
        id: "family-community-barrier-rate",
        name: "Family and Community Barrier Rate",
        description: "Rate of family and community barriers",
        value: kriValues.familyAndCommunityBarrierRate,
      },
      {
        id: "trainee-dropout-rate",
        name: "Trainee Dropout Rate",
        description: "Percentage of trainees who drop out",
        value: kriValues.traineeDropoutRate,
      },
      {
        id: "trainer-dropout-rate",
        name: "Trainer Dropout Rate",
        description: "Percentage of trainers who drop out",
        value: kriValues.trainerDropoutRate,
      },
      {
        id: "curriculum-relevance-complaint-rate",
        name: "Curriculum Relevance Complaint Rate",
        description: "Rate of complaints about curriculum relevance",
        value: kriValues.curriculumRelevanceComplaintRate,
      },
      {
        id: "low-knowledge-retention-rate",
        name: "Low Knowledge Retention Rate",
        description: "Rate of low knowledge retention among members",
        value: kriValues.lowKnowledgeRetentionRate,
      },
    ]

    // Calculate main composite score (average of all KRIs)
    const mainScore = kris.length > 0 ? kris.reduce((sum, kri) => sum + kri.value, 0) / kris.length : 0

    // Sub-factors data
    const subFactors = [
      { id: "income-level", name: "Income Level", value: 0, weight: 0.15 },
      { id: "distance", name: "Distance", value: 0, weight: 0.12 },
      { id: "trust", name: "Trust", value: 0, weight: 0.18 },
      { id: "costs", name: "Costs", value: 0, weight: 0.20 },
      { id: "registration", name: "Registration", value: 0, weight: 0.10 },
      { id: "social-cultural", name: "Social and Cultural Factors", value: 0, weight: 0.15 },
      { id: "financial-literacy", name: "Financial Literacy", value: 0, weight: 0.10 },
    ]

    console.log("[v0] Barriers KRI data calculated successfully")

    return {
      mainScore,
      kris,
      subFactors,
    }
  } catch (error: any) {
    console.error("[v0] Error in getBarriersKRIData:", error)
    // Return empty data on error
    return {
      mainScore: 0,
      kris: [],
      subFactors: [],
    }
  }
}

export async function fetchBarriersChartData() {
  try {
    console.log("[v0] Fetching barriers chart data from admin client")

    // Fetch barriers data with all KRI values
    const { data: barriersData, error: barriersError } = await supabaseAdmin.from("Barriers").select(`
        id,
        "Project ID",
        "Branch ID",
        "KRI: FRAUD INCIDENT RATE_Value",
        "KRI: TRUST EROSION IN MFIs_Value",
        "KRI: MEMBERS LOAN COST_Value",
        "KRI: HAND IN HAND LOAN COST_Value",
        "KRI: MFI LOAN SERVICE COST_Value",
        "KRI: DOCUMENTATION DELAY RATE_Value",
        "KRI: GENDER BASED BARRIER RATE_Value",
        "KRI: FAMILY AND COMMUNITY BARRIER RATE_Value",
        "KRI: TRAINEE DROPOUT RATE_Value",
        "KRI: TRAINER DROPOUT RATE_Value",
        "KRI: CURRICULUM RELEVANCE COMPLAINT RATE_Value",
        "KRI: LOW KNOWLEDGE RETENTION RATE_Value",
        "Barriers_Actual_Data"
      `)

    if (barriersError) {
      console.error("[v0] Error fetching barriers data:", barriersError)
      throw barriersError
    }

    // Fetch all projects
    const { data: projectsData, error: projectsError } = await supabaseAdmin.from("projects").select("id, name")

    if (projectsError) {
      console.error("[v0] Error fetching projects:", projectsError)
      throw projectsError
    }

    // Fetch all branches
    const { data: branchesData, error: branchesError } = await supabaseAdmin.from("branches").select("id, name")

    if (branchesError) {
      console.error("[v0] Error fetching branches:", branchesError)
      throw branchesError
    }

    console.log("[v0] Barriers data fetched successfully:", barriersData?.length || 0, "records")

    return {
      success: true,
      barriersData: barriersData || [],
      projects: projectsData || [],
      branches: branchesData || [],
    }
  } catch (error: any) {
    console.error("[v0] Error in fetchBarriersChartData:", error)
    return {
      success: false,
      error: error?.message || "Failed to fetch barriers chart data",
      barriersData: [],
      projects: [],
      branches: [],
    }
  }
}

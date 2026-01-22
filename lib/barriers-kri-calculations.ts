"use server"

/**
 * BARRIERS KRI Calculation Engine
 * Calculates all 12 KRI (Key Risk Indicators) values from branch_report data
 * Returns 0 when dividing by zero instead of returning NaN or null
 */

export interface BranchReportData {
  money_fraud?: number
  members_at_end?: number
  trust_erosion?: number
  loan_cost_high?: number
  members_applying_loans?: number
  documentation_delay?: number
  members_at_start?: number
  bros_at_start?: number
  bros_at_end?: number
  [key: string]: any
}

export interface BarriersKRIValues {
  kriFraudIncidentRateValue: number
  kriTrustErosionValue: number
  kriMembersLoanCostValue: number
  kriHandInHandLoanCostValue: number
  kriMFILoanServiceCostValue: number
  kriDocumentationDelayRateValue: number
  kriGenderBasedBarrierRateValue: number
  kriFamilyAndCommunityBarrierRateValue: number
  kriTraineeDropoutRateValue: number
  kriTrainerDropoutRateValue: number
  kriCurriculumRelevanceComplaintRateValue: number
  kriLowKnowledgeRetentionRateValue: number
}

/**
 * Safe division function - returns 0 if dividing by zero, rounds to 2 decimal places
 */
function safeDivide(numerator = 0, denominator = 0): number {
  if (denominator === 0 || !denominator) {
    return 0
  }
  const result = numerator / denominator
  return isNaN(result) ? 0 : Math.round(result * 100) / 100
}

/**
 * Calculate Fraud Incident Rate
 * Formula: money_fraud ÷ members_at_end
 */
export async function calculateFraudIncidentRate(branchData: BranchReportData): Promise<number> {
  const numerator = branchData.money_fraud || 0
  const denominator = branchData.members_at_end || 0
  return safeDivide(numerator, denominator)
}

/**
 * Calculate Trust Erosion in MFIs
 * Formula: trust_erosion ÷ members_at_end
 */
export async function calculateTrustErosion(branchData: BranchReportData): Promise<number> {
  const numerator = branchData.trust_erosion || 0
  const denominator = branchData.members_at_end || 0
  return safeDivide(numerator, denominator)
}

/**
 * Calculate Members Loan Cost
 * Formula: loan_cost_high ÷ members_applying_loans
 */
export async function calculateMembersLoanCost(branchData: BranchReportData): Promise<number> {
  const numerator = branchData.loan_cost_high || 0
  const denominator = branchData.members_applying_loans || 0
  return safeDivide(numerator, denominator)
}

/**
 * Calculate Hand In Hand Loan Cost
 * Formula: 100 ÷ 100 (always returns 1.0)
 */
export async function calculateHandInHandLoanCost(): Promise<number> {
  return 1.0
}

/**
 * Calculate MFI Loan Service Cost
 * Formula: 100% (always returns 1.0)
 */
export async function calculateMFILoanServiceCost(): Promise<number> {
  return 1.0
}

/**
 * Calculate Documentation Delay Rate
 * Formula: documentation_delay ÷ members_applying_loans
 */
export async function calculateDocumentationDelayRate(branchData: BranchReportData): Promise<number> {
  const numerator = branchData.documentation_delay || 0
  const denominator = branchData.members_applying_loans || 0
  return safeDivide(numerator, denominator)
}

/**
 * Calculate Gender Based Barrier Rate
 * Formula: 0 ÷ members_at_end (always returns 0 as per specification)
 */
export async function calculateGenderBasedBarrierRate(): Promise<number> {
  return 0
}

/**
 * Calculate Family and Community Barrier Rate
 * Formula: 0 ÷ members_at_end (always returns 0 as per specification)
 */
export async function calculateFamilyAndCommunityBarrierRate(): Promise<number> {
  return 0
}

/**
 * Calculate Trainee Dropout Rate
 * Formula: (members_at_start - members_at_end) ÷ members_at_start
 */
export async function calculateTraineeDropoutRate(branchData: BranchReportData): Promise<number> {
  const numerator = (branchData.members_at_start || 0) - (branchData.members_at_end || 0)
  const denominator = branchData.members_at_start || 0
  return safeDivide(numerator, denominator)
}

/**
 * Calculate Trainer Dropout Rate
 * Formula: (bros_at_start - bros_at_end) ÷ bros_at_start
 */
export async function calculateTrainerDropoutRate(branchData: BranchReportData): Promise<number> {
  const numerator = (branchData.bros_at_start || 0) - (branchData.bros_at_end || 0)
  const denominator = branchData.bros_at_start || 0
  return safeDivide(numerator, denominator)
}

/**
 * Calculate Curriculum Relevance Complaint Rate
 * Formula: 0 ÷ members_at_end (always returns 0 as per specification)
 */
export async function calculateCurriculumRelevanceComplaintRate(): Promise<number> {
  return 0
}

/**
 * Calculate Low Knowledge Retention Rate
 * Formula: 1 - (members_applying_loans ÷ members_at_end)
 */
export async function calculateLowKnowledgeRetentionRate(branchData: BranchReportData): Promise<number> {
  const membersApplying = branchData.members_applying_loans || 0
  const membersAtEnd = branchData.members_at_end || 0
  const rate = safeDivide(membersApplying, membersAtEnd)
  return Math.round((1 - rate) * 100) / 100
}

/**
 * Calculate all Barriers KRI values at once
 * Takes branch_report data and returns all 12 KRI values
 */
export async function calculateAllBarriersKRIValues(branchData: BranchReportData): Promise<BarriersKRIValues> {
  return {
    kriFraudIncidentRateValue: await calculateFraudIncidentRate(branchData),
    kriTrustErosionValue: await calculateTrustErosion(branchData),
    kriMembersLoanCostValue: await calculateMembersLoanCost(branchData),
    kriHandInHandLoanCostValue: await calculateHandInHandLoanCost(),
    kriMFILoanServiceCostValue: await calculateMFILoanServiceCost(),
    kriDocumentationDelayRateValue: await calculateDocumentationDelayRate(branchData),
    kriGenderBasedBarrierRateValue: await calculateGenderBasedBarrierRate(),
    kriFamilyAndCommunityBarrierRateValue: await calculateFamilyAndCommunityBarrierRate(),
    kriTraineeDropoutRateValue: await calculateTraineeDropoutRate(branchData),
    kriTrainerDropoutRateValue: await calculateTrainerDropoutRate(branchData),
    kriCurriculumRelevanceComplaintRateValue: await calculateCurriculumRelevanceComplaintRate(),
    kriLowKnowledgeRetentionRateValue: await calculateLowKnowledgeRetentionRate(branchData),
  }
}

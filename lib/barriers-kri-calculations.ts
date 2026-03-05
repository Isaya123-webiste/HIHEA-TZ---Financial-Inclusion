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
 * Calculate Sub Factor: Income Level
 * Based on members with bank accounts vs total members
 */
export async function calculateSubFactorIncomeLevel(branchData: BranchReportData): Promise<number> {
  const numerator = branchData.members_bank_account || 0
  const denominator = branchData.members_at_end || 0
  return safeDivide(numerator, denominator)
}

/**
 * Calculate Sub Factor: Distance
 * Based on number of agent locations available
 */
export async function calculateSubFactorDistance(branchData: BranchReportData): Promise<number> {
  // This would typically be calculated from geographic data
  // For now, assuming higher number of agents means better accessibility (lower distance barrier)
  const agentCount = branchData.agents || 0
  return Math.min(agentCount / 100, 1) // Normalize to 0-1 range
}

/**
 * Calculate Sub Factor: Trust
 * Inverse of trust erosion rate (lower erosion = higher trust)
 */
export async function calculateSubFactorTrust(branchData: BranchReportData): Promise<number> {
  const trustErosionRate = await calculateTrustErosion(branchData)
  return Math.max(0, 1 - trustErosionRate) // Return 1 - erosion rate
}

/**
 * Calculate Sub Factor: Costs
 * Based on loan cost burden relative to loan amount
 */
export async function calculateSubFactorCosts(branchData: BranchReportData): Promise<number> {
  const membersLoanCost = await calculateMembersLoanCost(branchData)
  // Lower cost = higher sub-factor (less barrier)
  return Math.max(0, 1 - membersLoanCost / 100)
}

/**
 * Calculate Sub Factor: Registration
 * Based on documentation efficiency (inverse of documentation delay)
 */
export async function calculateSubFactorRegistration(branchData: BranchReportData): Promise<number> {
  const documentationDelayRate = await calculateDocumentationDelayRate(branchData)
  return Math.max(0, 1 - documentationDelayRate)
}

/**
 * Calculate Sub Factor: Social and Cultural Factors
 * Based on family and community barriers
 */
export async function calculateSubFactorSocialCultural(branchData: BranchReportData): Promise<number> {
  const communityBarrierRate = await calculateFamilyAndCommunityBarrierRate()
  return Math.max(0, 1 - communityBarrierRate)
}

/**
 * Calculate Sub Factor: Financial Literacy
 * Inverse of low knowledge retention rate
 */
export async function calculateSubFactorFinancialLiteracy(branchData: BranchReportData): Promise<number> {
  const lowRetentionRate = await calculateLowKnowledgeRetentionRate(branchData)
  return Math.max(0, 1 - lowRetentionRate)
}

/**
 * Calculate KPI: Value Chain Diversification Rate
 * Based on number of different credit sources
 */
export async function calculateKPIValueChainDiversification(branchData: BranchReportData): Promise<number> {
  const creditSources = branchData.credit_sources || 0
  return Math.min(creditSources / 10, 1) // Normalize to 0-1
}

/**
 * Calculate KPI: Startup Level Rate
 * Based on new members being enrolled
 */
export async function calculateKPIStartupLevelRate(branchData: BranchReportData): Promise<number> {
  const newMembers = (branchData.members_at_end || 0) - (branchData.members_at_start || 0)
  const denominator = branchData.members_at_start || 1
  return safeDivide(newMembers, denominator)
}

/**
 * Calculate KPI: Acceleration Level Rate
 * Based on loan approval rate
 */
export async function calculateKPIAccelerationLevelRate(branchData: BranchReportData): Promise<number> {
  const membersApplying = branchData.members_applying_loans || 0
  const membersApproved = branchData.members_received_loans || 0
  return safeDivide(membersApproved, membersApplying)
}

/**
 * Calculate main Barriers Value (composite score)
 * Weighted average of all sub-factors
 */
export async function calculateBarriersMainValue(branchData: BranchReportData): Promise<number> {
  const subFactors = {
    incomeLevel: await calculateSubFactorIncomeLevel(branchData),
    distance: await calculateSubFactorDistance(branchData),
    trust: await calculateSubFactorTrust(branchData),
    costs: await calculateSubFactorCosts(branchData),
    registration: await calculateSubFactorRegistration(branchData),
    socialCultural: await calculateSubFactorSocialCultural(branchData),
    financialLiteracy: await calculateSubFactorFinancialLiteracy(branchData),
  }

  // Weighted average
  const weights = {
    incomeLevel: 0.15,
    distance: 0.12,
    trust: 0.18,
    costs: 0.20,
    registration: 0.10,
    socialCultural: 0.15,
    financialLiteracy: 0.10,
  }

  const totalScore =
    subFactors.incomeLevel * weights.incomeLevel +
    subFactors.distance * weights.distance +
    subFactors.trust * weights.trust +
    subFactors.costs * weights.costs +
    subFactors.registration * weights.registration +
    subFactors.socialCultural * weights.socialCultural +
    subFactors.financialLiteracy * weights.financialLiteracy

  return Math.round(totalScore * 100) / 100
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

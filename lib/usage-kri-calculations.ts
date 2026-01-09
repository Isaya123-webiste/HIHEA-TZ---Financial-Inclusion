"use server"

/**
 * KRI Calculation Engine
 * Calculates all 7 KRI (Key Risk Indicators) values from branch_report data
 * Returns 0 when dividing by zero instead of returning NaN or null
 */

export interface BranchReportData {
  inactive_accounts?: number
  members_at_end?: number
  loan_dropout?: number
  members_applying_loans?: number
  members_received_loans?: number
  loan_delinquency?: number
  loan_default?: number
  [key: string]: any
}

export interface KRIValues {
  kriSlowAccountRateValue: number
  kriChurnRateValue: number
  kriDisbandmentRateValue: number
  kriLoanApplicationDropoutRateValue: number
  kriLoanRejectionRateValue: number
  kriLoanDelinquencyRateValue: number
  kriLoanDefaultRateValue: number
}

/**
 * Safe division function - returns 0 if dividing by zero
 */
function safeDivide(numerator = 0, denominator = 0): number {
  if (denominator === 0 || !denominator) {
    return 0
  }
  const result = numerator / denominator
  return isNaN(result) ? 0 : result
}

/**
 * Calculate Slow Account Rate
 * Formula: 0 ÷ members_at_end
 * Note: Formula shows 0 as numerator, but based on context this might need to be inactive_accounts
 * Currently implementing as per provided formula
 */
export async function calculateSlowAccountRate(branchData: BranchReportData): Promise<number> {
  const numerator = 0
  const denominator = branchData.members_at_end || 0
  return safeDivide(numerator, denominator)
}

/**
 * Calculate Churn Rate
 * Formula: inactive_accounts ÷ members_at_end
 */
export async function calculateChurnRate(branchData: BranchReportData): Promise<number> {
  const numerator = branchData.inactive_accounts || 0
  const denominator = branchData.members_at_end || 0
  return safeDivide(numerator, denominator)
}

/**
 * Calculate Disbandment Rate
 * Formula: loan_dropout ÷ members_at_end
 */
export async function calculateDisbandmentRate(branchData: BranchReportData): Promise<number> {
  const numerator = branchData.loan_dropout || 0
  const denominator = branchData.members_at_end || 0
  return safeDivide(numerator, denominator)
}

/**
 * Calculate Loan Application Dropout Rate
 * Formula: loan_dropout ÷ members_applying_loans
 */
export async function calculateLoanApplicationDropoutRate(branchData: BranchReportData): Promise<number> {
  const numerator = branchData.loan_dropout || 0
  const denominator = branchData.members_applying_loans || 0
  return safeDivide(numerator, denominator)
}

/**
 * Calculate Loan Rejection Rate
 * Formula: (members_applying_loans - members_received_loans - loan_dropout) ÷ members_applying_loans
 */
export async function calculateLoanRejectionRate(branchData: BranchReportData): Promise<number> {
  const membersApplying = branchData.members_applying_loans || 0
  const membersReceived = branchData.members_received_loans || 0
  const dropout = branchData.loan_dropout || 0

  const numerator = membersApplying - membersReceived - dropout
  const denominator = membersApplying

  return safeDivide(numerator, denominator)
}

/**
 * Calculate Loan Delinquency Rate
 * Formula: loan_delinquency ÷ members_received_loans
 */
export async function calculateLoanDelinquencyRate(branchData: BranchReportData): Promise<number> {
  const numerator = branchData.loan_delinquency || 0
  const denominator = branchData.members_received_loans || 0
  return safeDivide(numerator, denominator)
}

/**
 * Calculate Loan Default Rate
 * Formula: loan_default ÷ members_received_loans
 */
export async function calculateLoanDefaultRate(branchData: BranchReportData): Promise<number> {
  const numerator = branchData.loan_default || 0
  const denominator = branchData.members_received_loans || 0
  return safeDivide(numerator, denominator)
}

/**
 * Calculate all KRI values at once
 * Takes branch_report data and returns all 7 KRI values
 */
export async function calculateAllKRIValues(branchData: BranchReportData): Promise<KRIValues> {
  return {
    kriSlowAccountRateValue: await calculateSlowAccountRate(branchData),
    kriChurnRateValue: await calculateChurnRate(branchData),
    kriDisbandmentRateValue: await calculateDisbandmentRate(branchData),
    kriLoanApplicationDropoutRateValue: await calculateLoanApplicationDropoutRate(branchData),
    kriLoanRejectionRateValue: await calculateLoanRejectionRate(branchData),
    kriLoanDelinquencyRateValue: await calculateLoanDelinquencyRate(branchData),
    kriLoanDefaultRateValue: await calculateLoanDefaultRate(branchData),
  }
}

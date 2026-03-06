"use server"

/**
 * Access KRI Calculation Engine
 * Calculates Access sub-factor values from branch_report data
 * Returns 0 when dividing by zero instead of returning NaN or null
 */

export interface BranchReportData {
  groups_bank_account?: number
  members_bank_account?: number
  num_insurers?: number
  members_insurance?: number
  number_of_groups?: number
  members_at_start?: number
  members_at_end?: number
  [key: string]: any
}

export interface AccessKRIValues {
  subFactorBankBranchesValue: number
  subFactorAgentsValue: number
  subFactorATMsOnlineServicesValue: number
  subFactorInsurersAgentsValue: number
}

/**
 * Safe division function - returns 0 if dividing by zero, rounds to 4 decimal places for percentages
 */
function safeDivide(numerator = 0, denominator = 0): number {
  if (denominator === 0 || !denominator) {
    return 0
  }
  const result = numerator / denominator
  return isNaN(result) ? 0 : Math.round(result * 10000) / 10000
}

/**
 * Calculate Bank Branches Sub-Factor
 * Formula: members_bank_account ÷ members_at_end
 * Represents the percentage of members with bank accounts
 */
export async function calculateBankBranchesSubFactor(branchData: BranchReportData): Promise<number> {
  const numerator = branchData.members_bank_account || 0
  const denominator = branchData.members_at_end || 0
  return safeDivide(numerator, denominator)
}

/**
 * Calculate Agents Sub-Factor
 * Formula: groups_bank_account ÷ number_of_groups
 * Represents the percentage of groups with bank accounts
 */
export async function calculateAgentsSubFactor(branchData: BranchReportData): Promise<number> {
  const numerator = branchData.groups_bank_account || 0
  const denominator = branchData.number_of_groups || 0
  return safeDivide(numerator, denominator)
}

/**
 * Calculate ATMs and Online Services Sub-Factor
 * Formula: 0 (placeholder - requires additional data from forms)
 * This would be populated when specific ATM/online service data is captured
 */
export async function calculateATMsOnlineServicesSubFactor(branchData: BranchReportData): Promise<number> {
  return 0
}

/**
 * Calculate Insurers and Agents Sub-Factor
 * Formula: members_insurance ÷ members_at_end
 * Represents the percentage of members with insurance coverage
 */
export async function calculateInsurersAgentsSubFactor(branchData: BranchReportData): Promise<number> {
  const numerator = branchData.members_insurance || 0
  const denominator = branchData.members_at_end || 0
  return safeDivide(numerator, denominator)
}

/**
 * Calculate all Access sub-factor values at once
 * Takes branch_report data and returns all 4 sub-factor values
 */
export async function calculateAllAccessKRIValues(branchData: BranchReportData): Promise<AccessKRIValues> {
  return {
    subFactorBankBranchesValue: await calculateBankBranchesSubFactor(branchData),
    subFactorAgentsValue: await calculateAgentsSubFactor(branchData),
    subFactorATMsOnlineServicesValue: await calculateATMsOnlineServicesSubFactor(branchData),
    subFactorInsurersAgentsValue: await calculateInsurersAgentsSubFactor(branchData),
  }
}

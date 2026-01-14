"use server"

export interface BranchReportDataForKPI {
  members_bank_account?: number
  members_at_end?: number
  inactive_accounts?: number
  members_received_loans?: number
  num_mfis?: number
  members_complaining_delay?: number
  members_applying_loans?: number
  borrowed_groups?: number
  number_of_groups?: number
  loan_default?: number
  [key: string]: any
}

export interface KRIWeights {
  slowAccountRateWeight: number
  churnRateWeight: number
  disbandmentRateWeight: number
  loanApplicationDropoutRateWeight: number
  loanRejectionRateWeight: number
  loanDelinquencyRateWeight: number
  loanDefaultRateWeight: number
}

export interface KRIValues {
  slowAccountRateValue: number
  churnRateValue: number
  disbandmentRateValue: number
  loanApplicationDropoutRateValue: number
  loanRejectionRateValue: number
  loanDelinquencyRateValue: number
  loanDefaultRateValue: number
}

export interface KPIValues {
  rateOfMembersHavingAccountsValue: number
  savingsParticipationRateValue: number
  savingsDiversificationRateValue: number
  loanUptakeRateValue: number
  loanDiversificationRateValue: number
  disbursementLeadTimeValue: number
  concentrationRateValue: number
  loanRepaymentRateValue: number
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
 * Fetch KRI weights from usage_weights_config table
 */
async function fetchKRIWeights(supabaseAdmin: any): Promise<KRIWeights> {
  const { data, error } = await supabaseAdmin
    .from("usage_weights_config")
    .select("metric_key, weight_value")
    .in("metric_key", [
      "SLOW_ACCOUNT_RATE",
      "CHURN_RATE",
      "DISBANDMENT_RATE",
      "LOAN_APPLICATION_DROPOUT_RATE",
      "LOAN_REJECTION_RATE",
      "LOAN_DELINQUENCY_RATE",
      "LOAN_DEFAULT_RATE",
    ])

  if (error) {
    console.error("[v0] Error fetching KRI weights:", error)
    return {
      slowAccountRateWeight: 0.14,
      churnRateWeight: 0.14,
      disbandmentRateWeight: 0.14,
      loanApplicationDropoutRateWeight: 0.14,
      loanRejectionRateWeight: 0.14,
      loanDelinquencyRateWeight: 0.14,
      loanDefaultRateWeight: 0.14,
    }
  }

  const weights: { [key: string]: number } = {}
  data?.forEach((row: any) => {
    weights[row.metric_key] = row.weight_value || 0
  })

  return {
    slowAccountRateWeight: weights["SLOW_ACCOUNT_RATE"] || 0.14,
    churnRateWeight: weights["CHURN_RATE"] || 0.14,
    disbandmentRateWeight: weights["DISBANDMENT_RATE"] || 0.14,
    loanApplicationDropoutRateWeight: weights["LOAN_APPLICATION_DROPOUT_RATE"] || 0.14,
    loanRejectionRateWeight: weights["LOAN_REJECTION_RATE"] || 0.14,
    loanDelinquencyRateWeight: weights["LOAN_DELINQUENCY_RATE"] || 0.14,
    loanDefaultRateWeight: weights["LOAN_DEFAULT_RATE"] || 0.14,
  }
}

/**
 * Calculate all 8 KPI values using exact formulas
 * Added KPI calculations for: RATE OF MEMBERS HAVING ACCOUNTS, SAVINGS PARTICIPATION RATE,
 * SAVINGS DIVERSIFICATION RATE, LOAN UPTAKE RATE, LOAN DIVERSIFICATION RATE, DISBURSEMENT LEAD TIME,
 * CONCENTRATION RATE, and LOAN REPAYMENT RATE
 */
export async function calculateAllKPIValues(
  branchData: BranchReportDataForKPI,
  kriValues: KRIValues,
  supabaseAdmin: any,
): Promise<KPIValues> {
  // Fetch KRI weights for calculations
  const weights = await fetchKRIWeights(supabaseAdmin)

  // 1. RATE OF MEMBERS HAVING ACCOUNTS = members_bank_account ÷ members_at_end *
  //    (((1-SLOW ACCOUNT RATE_value) * SLOW ACCOUNT RATE_Weight) + ((1-CHURN RATE_value) * CHURN RATE_Weight))
  const rateOfMembersHavingAccounts =
    safeDivide(branchData.members_bank_account || 0, branchData.members_at_end || 0) *
    ((1 - kriValues.slowAccountRateValue) * weights.slowAccountRateWeight +
      (1 - kriValues.churnRateValue) * weights.churnRateWeight)

  // 2. SAVINGS PARTICIPATION RATE = (members_bank_account - inactive_accounts) ÷ members_at_end *
  //    ((1-DISBANDMENT RATE_Value) * DISBANDMENT RATE_Weight)
  const savingsParticipationRate =
    safeDivide(
      (branchData.members_bank_account || 0) - (branchData.inactive_accounts || 0),
      branchData.members_at_end || 0,
    ) *
    ((1 - kriValues.disbandmentRateValue) * weights.disbandmentRateWeight)

  // 3. SAVINGS DIVERSIFICATION RATE = 100% (by Default, no formula)
  const savingsDiversificationRate = 1.0

  // 4. LOAN UPTAKE RATE = members_received_loans ÷ members_at_end *
  //    (((1-LOAN APPLICATION DROPOUT RATE_Value) * LOAN APPLICATION DROPOUT RATE_Weight) +
  //     ((1-LOAN REJECTION RATE_Value) * LOAN REJECTION RATE_Weight))
  const loanUptakeRate =
    safeDivide(branchData.members_received_loans || 0, branchData.members_at_end || 0) *
    ((1 - kriValues.loanApplicationDropoutRateValue) * weights.loanApplicationDropoutRateWeight +
      (1 - kriValues.loanRejectionRateValue) * weights.loanRejectionRateWeight)

  // 5. LOAN DIVERSIFICATION RATE = num_mfis ÷ 3 (3 MFIs are normally required in a targeted area)
  const loanDiversificationRate = safeDivide(branchData.num_mfis || 0, 3)

  // 6. DISBURSEMENT LEAD TIME = members_complaining_delay ÷ members_applying_loans
  const disbursementLeadTime = safeDivide(
    branchData.members_complaining_delay || 0,
    branchData.members_applying_loans || 0,
  )

  // 7. CONCENTRATION RATE = borrowed_groups ÷ number_of_groups
  const concentrationRate = safeDivide(branchData.borrowed_groups || 0, branchData.number_of_groups || 0)

  // 8. LOAN REPAYMENT RATE = (members_received_loans - loan_default) ÷ members_received_loans *
  //    (((1-LOAN DELIQUENCY RATE_Value)*LOAN DELIQUENCY RATE_Weight) +
  //     ((1-LOAN DEFAULT RATE_Value) * LOAN DEFAULT RATE_Weight))
  const loanRepaymentRate =
    safeDivide(
      (branchData.members_received_loans || 0) - (branchData.loan_default || 0),
      branchData.members_received_loans || 0,
    ) *
    ((1 - kriValues.loanDelinquencyRateValue) * weights.loanDelinquencyRateWeight +
      (1 - kriValues.loanDefaultRateValue) * weights.loanDefaultRateWeight)

  return {
    rateOfMembersHavingAccountsValue: Math.round(rateOfMembersHavingAccounts * 100) / 100,
    savingsParticipationRateValue: Math.round(savingsParticipationRate * 100) / 100,
    savingsDiversificationRateValue: Math.round(savingsDiversificationRate * 100) / 100,
    loanUptakeRateValue: Math.round(loanUptakeRate * 100) / 100,
    loanDiversificationRateValue: Math.round(loanDiversificationRate * 100) / 100,
    disbursementLeadTimeValue: Math.round(disbursementLeadTime * 100) / 100,
    concentrationRateValue: Math.round(concentrationRate * 100) / 100,
    loanRepaymentRateValue: Math.round(loanRepaymentRate * 100) / 100,
  }
}

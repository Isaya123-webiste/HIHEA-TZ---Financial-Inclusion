-- Fix all incorrect KRI values in Usage table using correct formulas
-- Your Formulas:
-- Slow Account Rate = 0 ÷ members_at_end
-- Churn Rate = inactive_accounts ÷ members_at_end
-- Disbandment Rate = loan_dropout ÷ members_at_end
-- Loan Application Dropout Rate = loan_dropout ÷ members_applying_loans
-- Loan Rejection Rate = (members_applying_loans - members_received_loans - loan_dropout) ÷ members_applying_loans
-- Loan Delinquency Rate = loan_delinquency ÷ members_received_loans
-- Loan Default Rate = loan_default ÷ members_received_loans

UPDATE "Usage"
SET
  "KRI: SLOW ACCOUNT RATE_Value" = 0,
  "KRI: CHURN RATE_Value" = CASE 
    WHEN br.members_at_end = 0 OR br.members_at_end IS NULL THEN 0 
    ELSE ROUND((br.inactive_accounts::numeric / br.members_at_end), 2) 
  END,
  "KRI: DISBANDMENT RATE_Value" = CASE 
    WHEN br.members_at_end = 0 OR br.members_at_end IS NULL THEN 0 
    ELSE ROUND((br.loan_dropout::numeric / br.members_at_end), 2) 
  END,
  "KRI: LOAN APPLICATION DROPOUT RATE_Value" = CASE 
    WHEN br.members_applying_loans = 0 OR br.members_applying_loans IS NULL THEN 0 
    ELSE ROUND((br.loan_dropout::numeric / br.members_applying_loans), 2) 
  END,
  "KRI: LOAN REJECTION RATE_Value" = CASE 
    WHEN br.members_applying_loans = 0 OR br.members_applying_loans IS NULL THEN 0 
    ELSE ROUND(((br.members_applying_loans - br.members_received_loans - br.loan_dropout)::numeric / br.members_applying_loans), 2) 
  END,
  "KRI: LOAN DELIQUENCY RATE_Value" = CASE 
    WHEN br.members_received_loans = 0 OR br.members_received_loans IS NULL THEN 0 
    ELSE ROUND((br.loan_delinquency::numeric / br.members_received_loans), 2) 
  END,
  "KRI: LOAN DEFAULT RATE_Value" = CASE 
    WHEN br.members_received_loans = 0 OR br.members_received_loans IS NULL THEN 0 
    ELSE ROUND((br.loan_default::numeric / br.members_received_loans), 2) 
  END
FROM branch_reports br
WHERE "Usage"."Project ID" = br.project_id 
  AND "Usage"."Branch ID" = br.branch_id;

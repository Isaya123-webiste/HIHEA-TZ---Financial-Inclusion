-- Create or replace function to recalculate KRI values
CREATE OR REPLACE FUNCTION recalculate_kri_values()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert the Usage table with newly calculated KRI values
  INSERT INTO "Usage" (
    "Project ID",
    "Branch ID",
    "KRI: SLOW ACCOUNT RATE_Value",
    "KRI: CHURN RATE_Value",
    "KRI: DISBANDMENT RATE_Value",
    "KRI: LOAN APPLICATION DROPOUT RATE_Value",
    "KRI: LOAN REJECTION RATE_Value",
    "KRI: LOAN DELIQUENCY RATE_Value",
    "KRI: LOAN DEFAULT RATE_Value",
    created_at
  ) VALUES (
    NEW.project_id,
    NEW.branch_id,
    0,  -- Slow Account Rate always 0
    ROUND((NEW.inactive_accounts::numeric / NULLIF(NEW.members_at_end, 0))::numeric, 2),
    ROUND((NEW.loan_dropout::numeric / NULLIF(NEW.members_at_end, 0))::numeric, 2),
    ROUND((NEW.loan_dropout::numeric / NULLIF(NEW.members_applying_loans, 0))::numeric, 2),
    ROUND(((NEW.members_applying_loans - NEW.members_received_loans - NEW.loan_dropout)::numeric / NULLIF(NEW.members_applying_loans, 0))::numeric, 2),
    ROUND((NEW.loan_delinquency::numeric / NULLIF(NEW.members_received_loans, 0))::numeric, 2),
    ROUND((NEW.loan_default::numeric / NULLIF(NEW.members_received_loans, 0))::numeric, 2),
    NOW()
  )
  ON CONFLICT ("Project ID", "Branch ID") DO UPDATE SET
    "KRI: SLOW ACCOUNT RATE_Value" = 0,
    "KRI: CHURN RATE_Value" = ROUND((NEW.inactive_accounts::numeric / NULLIF(NEW.members_at_end, 0))::numeric, 2),
    "KRI: DISBANDMENT RATE_Value" = ROUND((NEW.loan_dropout::numeric / NULLIF(NEW.members_at_end, 0))::numeric, 2),
    "KRI: LOAN APPLICATION DROPOUT RATE_Value" = ROUND((NEW.loan_dropout::numeric / NULLIF(NEW.members_applying_loans, 0))::numeric, 2),
    "KRI: LOAN REJECTION RATE_Value" = ROUND(((NEW.members_applying_loans - NEW.members_received_loans - NEW.loan_dropout)::numeric / NULLIF(NEW.members_applying_loans, 0))::numeric, 2),
    "KRI: LOAN DELIQUENCY RATE_Value" = ROUND((NEW.loan_delinquency::numeric / NULLIF(NEW.members_received_loans, 0))::numeric, 2),
    "KRI: LOAN DEFAULT RATE_Value" = ROUND((NEW.loan_default::numeric / NULLIF(NEW.members_received_loans, 0))::numeric, 2);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on INSERT or UPDATE to branch_reports table
DROP TRIGGER IF EXISTS kri_auto_update_trigger ON branch_reports;
CREATE TRIGGER kri_auto_update_trigger
AFTER INSERT OR UPDATE ON branch_reports
FOR EACH ROW
EXECUTE FUNCTION recalculate_kri_values();

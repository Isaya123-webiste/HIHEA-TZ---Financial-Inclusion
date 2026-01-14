-- Create updated trigger that calculates both KRI and KPI values
-- This trigger fires after INSERT or UPDATE on branch_reports and updates the Usage table

-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS kri_auto_update_trigger ON branch_reports;
DROP FUNCTION IF EXISTS update_usage_kri_values();

-- Create function to update both KRI and KPI values in Usage table
CREATE OR REPLACE FUNCTION update_usage_kri_and_kpi_values()
RETURNS TRIGGER AS $$
DECLARE
  v_churn_rate NUMERIC;
  v_disbandment_rate NUMERIC;
  v_loan_app_dropout_rate NUMERIC;
  v_loan_rejection_rate NUMERIC;
  v_loan_delinq_rate NUMERIC;
  v_loan_default_rate NUMERIC;
  
  -- KRI weights (fetch from usage_weights_config)
  v_slow_account_weight NUMERIC;
  v_churn_weight NUMERIC;
  v_disbandment_weight NUMERIC;
  v_loan_app_dropout_weight NUMERIC;
  v_loan_rejection_weight NUMERIC;
  v_loan_delinq_weight NUMERIC;
  v_loan_default_weight NUMERIC;
  
  -- KPI values
  v_rate_members_accounts NUMERIC;
  v_savings_participation NUMERIC;
  v_savings_diversification NUMERIC;
  v_loan_uptake NUMERIC;
  v_loan_diversification NUMERIC;
  v_disbursement_lead_time NUMERIC;
  v_concentration_rate NUMERIC;
  v_loan_repayment NUMERIC;
  
  v_row_count INTEGER;
BEGIN
  -- Calculate KRI Values
  v_churn_rate := CASE 
    WHEN NEW.members_at_end = 0 OR NEW.members_at_end IS NULL THEN 0
    ELSE ROUND((NEW.inactive_accounts::numeric / NEW.members_at_end), 2)
  END;

  v_disbandment_rate := CASE
    WHEN NEW.members_at_end = 0 OR NEW.members_at_end IS NULL THEN 0
    ELSE ROUND((NEW.loan_dropout::numeric / NEW.members_at_end), 2)
  END;

  v_loan_app_dropout_rate := CASE
    WHEN NEW.members_applying_loans = 0 OR NEW.members_applying_loans IS NULL THEN 0
    ELSE ROUND((NEW.loan_dropout::numeric / NEW.members_applying_loans), 2)
  END;

  v_loan_rejection_rate := CASE
    WHEN NEW.members_applying_loans = 0 OR NEW.members_applying_loans IS NULL THEN 0
    ELSE ROUND(((NEW.members_applying_loans - NEW.members_received_loans - NEW.loan_dropout)::numeric / NEW.members_applying_loans), 2)
  END;

  v_loan_delinq_rate := CASE
    WHEN NEW.members_received_loans = 0 OR NEW.members_received_loans IS NULL THEN 0
    ELSE ROUND((NEW.loan_delinquency::numeric / NEW.members_received_loans), 2)
  END;

  v_loan_default_rate := CASE
    WHEN NEW.members_received_loans = 0 OR NEW.members_received_loans IS NULL THEN 0
    ELSE ROUND((NEW.loan_default::numeric / NEW.members_received_loans), 2)
  END;

  -- Fetch KRI weights from usage_weights_config table
  SELECT COALESCE(weight_value, 0.14) INTO v_slow_account_weight FROM usage_weights_config WHERE metric_key = 'SLOW_ACCOUNT_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.14) INTO v_churn_weight FROM usage_weights_config WHERE metric_key = 'CHURN_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.14) INTO v_disbandment_weight FROM usage_weights_config WHERE metric_key = 'DISBANDMENT_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.14) INTO v_loan_app_dropout_weight FROM usage_weights_config WHERE metric_key = 'LOAN_APPLICATION_DROPOUT_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.14) INTO v_loan_rejection_weight FROM usage_weights_config WHERE metric_key = 'LOAN_REJECTION_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.14) INTO v_loan_delinq_weight FROM usage_weights_config WHERE metric_key = 'LOAN_DELINQUENCY_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.14) INTO v_loan_default_weight FROM usage_weights_config WHERE metric_key = 'LOAN_DEFAULT_RATE' LIMIT 1;

  -- Calculate KPI Values using exact formulas
  -- 1. RATE OF MEMBERS HAVING ACCOUNTS
  v_rate_members_accounts := ROUND((COALESCE(NEW.members_bank_account, 0)::numeric / NULLIF(NEW.members_at_end, 0)) * 
    (((1 - v_churn_rate) * v_churn_weight) + ((1 - 0) * v_slow_account_weight)), 2);

  -- 2. SAVINGS PARTICIPATION RATE
  v_savings_participation := ROUND((COALESCE(NEW.members_bank_account - NEW.inactive_accounts, 0)::numeric / NULLIF(NEW.members_at_end, 0)) * 
    ((1 - v_disbandment_rate) * v_disbandment_weight), 2);

  -- 3. SAVINGS DIVERSIFICATION RATE = 1.0 (always)
  v_savings_diversification := 1.0;

  -- 4. LOAN UPTAKE RATE
  v_loan_uptake := ROUND((COALESCE(NEW.members_received_loans, 0)::numeric / NULLIF(NEW.members_at_end, 0)) * 
    (((1 - v_loan_app_dropout_rate) * v_loan_app_dropout_weight) + ((1 - v_loan_rejection_rate) * v_loan_rejection_weight)), 2);

  -- 5. LOAN DIVERSIFICATION RATE
  v_loan_diversification := ROUND(COALESCE(NEW.num_mfis, 0)::numeric / NULLIF(3, 0), 2);

  -- 6. DISBURSEMENT LEAD TIME
  v_disbursement_lead_time := ROUND(COALESCE(NEW.members_complaining_delay, 0)::numeric / NULLIF(NEW.members_applying_loans, 0), 2);

  -- 7. CONCENTRATION RATE
  v_concentration_rate := ROUND(COALESCE(NEW.borrowed_groups, 0)::numeric / NULLIF(NEW.number_of_groups, 0), 2);

  -- 8. LOAN REPAYMENT RATE
  v_loan_repayment := ROUND((COALESCE(NEW.members_received_loans - NEW.loan_default, 0)::numeric / NULLIF(NEW.members_received_loans, 0)) * 
    (((1 - v_loan_delinq_rate) * v_loan_delinq_weight) + ((1 - v_loan_default_rate) * v_loan_default_weight)), 2);

  -- Try to update existing Usage record
  UPDATE "Usage"
  SET
    -- KRI Values
    "KRI: SLOW ACCOUNT RATE_Value" = 0,
    "KRI: CHURN RATE_Value" = v_churn_rate,
    "KRI: DISBANDMENT RATE_Value" = v_disbandment_rate,
    "KRI: LOAN APPLICATION DROPOUT RATE_Value" = v_loan_app_dropout_rate,
    "KRI: LOAN REJECTION RATE_Value" = v_loan_rejection_rate,
    "KRI: LOAN DELIQUENCY RATE_Value" = v_loan_delinq_rate,
    "KRI: LOAN DEFAULT RATE_Value" = v_loan_default_rate,
    -- KPI Values
    "KPI: RATE OF MEMBERS HAVING ACCOUNTS_Value" = v_rate_members_accounts,
    "KPI: SAVINGS PARTICIPATION RATE_Value" = v_savings_participation,
    "KPI: SAVINGS DIVERSIFICATION RATE_Value" = v_savings_diversification,
    "KPI: LOAN UPTAKE RATE_Value" = v_loan_uptake,
    "KPI: LOAN DIVERSIFICATION RATE_Value" = v_loan_diversification,
    "KPI: DISBURSEMENT LEAD TIME_Value" = v_disbursement_lead_time,
    "KPI: CONCENTRATION RATE_Value" = v_concentration_rate,
    "KPI: LOAN REPAYMENT RATE_Value" = v_loan_repayment
  WHERE "Project ID" = NEW.project_id AND "Branch ID" = NEW.branch_id;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;

  -- If no rows were updated, insert a new record
  IF v_row_count = 0 THEN
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
      "KPI: RATE OF MEMBERS HAVING ACCOUNTS_Value",
      "KPI: SAVINGS PARTICIPATION RATE_Value",
      "KPI: SAVINGS DIVERSIFICATION RATE_Value",
      "KPI: LOAN UPTAKE RATE_Value",
      "KPI: LOAN DIVERSIFICATION RATE_Value",
      "KPI: DISBURSEMENT LEAD TIME_Value",
      "KPI: CONCENTRATION RATE_Value",
      "KPI: LOAN REPAYMENT RATE_Value"
    ) VALUES (
      NEW.project_id,
      NEW.branch_id,
      0,
      v_churn_rate,
      v_disbandment_rate,
      v_loan_app_dropout_rate,
      v_loan_rejection_rate,
      v_loan_delinq_rate,
      v_loan_default_rate,
      v_rate_members_accounts,
      v_savings_participation,
      v_savings_diversification,
      v_loan_uptake,
      v_loan_diversification,
      v_disbursement_lead_time,
      v_concentration_rate,
      v_loan_repayment
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER kri_and_kpi_auto_update_trigger
AFTER INSERT OR UPDATE ON branch_reports
FOR EACH ROW
EXECUTE FUNCTION update_usage_kri_and_kpi_values();

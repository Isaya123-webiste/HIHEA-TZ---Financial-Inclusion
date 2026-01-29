-- Create trigger function that calculates all 12 KRI values for Barriers table
-- This trigger fires after INSERT or UPDATE on branch_reports and updates the Barriers table

-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS barriers_kri_auto_update_trigger ON branch_reports;
DROP FUNCTION IF EXISTS update_barriers_kri_values();

-- Create function to update KRI values in Barriers table
CREATE OR REPLACE FUNCTION update_barriers_kri_values()
RETURNS TRIGGER AS $$
DECLARE
  v_fraud_incident_rate NUMERIC;
  v_trust_erosion NUMERIC;
  v_members_loan_cost NUMERIC;
  v_hand_in_hand_loan_cost NUMERIC;
  v_mfi_loan_service_cost NUMERIC;
  v_documentation_delay_rate NUMERIC;
  v_gender_based_barrier_rate NUMERIC;
  v_family_community_barrier_rate NUMERIC;
  v_trainee_dropout_rate NUMERIC;
  v_trainer_dropout_rate NUMERIC;
  v_curriculum_relevance_complaint_rate NUMERIC;
  v_low_knowledge_retention_rate NUMERIC;
  
  -- KRI weights (fetch from barriers_weights_config)
  v_fraud_weight NUMERIC;
  v_trust_weight NUMERIC;
  v_members_cost_weight NUMERIC;
  v_hand_in_hand_weight NUMERIC;
  v_mfi_cost_weight NUMERIC;
  v_doc_delay_weight NUMERIC;
  v_gender_weight NUMERIC;
  v_family_weight NUMERIC;
  v_trainee_weight NUMERIC;
  v_trainer_weight NUMERIC;
  v_curriculum_weight NUMERIC;
  v_knowledge_weight NUMERIC;
  
  v_row_count INTEGER;
BEGIN
  -- Calculate all 12 KRI Values using provided formulas
  -- 1. FRAUD INCIDENT RATE = money_fraud ÷ members_at_end
  v_fraud_incident_rate := CASE 
    WHEN NEW.members_at_end = 0 OR NEW.members_at_end IS NULL THEN 0
    ELSE ROUND((COALESCE(NEW.money_fraud, 0)::numeric / NEW.members_at_end::numeric) * 100, 2)
  END;

  -- 2. TRUST EROSION IN MFIs = trust_erosion ÷ members_at_end
  v_trust_erosion := CASE
    WHEN NEW.members_at_end = 0 OR NEW.members_at_end IS NULL THEN 0
    ELSE ROUND((COALESCE(NULLIF(NEW.trust_erosion, '')::numeric, 0) / NEW.members_at_end::numeric) * 100, 2)
  END;

  -- 3. MEMBERS LOAN COST = loan_cost_high ÷ members_applying_loans
  v_members_loan_cost := CASE
    WHEN NEW.members_applying_loans = 0 OR NEW.members_applying_loans IS NULL THEN 0
    ELSE ROUND((COALESCE(NEW.loan_cost_high, 0)::numeric / NEW.members_applying_loans::numeric) * 100, 2)
  END;

  -- 4. HAND IN HAND LOAN COST = 100 ÷ 100 = 1.0 (constant)
  v_hand_in_hand_loan_cost := 1.0;

  -- 5. MFI LOAN SERVICE COST = 100% (constant)
  v_mfi_loan_service_cost := 100.0;

  -- 6. DOCUMENTATION DELAY RATE = documentation_delay ÷ members_applying_loans
  v_documentation_delay_rate := CASE
    WHEN NEW.members_applying_loans = 0 OR NEW.members_applying_loans IS NULL THEN 0
    ELSE ROUND((COALESCE(NULLIF(NEW.documentation_delay, '')::numeric, 0) / NEW.members_applying_loans::numeric) * 100, 2)
  END;

  -- 7. GENDER BASED BARRIER RATE = 0 ÷ members_at_end = 0
  v_gender_based_barrier_rate := 0.0;

  -- 8. FAMILY AND COMMUNITY BARRIER RATE = 0 ÷ members_at_end = 0
  v_family_community_barrier_rate := 0.0;

  -- 9. TRAINEE DROPOUT RATE = (members_at_start - members_at_end) ÷ members_at_start
  v_trainee_dropout_rate := CASE
    WHEN NEW.members_at_start = 0 OR NEW.members_at_start IS NULL THEN 0
    ELSE ROUND(((COALESCE(NEW.members_at_start, 0) - COALESCE(NEW.members_at_end, 0))::numeric / NEW.members_at_start::numeric) * 100, 2)
  END;

  -- 10. TRAINER DROPOUT RATE = (bros_at_start - bros_at_end) ÷ bros_at_start
  v_trainer_dropout_rate := CASE
    WHEN NEW.bros_at_start = 0 OR NEW.bros_at_start IS NULL THEN 0
    ELSE ROUND(((COALESCE(NEW.bros_at_start, 0) - COALESCE(NEW.bros_at_end, 0))::numeric / NEW.bros_at_start::numeric) * 100, 2)
  END;

  -- 11. CURRICULUM RELEVANCE COMPLAINT RATE = 0 ÷ members_at_end = 0
  v_curriculum_relevance_complaint_rate := 0.0;

  -- 12. LOW KNOWLEDGE RETENTION RATE = 1 - (members_applying_loans ÷ members_at_end)
  v_low_knowledge_retention_rate := CASE
    WHEN NEW.members_at_end = 0 OR NEW.members_at_end IS NULL THEN 0
    ELSE ROUND((1 - (COALESCE(NEW.members_applying_loans, 0)::numeric / NEW.members_at_end::numeric)) * 100, 2)
  END;

  -- Fetch KRI weights from barriers_weights_config table
  SELECT COALESCE(weight_value, 0.0833) INTO v_fraud_weight FROM barriers_weights_config WHERE metric_key = 'FRAUD_INCIDENT_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.0833) INTO v_trust_weight FROM barriers_weights_config WHERE metric_key = 'TRUST_EROSION_IN_MFIs' LIMIT 1;
  SELECT COALESCE(weight_value, 0.0833) INTO v_members_cost_weight FROM barriers_weights_config WHERE metric_key = 'MEMBERS_LOAN_COST' LIMIT 1;
  SELECT COALESCE(weight_value, 0.0833) INTO v_hand_in_hand_weight FROM barriers_weights_config WHERE metric_key = 'HAND_IN_HAND_LOAN_COST' LIMIT 1;
  SELECT COALESCE(weight_value, 0.0833) INTO v_mfi_cost_weight FROM barriers_weights_config WHERE metric_key = 'MFI_LOAN_SERVICE_COST' LIMIT 1;
  SELECT COALESCE(weight_value, 0.0833) INTO v_doc_delay_weight FROM barriers_weights_config WHERE metric_key = 'DOCUMENTATION_DELAY_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.0833) INTO v_gender_weight FROM barriers_weights_config WHERE metric_key = 'GENDER_BASED_BARRIER_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.0833) INTO v_family_weight FROM barriers_weights_config WHERE metric_key = 'FAMILY_AND_COMMUNITY_BARRIER_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.0833) INTO v_trainee_weight FROM barriers_weights_config WHERE metric_key = 'TRAINEE_DROPOUT_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.0833) INTO v_trainer_weight FROM barriers_weights_config WHERE metric_key = 'TRAINER_DROPOUT_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.0833) INTO v_curriculum_weight FROM barriers_weights_config WHERE metric_key = 'CURRICULUM_RELEVANCE_COMPLAINT_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.0833) INTO v_knowledge_weight FROM barriers_weights_config WHERE metric_key = 'LOW_KNOWLEDGE_RETENTION_RATE' LIMIT 1;

  -- Try to update existing Barriers record (wrap in exception handler for missing columns)
  BEGIN
    UPDATE "Barriers"
    SET
      -- KRI Values
      "KRI: FRAUD INCIDENT RATE_Value" = v_fraud_incident_rate,
      "KRI: TRUST EROSION IN MFIs_Value" = v_trust_erosion,
      "KRI: MEMBERS LOAN COST_Value" = v_members_loan_cost,
      "KRI: HAND IN HAND LOAN COST_Value" = v_hand_in_hand_loan_cost,
      "KRI: MFI LOAN SERVICE COST_Value" = v_mfi_loan_service_cost,
      "KRI: DOCUMENTATION DELAY RATE_Value" = v_documentation_delay_rate,
      "KRI: GENDER BASED BARRIER RATE_Value" = v_gender_based_barrier_rate,
      "KRI: FAMILY AND COMMUNITY BARRIER RATE_Value" = v_family_community_barrier_rate,
      "KRI: TRAINEE DROPOUT RATE_Value" = v_trainee_dropout_rate,
      "KRI: TRAINER DROPOUT RATE_Value" = v_trainer_dropout_rate,
      "KRI: CURRICULUM RELEVANCE COMPLAINT RATE_Value" = v_curriculum_relevance_complaint_rate,
      "KRI: LOW KNOWLEDGE RETENTION RATE_Value" = v_low_knowledge_retention_rate,
      -- KRI Weights
      "KRI: FRAUD INCIDENT RATE_Weight" = v_fraud_weight,
      "KRI: TRUST EROSION IN MFIs_Weight" = v_trust_weight,
      "KRI: MEMBERS LOAN COST_Weight" = v_members_cost_weight,
      "KRI: HAND IN HAND LOAN COST_Weight" = v_hand_in_hand_weight,
      "KRI: MFI LOAN SERVICE COST_Weight" = v_mfi_cost_weight,
      "KRI: DOCUMENTATION DELAY RATE_Weight" = v_doc_delay_weight,
      "KRI: GENDER BASED BARRIER RATE_Weight" = v_gender_weight,
      "KRI: FAMILY AND COMMUNITY BARRIER RATE_Weight" = v_family_weight,
      "KRI: TRAINEE DROPOUT RATE_Weight" = v_trainee_weight,
      "KRI: TRAINER DROPOUT RATE_Weight" = v_trainer_weight,
    "KRI: CURRICULUM RELEVANCE COMPLAINT RATE_Weight" = v_curriculum_weight,
    "KRI: LOW KNOWLEDGE RETENTION RATE_Weight" = v_knowledge_weight
  WHERE "Project ID" = NEW.project_id AND "Branch ID" = NEW.branch_id;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;

    -- If no rows were updated, insert a new record
    IF v_row_count = 0 THEN
      INSERT INTO "Barriers" (
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
      "KRI: FRAUD INCIDENT RATE_Weight",
      "KRI: TRUST EROSION IN MFIs_Weight",
      "KRI: MEMBERS LOAN COST_Weight",
      "KRI: HAND IN HAND LOAN COST_Weight",
      "KRI: MFI LOAN SERVICE COST_Weight",
      "KRI: DOCUMENTATION DELAY RATE_Weight",
      "KRI: GENDER BASED BARRIER RATE_Weight",
      "KRI: FAMILY AND COMMUNITY BARRIER RATE_Weight",
      "KRI: TRAINEE DROPOUT RATE_Weight",
      "KRI: TRAINER DROPOUT RATE_Weight",
      "KRI: CURRICULUM RELEVANCE COMPLAINT RATE_Weight",
      "KRI: LOW KNOWLEDGE RETENTION RATE_Weight"
    ) VALUES (
      NEW.project_id,
      NEW.branch_id,
      v_fraud_incident_rate,
      v_trust_erosion,
      v_members_loan_cost,
      v_hand_in_hand_loan_cost,
      v_mfi_loan_service_cost,
      v_documentation_delay_rate,
      v_gender_based_barrier_rate,
      v_family_community_barrier_rate,
      v_trainee_dropout_rate,
      v_trainer_dropout_rate,
      v_curriculum_relevance_complaint_rate,
      v_low_knowledge_retention_rate,
      v_fraud_weight,
      v_trust_weight,
      v_members_cost_weight,
      v_hand_in_hand_weight,
      v_mfi_cost_weight,
      v_doc_delay_weight,
      v_gender_weight,
      v_family_weight,
      v_trainee_weight,
      v_trainer_weight,
      v_curriculum_weight,
      v_knowledge_weight
    );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Gracefully skip if Barriers table or columns don't exist
    NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER barriers_kri_auto_update_trigger
AFTER INSERT OR UPDATE ON branch_reports
FOR EACH ROW
EXECUTE FUNCTION update_barriers_kri_values();

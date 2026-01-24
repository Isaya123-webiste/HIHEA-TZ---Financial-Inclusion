-- Add unique constraint to Barriers table for Project ID and Branch ID composite key
ALTER TABLE public."Barriers" 
ADD CONSTRAINT barriers_project_branch_unique 
UNIQUE ("Project ID", "Branch ID");

-- Drop old trigger if it exists
DROP TRIGGER IF EXISTS barriers_kri_auto_update_trigger ON branch_reports;
DROP FUNCTION IF EXISTS update_barriers_kri_values();

-- Create function to update KRI values in Barriers table
CREATE OR REPLACE FUNCTION update_barriers_kri_values()
RETURNS TRIGGER AS $$
DECLARE
  v_fraud_rate NUMERIC;
  v_trust_rate NUMERIC;
  v_members_loan_cost NUMERIC;
  v_hand_in_hand_cost NUMERIC;
  v_mfi_loan_cost NUMERIC;
  v_doc_delay_rate NUMERIC;
  v_gender_barrier_rate NUMERIC;
  v_family_barrier_rate NUMERIC;
  v_trainee_dropout NUMERIC;
  v_trainer_dropout NUMERIC;
  v_curriculum_complaint NUMERIC;
  v_knowledge_retention NUMERIC;
  
  -- Weights
  v_fraud_weight NUMERIC;
  v_trust_weight NUMERIC;
  v_mloan_weight NUMERIC;
  v_hiloan_weight NUMERIC;
  v_mfis_weight NUMERIC;
  v_doc_weight NUMERIC;
  v_gender_weight NUMERIC;
  v_family_weight NUMERIC;
  v_trainee_weight NUMERIC;
  v_trainer_weight NUMERIC;
  v_curriculum_weight NUMERIC;
  v_knowledge_weight NUMERIC;
  
  v_barriers_score NUMERIC;
  v_row_count INTEGER;
BEGIN
  -- Calculate KRI Values using your exact formulas
  v_fraud_rate := CASE WHEN COALESCE(NEW.members_at_end, 0) > 0 THEN ROUND((COALESCE(NEW.money_fraud, 0)::numeric / NEW.members_at_end::numeric), 4) ELSE 0 END;
  v_trust_rate := CASE WHEN COALESCE(NEW.members_at_end, 0) > 0 THEN ROUND((COALESCE(NEW.trust_erosion, 0)::numeric / NEW.members_at_end::numeric), 4) ELSE 0 END;
  v_members_loan_cost := CASE WHEN COALESCE(NEW.members_applying_loans, 0) > 0 THEN ROUND((COALESCE(NEW.loan_cost_high, 0)::numeric / NEW.members_applying_loans::numeric), 4) ELSE 0 END;
  v_hand_in_hand_cost := 1.0; -- 100 ÷ 100 = 1
  v_mfi_loan_cost := 1.0; -- 100% = 1
  v_doc_delay_rate := CASE WHEN COALESCE(NEW.members_applying_loans, 0) > 0 THEN ROUND((COALESCE(NEW.documentation_delay, 0)::numeric / NEW.members_applying_loans::numeric), 4) ELSE 0 END;
  v_gender_barrier_rate := CASE WHEN COALESCE(NEW.members_at_end, 0) > 0 THEN ROUND((0::numeric / NEW.members_at_end::numeric), 4) ELSE 0 END;
  v_family_barrier_rate := CASE WHEN COALESCE(NEW.members_at_end, 0) > 0 THEN ROUND((0::numeric / NEW.members_at_end::numeric), 4) ELSE 0 END;
  v_trainee_dropout := CASE WHEN COALESCE(NEW.members_at_start, 0) > 0 THEN ROUND(((NEW.members_at_start - COALESCE(NEW.members_at_end, 0))::numeric / NEW.members_at_start::numeric), 4) ELSE 0 END;
  v_trainer_dropout := CASE WHEN COALESCE(NEW.bros_at_start, 0) > 0 THEN ROUND(((NEW.bros_at_start - COALESCE(NEW.bros_at_end, 0))::numeric / NEW.bros_at_start::numeric), 4) ELSE 0 END;
  v_curriculum_complaint := CASE WHEN COALESCE(NEW.members_at_end, 0) > 0 THEN ROUND((0::numeric / NEW.members_at_end::numeric), 4) ELSE 0 END;
  v_knowledge_retention := CASE WHEN COALESCE(NEW.members_at_end, 0) > 0 THEN ROUND((1 - (COALESCE(NEW.members_applying_loans, 0)::numeric / NEW.members_at_end::numeric)), 4) ELSE 0 END;

  -- Fetch KRI weights from barriers_weights_config
  SELECT COALESCE(weight_value, 0.083) INTO v_fraud_weight FROM barriers_weights_config WHERE metric_key = 'FRAUD_INCIDENT_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.083) INTO v_trust_weight FROM barriers_weights_config WHERE metric_key = 'TRUST_EROSION_IN_MFIs' LIMIT 1;
  SELECT COALESCE(weight_value, 0.083) INTO v_mloan_weight FROM barriers_weights_config WHERE metric_key = 'MEMBERS_LOAN_COST' LIMIT 1;
  SELECT COALESCE(weight_value, 0.083) INTO v_hiloan_weight FROM barriers_weights_config WHERE metric_key = 'HAND_IN_HAND_LOAN_COST' LIMIT 1;
  SELECT COALESCE(weight_value, 0.083) INTO v_mfis_weight FROM barriers_weights_config WHERE metric_key = 'MFI_LOAN_SERVICE_COST' LIMIT 1;
  SELECT COALESCE(weight_value, 0.083) INTO v_doc_weight FROM barriers_weights_config WHERE metric_key = 'DOCUMENTATION_DELAY_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.083) INTO v_gender_weight FROM barriers_weights_config WHERE metric_key = 'GENDER_BASED_BARRIER_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.083) INTO v_family_weight FROM barriers_weights_config WHERE metric_key = 'FAMILY_AND_COMMUNITY_BARRIER_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.083) INTO v_trainee_weight FROM barriers_weights_config WHERE metric_key = 'TRAINEE_DROPOUT_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.083) INTO v_trainer_weight FROM barriers_weights_config WHERE metric_key = 'TRAINER_DROPOUT_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.083) INTO v_curriculum_weight FROM barriers_weights_config WHERE metric_key = 'CURRICULUM_RELEVANCE_COMPLAINT_RATE' LIMIT 1;
  SELECT COALESCE(weight_value, 0.083) INTO v_knowledge_weight FROM barriers_weights_config WHERE metric_key = 'LOW_KNOWLEDGE_RETENTION_RATE' LIMIT 1;

  -- Calculate composite barriers score (average of all 12 KRIs)
  v_barriers_score := (v_fraud_rate + v_trust_rate + v_members_loan_cost + v_hand_in_hand_cost + v_mfi_loan_cost +
                      v_doc_delay_rate + v_gender_barrier_rate + v_family_barrier_rate + v_trainee_dropout +
                      v_trainer_dropout + v_curriculum_complaint + v_knowledge_retention) / 12.0;

  -- Try to update existing Barriers record
  UPDATE "Barriers"
  SET
    "KRI: FRAUD INCIDENT RATE_Value" = v_fraud_rate,
    "KRI: FRAUD INCIDENT RATE_Weight" = v_fraud_weight,
    "KRI: TRUST EROSION IN MFIs_Value" = v_trust_rate,
    "KRI: TRUST EROSION IN MFIs_Weight" = v_trust_weight,
    "KRI: MEMBERS LOAN COST_Value" = v_members_loan_cost,
    "KRI: MEMBERS LOAN COST_Weight" = v_mloan_weight,
    "KRI: HAND IN HAND LOAN COST_Value" = v_hand_in_hand_cost,
    "KRI: HAND IN HAND LOAN COST_Weight" = v_hiloan_weight,
    "KRI: MFI LOAN SERVICE COST_Value" = v_mfi_loan_cost,
    "KRI: MFI LOAN SERVICE COST_Weight" = v_mfis_weight,
    "KRI: DOCUMENTATION DELAY RATE_Value" = v_doc_delay_rate,
    "KRI: DOCUMENTATION DELAY RATE_Weight" = v_doc_weight,
    "KRI: GENDER BASED BARRIER RATE_Value" = v_gender_barrier_rate,
    "KRI: GENDER BASED BARRIER RATE_Weight" = v_gender_weight,
    "KRI: FAMILY AND COMMUNITY BARRIER RATE_Value" = v_family_barrier_rate,
    "KRI: FAMILY AND COMMUNITY BARRIER RATE_Weight" = v_family_weight,
    "KRI: TRAINEE DROPOUT RATE(1)_Value" = v_trainee_dropout,
    "KRI: TRAINEE DROPOUT RATE(1)_Weight" = v_trainee_weight,
    "KRI: TRAINER DROPOUT RATE(2)_Value" = v_trainer_dropout,
    "KRI: TRAINER DROPOUT RATE(2)_Weight" = v_trainer_weight,
    "KRI: CARRICULUM RELEVANCE COMPLAINT RATE_Value" = v_curriculum_complaint,
    "KRI: CARRICULUM RELEVANCE COMPLAINT RATE_Weight" = v_curriculum_weight,
    "KRI: LOW KNOWLEDGE RETENTION RATE_Value" = v_knowledge_retention,
    "KRI: LOW KNOWLEDGE RETENTION RATE_Weight" = v_knowledge_weight,
    "BARRIERS_Value" = v_barriers_score,
    "BARRIERS_Weight" = 1.0,
    updated_at = NOW()
  WHERE "Project ID" = NEW.project_id AND "Branch ID" = NEW.branch_id;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;

  -- If no rows were updated, insert a new record
  IF v_row_count = 0 THEN
    INSERT INTO "Barriers" (
      "Project ID",
      "Branch ID",
      "KRI: FRAUD INCIDENT RATE_Value",
      "KRI: FRAUD INCIDENT RATE_Weight",
      "KRI: TRUST EROSION IN MFIs_Value",
      "KRI: TRUST EROSION IN MFIs_Weight",
      "KRI: MEMBERS LOAN COST_Value",
      "KRI: MEMBERS LOAN COST_Weight",
      "KRI: HAND IN HAND LOAN COST_Value",
      "KRI: HAND IN HAND LOAN COST_Weight",
      "KRI: MFI LOAN SERVICE COST_Value",
      "KRI: MFI LOAN SERVICE COST_Weight",
      "KRI: DOCUMENTATION DELAY RATE_Value",
      "KRI: DOCUMENTATION DELAY RATE_Weight",
      "KRI: GENDER BASED BARRIER RATE_Value",
      "KRI: GENDER BASED BARRIER RATE_Weight",
      "KRI: FAMILY AND COMMUNITY BARRIER RATE_Value",
      "KRI: FAMILY AND COMMUNITY BARRIER RATE_Weight",
      "KRI: TRAINEE DROPOUT RATE(1)_Value",
      "KRI: TRAINEE DROPOUT RATE(1)_Weight",
      "KRI: TRAINER DROPOUT RATE(2)_Value",
      "KRI: TRAINER DROPOUT RATE(2)_Weight",
      "KRI: CARRICULUM RELEVANCE COMPLAINT RATE_Value",
      "KRI: CARRICULUM RELEVANCE COMPLAINT RATE_Weight",
      "KRI: LOW KNOWLEDGE RETENTION RATE_Value",
      "KRI: LOW KNOWLEDGE RETENTION RATE_Weight",
      "BARRIERS_Value",
      "BARRIERS_Weight"
    ) VALUES (
      NEW.project_id,
      NEW.branch_id,
      v_fraud_rate,
      v_fraud_weight,
      v_trust_rate,
      v_trust_weight,
      v_members_loan_cost,
      v_mloan_weight,
      v_hand_in_hand_cost,
      v_hiloan_weight,
      v_mfi_loan_cost,
      v_mfis_weight,
      v_doc_delay_rate,
      v_doc_weight,
      v_gender_barrier_rate,
      v_gender_weight,
      v_family_barrier_rate,
      v_family_weight,
      v_trainee_dropout,
      v_trainee_weight,
      v_trainer_dropout,
      v_trainer_weight,
      v_curriculum_complaint,
      v_curriculum_weight,
      v_knowledge_retention,
      v_knowledge_weight,
      v_barriers_score,
      1.0
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER barriers_kri_auto_update_trigger
AFTER INSERT OR UPDATE ON branch_reports
FOR EACH ROW
EXECUTE FUNCTION update_barriers_kri_values();

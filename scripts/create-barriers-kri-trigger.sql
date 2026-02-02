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
  
  -- KPI values
  v_value_chain_diversification NUMERIC;
  v_startup_level_rate NUMERIC;
  v_acceleration_level_rate NUMERIC;
  
  -- SUB FACTOR values
  v_sub_income_level NUMERIC;
  v_sub_distance NUMERIC;
  v_sub_trust NUMERIC;
  v_sub_costs NUMERIC;
  v_sub_registration NUMERIC;
  v_sub_social_cultural NUMERIC;
  v_sub_financial_literacy NUMERIC;
  
  -- SUB FACTOR weights
  v_sub_income_level_weight NUMERIC;
  v_sub_distance_weight NUMERIC;
  v_sub_trust_weight NUMERIC;
  v_sub_costs_weight NUMERIC;
  v_sub_registration_weight NUMERIC;
  v_sub_social_cultural_weight NUMERIC;
  v_sub_financial_literacy_weight NUMERIC;
  
  -- KPI weights
  v_kpi_vcd_weight NUMERIC;
  v_kpi_startup_weight NUMERIC;
  v_kpi_acceleration_weight NUMERIC;
  
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

  -- KPI CALCULATIONS
  -- 1. VALUE CHAIN DIVERSIFICATION RATE_Value = loan_uses ÷ members_received_loans
  v_value_chain_diversification := CASE
    WHEN NEW.members_received_loans = 0 OR NEW.members_received_loans IS NULL THEN 0
    ELSE ROUND((COALESCE(NEW.loan_uses, 0)::numeric / NEW.members_received_loans::numeric) * 100, 2)
  END;

  -- 2. STARTUP LEVEL RATE = 1 (fixed value)
  v_startup_level_rate := 1.0;

  -- 3. ACCELERATION LEVEL RATE = 1 (fixed value)
  v_acceleration_level_rate := 1.0;

  -- SUB FACTOR CALCULATIONS (based on KRI and KPI values)
  -- Fetch KPI weights first for income level calculation
  -- SUB FACTOR: INCOME LEVEL = 1 * ((VALUE CHAIN DIVERSIFICATION * Weight) + (STARTUP * Weight) + (ACCELERATION * Weight))
  SELECT COALESCE(weight_value, 0) INTO v_kpi_vcd_weight FROM barriers_weights_config WHERE metric_key = 'VALUE_CHAIN_DIVERSIFICATION_RATE' AND category = 'KPI' LIMIT 1;
  SELECT COALESCE(weight_value, 0) INTO v_kpi_startup_weight FROM barriers_weights_config WHERE metric_key = 'STARTUP_LEVEL_RATE' AND category = 'KPI' LIMIT 1;
  SELECT COALESCE(weight_value, 0) INTO v_kpi_acceleration_weight FROM barriers_weights_config WHERE metric_key = 'ACCELERATION_LEVEL_RATE' AND category = 'KPI' LIMIT 1;
  
  v_sub_income_level := ROUND(
    1 * (
      (v_value_chain_diversification * v_kpi_vcd_weight) +
      (v_startup_level_rate * v_kpi_startup_weight) +
      (v_acceleration_level_rate * v_kpi_acceleration_weight)
    ), 4
  );

  -- SUB FACTOR: DISTANCE = 1 (default, no calculation)
  v_sub_distance := 1.0;

  -- SUB FACTOR: TRUST = 1 * (((1 - FRAUD) * FRAUD_Weight) + ((1 - TRUST_EROSION) * TRUST_Weight))
  v_sub_trust := ROUND(
    1 * (
      ((1 - v_fraud_incident_rate) * v_fraud_weight) +
      ((1 - v_trust_erosion) * v_trust_weight)
    ), 4
  );

  -- SUB FACTOR: COSTS = 1 * (((1 - MEMBERS_COST) * WEIGHT) + ((1 - HAND_IN_HAND_COST) * WEIGHT) + ((1 - MFI_COST) * WEIGHT))
  v_sub_costs := ROUND(
    1 * (
      ((1 - v_members_loan_cost) * v_members_cost_weight) +
      ((1 - v_hand_in_hand_loan_cost) * v_hand_in_hand_weight) +
      ((1 - v_mfi_loan_service_cost) * v_mfi_cost_weight)
    ), 4
  );

  -- SUB FACTOR: REGISTRATION = 1 * ((1 - DOCUMENTATION_DELAY) * DOCUMENTATION_DELAY_Weight)
  v_sub_registration := ROUND(
    1 * (
      ((1 - v_documentation_delay_rate) * v_doc_delay_weight)
    ), 4
  );

  -- SUB FACTOR: SOCIAL AND CULTURAL FACTORS = 1 * (((1 - GENDER) * WEIGHT) + ((1 - FAMILY_COMMUNITY) * WEIGHT))
  v_sub_social_cultural := ROUND(
    1 * (
      ((1 - v_gender_based_barrier_rate) * v_gender_weight) +
      ((1 - v_family_community_barrier_rate) * v_family_weight)
    ), 4
  );

  -- SUB FACTOR: FINANCIAL LITERACY = 1 * (((1 - TRAINEE_DROPOUT) * WEIGHT) + ((1 - TRAINER_DROPOUT) * WEIGHT) + ((1 - CURRICULUM) * WEIGHT) + ((1 - KNOWLEDGE_RETENTION) * WEIGHT))
  v_sub_financial_literacy := ROUND(
    1 * (
      ((1 - v_trainee_dropout_rate) * v_trainee_weight) +
      ((1 - v_trainer_dropout_rate) * v_trainer_weight) +
      ((1 - v_curriculum_relevance_complaint_rate) * v_curriculum_weight) +
      ((1 - v_low_knowledge_retention_rate) * v_knowledge_weight)
    ), 4
  );

  -- Fetch SUB FACTOR weights from barriers_weights_config
  SELECT COALESCE(weight_value, 0.10) INTO v_sub_income_level_weight FROM barriers_weights_config WHERE metric_key = 'INCOME_LEVEL' AND category = 'SUB_FACTOR' LIMIT 1;
  SELECT COALESCE(weight_value, 0) INTO v_sub_distance_weight FROM barriers_weights_config WHERE metric_key = 'DISTANCE' AND category = 'SUB_FACTOR' LIMIT 1;
  SELECT COALESCE(weight_value, 0.20) INTO v_sub_trust_weight FROM barriers_weights_config WHERE metric_key = 'TRUST' AND category = 'SUB_FACTOR' LIMIT 1;
  SELECT COALESCE(weight_value, 0.10) INTO v_sub_costs_weight FROM barriers_weights_config WHERE metric_key = 'COSTS' AND category = 'SUB_FACTOR' LIMIT 1;
  SELECT COALESCE(weight_value, 0.05) INTO v_sub_registration_weight FROM barriers_weights_config WHERE metric_key = 'REGISTRATION' AND category = 'SUB_FACTOR' LIMIT 1;
  SELECT COALESCE(weight_value, 0.20) INTO v_sub_social_cultural_weight FROM barriers_weights_config WHERE metric_key = 'SOCIAL_AND_CULTURAL_FACTORS' AND category = 'SUB_FACTOR' LIMIT 1;
  SELECT COALESCE(weight_value, 0.30) INTO v_sub_financial_literacy_weight FROM barriers_weights_config WHERE metric_key = 'FINANCIAL_LITERACY' AND category = 'SUB_FACTOR' LIMIT 1;

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
      -- KPI Values
      "KPI: VALUE CHAIN DIVERSIFICATION RATE_Value" = v_value_chain_diversification,
      "KPI: STARTUP LEVEL RATE_Value" = v_startup_level_rate,
      "KPI: ACCELERATION LEVEL RATE_Value" = v_acceleration_level_rate,
      -- KPI Weights
      "KPI: VALUE CHAIN DIVERSIFICATION RATE_Weight" = v_kpi_vcd_weight,
      "KPI: STARTUP LEVEL RATE_Weight" = v_kpi_startup_weight,
      "KPI: ACCELERATION LEVEL RATE_Weight" = v_kpi_acceleration_weight,
      -- SUB FACTOR Values
      "SUB FACTOR: INCOME LEVEL_Value" = v_sub_income_level,
      "SUB FACTOR: DISTANCE_Value" = v_sub_distance,
      "SUB FACTOR: TRUST_Value" = v_sub_trust,
      "SUB FACTOR: COSTS_Value" = v_sub_costs,
      "SUB FACTOR: REGISTRATION_Value" = v_sub_registration,
      "SUB FACTOR: SOCIAL AND CULTURAL FACTORS_Value" = v_sub_social_cultural,
      "SUB FACTOR: FINANCIAL LITERACY_Value" = v_sub_financial_literacy,
      -- SUB FACTOR Weights
      "SUB FACTOR: INCOME LEVEL_Weight" = v_sub_income_level_weight,
      "SUB FACTOR: DISTANCE_Weight" = v_sub_distance_weight,
      "SUB FACTOR: TRUST_Weight" = v_sub_trust_weight,
      "SUB FACTOR: COSTS_Weight" = v_sub_costs_weight,
      "SUB FACTOR: REGISTRATION_Weight" = v_sub_registration_weight,
      "SUB FACTOR: SOCIAL AND CULTURAL FACTORS_Weight" = v_sub_social_cultural_weight,
      "SUB FACTOR: FINANCIAL LITERACY_Weight" = v_sub_financial_literacy_weight,
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
      "KPI: VALUE CHAIN DIVERSIFICATION RATE_Value",
      "KPI: STARTUP LEVEL RATE_Value",
      "KPI: ACCELERATION LEVEL RATE_Value",
      "KPI: VALUE CHAIN DIVERSIFICATION RATE_Weight",
      "KPI: STARTUP LEVEL RATE_Weight",
      "KPI: ACCELERATION LEVEL RATE_Weight",
      "SUB FACTOR: INCOME LEVEL_Value",
      "SUB FACTOR: DISTANCE_Value",
      "SUB FACTOR: TRUST_Value",
      "SUB FACTOR: COSTS_Value",
      "SUB FACTOR: REGISTRATION_Value",
      "SUB FACTOR: SOCIAL AND CULTURAL FACTORS_Value",
      "SUB FACTOR: FINANCIAL LITERACY_Value",
      "SUB FACTOR: INCOME LEVEL_Weight",
      "SUB FACTOR: DISTANCE_Weight",
      "SUB FACTOR: TRUST_Weight",
      "SUB FACTOR: COSTS_Weight",
      "SUB FACTOR: REGISTRATION_Weight",
      "SUB FACTOR: SOCIAL AND CULTURAL FACTORS_Weight",
      "SUB FACTOR: FINANCIAL LITERACY_Weight",
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
      v_value_chain_diversification,
      v_startup_level_rate,
      v_acceleration_level_rate,
      v_kpi_vcd_weight,
      v_kpi_startup_weight,
      v_kpi_acceleration_weight,
      v_sub_income_level,
      v_sub_distance,
      v_sub_trust,
      v_sub_costs,
      v_sub_registration,
      v_sub_social_cultural,
      v_sub_financial_literacy,
      v_sub_income_level_weight,
      v_sub_distance_weight,
      v_sub_trust_weight,
      v_sub_costs_weight,
      v_sub_registration_weight,
      v_sub_social_cultural_weight,
      v_sub_financial_literacy_weight,
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

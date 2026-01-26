-- Backfill Barriers table with all existing branch_reports data
-- This will insert one row per (project_id, branch_id) combination with all 12 KRI values and weights calculated

DO $$
DECLARE
  v_project_id UUID;
  v_branch_id UUID;
  v_members_at_start NUMERIC;
  v_members_at_end NUMERIC;
  v_members_applying_loans NUMERIC;
  v_bros_at_start NUMERIC;
  v_bros_at_end NUMERIC;
  v_money_fraud NUMERIC;
  v_trust_erosion NUMERIC;
  v_loan_cost_high NUMERIC;
  v_documentation_delay NUMERIC;
  fraud_rate NUMERIC;
  trust_rate NUMERIC;
  members_loan_cost NUMERIC;
  hand_in_hand_cost NUMERIC;
  mfi_loan_cost NUMERIC;
  doc_delay_rate NUMERIC;
  gender_barrier_rate NUMERIC;
  family_barrier_rate NUMERIC;
  trainee_dropout NUMERIC;
  trainer_dropout NUMERIC;
  curriculum_complaint NUMERIC;
  knowledge_retention NUMERIC;
  fraud_weight NUMERIC;
  trust_weight NUMERIC;
  mloan_weight NUMERIC;
  hiloan_weight NUMERIC;
  mfis_weight NUMERIC;
  doc_weight NUMERIC;
  gender_weight NUMERIC;
  family_weight NUMERIC;
  trainee_weight NUMERIC;
  trainer_weight NUMERIC;
  curriculum_weight NUMERIC;
  knowledge_weight NUMERIC;
  barriers_score NUMERIC;
BEGIN
  -- Get all weights from barriers_weights_config
  SELECT weight_value INTO fraud_weight FROM barriers_weights_config WHERE metric_key = 'FRAUD_INCIDENT_RATE';
  SELECT weight_value INTO trust_weight FROM barriers_weights_config WHERE metric_key = 'TRUST_EROSION_IN_MFIs';
  SELECT weight_value INTO mloan_weight FROM barriers_weights_config WHERE metric_key = 'MEMBERS_LOAN_COST';
  SELECT weight_value INTO hiloan_weight FROM barriers_weights_config WHERE metric_key = 'HAND_IN_HAND_LOAN_COST';
  SELECT weight_value INTO mfis_weight FROM barriers_weights_config WHERE metric_key = 'MFI_LOAN_SERVICE_COST';
  SELECT weight_value INTO doc_weight FROM barriers_weights_config WHERE metric_key = 'DOCUMENTATION_DELAY_RATE';
  SELECT weight_value INTO gender_weight FROM barriers_weights_config WHERE metric_key = 'GENDER_BASED_BARRIER_RATE';
  SELECT weight_value INTO family_weight FROM barriers_weights_config WHERE metric_key = 'FAMILY_AND_COMMUNITY_BARRIER_RATE';
  SELECT weight_value INTO trainee_weight FROM barriers_weights_config WHERE metric_key = 'TRAINEE_DROPOUT_RATE';
  SELECT weight_value INTO trainer_weight FROM barriers_weights_config WHERE metric_key = 'TRAINER_DROPOUT_RATE';
  SELECT weight_value INTO curriculum_weight FROM barriers_weights_config WHERE metric_key = 'CURRICULUM_RELEVANCE_COMPLAINT_RATE';
  SELECT weight_value INTO knowledge_weight FROM barriers_weights_config WHERE metric_key = 'LOW_KNOWLEDGE_RETENTION_RATE';

  -- Iterate through all unique (project_id, branch_id) combinations in branch_reports
  FOR v_project_id, v_branch_id IN 
    SELECT DISTINCT project_id, branch_id FROM branch_reports 
    WHERE project_id IS NOT NULL AND branch_id IS NOT NULL
  LOOP
    BEGIN
      -- Get the most recent branch report for this combination
      SELECT 
        project_id, branch_id, COALESCE(members_at_start, 0), COALESCE(members_at_end, 0), 
        COALESCE(members_applying_loans, 0), COALESCE(bros_at_start, 0), COALESCE(bros_at_end, 0), 
        COALESCE(money_fraud, 0), COALESCE(trust_erosion, 0), COALESCE(loan_cost_high, 0), 
        COALESCE(documentation_delay, 0)
      INTO 
        v_project_id, v_branch_id, v_members_at_start, v_members_at_end, v_members_applying_loans,
        v_bros_at_start, v_bros_at_end, v_money_fraud, v_trust_erosion, v_loan_cost_high, v_documentation_delay
      FROM branch_reports
      WHERE project_id = v_project_id AND branch_id = v_branch_id
      ORDER BY created_at DESC
      LIMIT 1;

      -- Calculate all KRI values using the provided formulas
      fraud_rate := CASE WHEN v_members_at_end > 0 THEN (v_money_fraud / v_members_at_end) ELSE 0 END;
      trust_rate := CASE WHEN v_members_at_end > 0 THEN (v_trust_erosion / v_members_at_end) ELSE 0 END;
      members_loan_cost := CASE WHEN v_members_applying_loans > 0 THEN (v_loan_cost_high / v_members_applying_loans) ELSE 0 END;
      hand_in_hand_cost := 1.0;
      mfi_loan_cost := 1.0;
      doc_delay_rate := CASE WHEN v_members_applying_loans > 0 THEN (v_documentation_delay / v_members_applying_loans) ELSE 0 END;
      gender_barrier_rate := 0;
      family_barrier_rate := 0;
      trainee_dropout := CASE WHEN v_members_at_start > 0 THEN ((v_members_at_start - v_members_at_end) / v_members_at_start) ELSE 0 END;
      trainer_dropout := CASE WHEN v_bros_at_start > 0 THEN ((v_bros_at_start - v_bros_at_end) / v_bros_at_start) ELSE 0 END;
      curriculum_complaint := 0;
      knowledge_retention := CASE WHEN v_members_at_end > 0 THEN (1 - (v_members_applying_loans / v_members_at_end)) ELSE 0 END;

      -- Calculate composite barriers score
      barriers_score := (fraud_rate + trust_rate + members_loan_cost + hand_in_hand_cost + mfi_loan_cost + 
                        doc_delay_rate + gender_barrier_rate + family_barrier_rate + trainee_dropout + 
                        trainer_dropout + curriculum_complaint + knowledge_retention) / 12.0;

      -- Upsert into Barriers table
      INSERT INTO "Barriers" (
        "Project ID", "Branch ID",
        "KRI: FRAUD INCIDENT RATE_Value", "KRI: FRAUD INCIDENT RATE_Weight",
        "KRI: TRUST EROSION IN MFIs_Value", "KRI: TRUST EROSION IN MFIs_Weight",
        "KRI: MEMBERS LOAN COST_Value", "KRI: MEMBERS LOAN COST_Weight",
        "KRI: HAND IN HAND LOAN COST_Value", "KRI: HAND IN HAND LOAN COST_Weight",
        "KRI: MFI LOAN SERVICE COST_Value", "KRI: MFI LOAN SERVICE COST_Weight",
        "KRI: DOCUMENTATION DELAY RATE_Value", "KRI: DOCUMENTATION DELAY RATE_Weight",
        "KRI: GENDER BASED BARRIER RATE_Value", "KRI: GENDER BASED BARRIER RATE_Weight",
        "KRI: FAMILY AND COMMUNITY BARRIER RATE_Value", "KRI: FAMILY AND COMMUNITY BARRIER RATE_Weight",
        "KRI: TRAINEE DROPOUT RATE(1)_Value", "KRI: TRAINEE DROPOUT RATE(1)_Weight",
        "KRI: TRAINER DROPOUT RATE(2)_Value", "KRI: TRAINER DROPOUT RATE(2)_Weight",
        "KRI: CARRICULUM RELEVANCE COMPLAINT RATE_Value", "KRI: CARRICULUM RELEVANCE COMPLAINT RATE_Weight",
        "KRI: LOW KNOWLEDGE RETENTION RATE_Value", "KRI: LOW KNOWLEDGE RETENTION RATE_Weight",
        "BARRIERS_Value", "BARRIERS_Weight"
      )
      VALUES (
        v_project_id, v_branch_id,
        fraud_rate, COALESCE(fraud_weight, 0),
        trust_rate, COALESCE(trust_weight, 0),
        members_loan_cost, COALESCE(mloan_weight, 0),
        hand_in_hand_cost, COALESCE(hiloan_weight, 0),
        mfi_loan_cost, COALESCE(mfis_weight, 0),
        doc_delay_rate, COALESCE(doc_weight, 0),
        gender_barrier_rate, COALESCE(gender_weight, 0),
        family_barrier_rate, COALESCE(family_weight, 0),
        trainee_dropout, COALESCE(trainee_weight, 0),
        trainer_dropout, COALESCE(trainer_weight, 0),
        curriculum_complaint, COALESCE(curriculum_weight, 0),
        knowledge_retention, COALESCE(knowledge_weight, 0),
        barriers_score, 1.0
      )
      ON CONFLICT ("Project ID", "Branch ID") DO UPDATE SET
        "KRI: FRAUD INCIDENT RATE_Value" = fraud_rate,
        "KRI: TRUST EROSION IN MFIs_Value" = trust_rate,
        "KRI: MEMBERS LOAN COST_Value" = members_loan_cost,
        "KRI: HAND IN HAND LOAN COST_Value" = hand_in_hand_cost,
        "KRI: MFI LOAN SERVICE COST_Value" = mfi_loan_cost,
        "KRI: DOCUMENTATION DELAY RATE_Value" = doc_delay_rate,
        "KRI: GENDER BASED BARRIER RATE_Value" = gender_barrier_rate,
        "KRI: FAMILY AND COMMUNITY BARRIER RATE_Value" = family_barrier_rate,
        "KRI: TRAINEE DROPOUT RATE(1)_Value" = trainee_dropout,
        "KRI: TRAINER DROPOUT RATE(2)_Value" = trainer_dropout,
        "KRI: CARRICULUM RELEVANCE COMPLAINT RATE_Value" = curriculum_complaint,
        "KRI: LOW KNOWLEDGE RETENTION RATE_Value" = knowledge_retention,
        "BARRIERS_Value" = barriers_score,
        updated_at = NOW();

    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error processing project % branch %: %', v_project_id, v_branch_id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Backfill completed for Barriers table';
END $$;

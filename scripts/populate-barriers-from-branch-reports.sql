-- Direct population of Barriers table from existing branch_reports data
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
  "KRI: LOW KNOWLEDGE RETENTION RATE_Weight"
)
SELECT 
  br.project_id,
  br.branch_id,
  -- FRAUD INCIDENT RATE = money_fraud ÷ members_at_end
  CASE WHEN (br.members_at_end::numeric) > 0 
    THEN ROUND(((br.money_fraud::numeric) / (br.members_at_end::numeric)), 4) 
    ELSE 0 END,
  COALESCE(bwc1.weight_value::numeric, 0.083),
  -- TRUST EROSION IN MFIs = trust_erosion ÷ members_at_end
  CASE WHEN (br.members_at_end::numeric) > 0 
    THEN ROUND(((br.trust_erosion::numeric) / (br.members_at_end::numeric)), 4) 
    ELSE 0 END,
  COALESCE(bwc2.weight_value::numeric, 0.083),
  -- MEMBERS LOAN COST = loan_cost_high ÷ members_applying_loans
  CASE WHEN (br.members_applying_loans::numeric) > 0 
    THEN ROUND(((br.loan_cost_high::numeric) / (br.members_applying_loans::numeric)), 4) 
    ELSE 0 END,
  COALESCE(bwc3.weight_value::numeric, 0.083),
  -- HAND IN HAND LOAN COST = 100 ÷ 100 = 1
  1.0,
  COALESCE(bwc4.weight_value::numeric, 0.083),
  -- MFI LOAN SERVICE COST = 100% = 1
  1.0,
  COALESCE(bwc5.weight_value::numeric, 0.083),
  -- DOCUMENTATION DELAY RATE = documentation_delay ÷ members_applying_loans
  CASE WHEN (br.members_applying_loans::numeric) > 0 
    THEN ROUND(((br.documentation_delay::numeric) / (br.members_applying_loans::numeric)), 4) 
    ELSE 0 END,
  COALESCE(bwc6.weight_value::numeric, 0.083),
  -- GENDER BASED BARRIER RATE = 0 ÷ members_at_end
  0::numeric,
  COALESCE(bwc7.weight_value::numeric, 0.083),
  -- FAMILY AND COMMUNITY BARRIER RATE = 0 ÷ members_at_end
  0::numeric,
  COALESCE(bwc8.weight_value::numeric, 0.083),
  -- TRAINEE DROPOUT RATE = (members_at_start - members_at_end) ÷ members_at_start
  CASE WHEN (br.members_at_start::numeric) > 0 
    THEN ROUND((((br.members_at_start::numeric) - (br.members_at_end::numeric)) / (br.members_at_start::numeric)), 4) 
    ELSE 0 END,
  COALESCE(bwc9.weight_value::numeric, 0.083),
  -- TRAINER DROPOUT RATE = (bros_at_start - bros_at_end) ÷ bros_at_start
  CASE WHEN (br.bros_at_start::numeric) > 0 
    THEN ROUND((((br.bros_at_start::numeric) - (br.bros_at_end::numeric)) / (br.bros_at_start::numeric)), 4) 
    ELSE 0 END,
  COALESCE(bwc10.weight_value::numeric, 0.083),
  -- CURRICULUM RELEVANCE COMPLAINT RATE = 0 ÷ members_at_end
  0::numeric,
  COALESCE(bwc11.weight_value::numeric, 0.083),
  -- LOW KNOWLEDGE RETENTION RATE = 1 - (members_applying_loans ÷ members_at_end)
  CASE WHEN (br.members_at_end::numeric) > 0 
    THEN ROUND((1 - ((br.members_applying_loans::numeric) / (br.members_at_end::numeric))), 4) 
    ELSE 0 END,
  COALESCE(bwc12.weight_value::numeric, 0.083)
FROM (
  -- Get the latest record for each unique (project_id, branch_id) combination
  SELECT DISTINCT ON (project_id, branch_id) 
    project_id, branch_id, members_at_start, members_at_end, members_applying_loans,
    bros_at_start, bros_at_end, money_fraud, trust_erosion, loan_cost_high, documentation_delay
  FROM branch_reports
  WHERE project_id IS NOT NULL AND branch_id IS NOT NULL
  ORDER BY project_id, branch_id, created_at DESC
) br
LEFT JOIN barriers_weights_config bwc1 ON bwc1.metric_key = 'FRAUD_INCIDENT_RATE'
LEFT JOIN barriers_weights_config bwc2 ON bwc2.metric_key = 'TRUST_EROSION_IN_MFIs'
LEFT JOIN barriers_weights_config bwc3 ON bwc3.metric_key = 'MEMBERS_LOAN_COST'
LEFT JOIN barriers_weights_config bwc4 ON bwc4.metric_key = 'HAND_IN_HAND_LOAN_COST'
LEFT JOIN barriers_weights_config bwc5 ON bwc5.metric_key = 'MFI_LOAN_SERVICE_COST'
LEFT JOIN barriers_weights_config bwc6 ON bwc6.metric_key = 'DOCUMENTATION_DELAY_RATE'
LEFT JOIN barriers_weights_config bwc7 ON bwc7.metric_key = 'GENDER_BASED_BARRIER_RATE'
LEFT JOIN barriers_weights_config bwc8 ON bwc8.metric_key = 'FAMILY_AND_COMMUNITY_BARRIER_RATE'
LEFT JOIN barriers_weights_config bwc9 ON bwc9.metric_key = 'TRAINEE_DROPOUT_RATE'
LEFT JOIN barriers_weights_config bwc10 ON bwc10.metric_key = 'TRAINER_DROPOUT_RATE'
LEFT JOIN barriers_weights_config bwc11 ON bwc11.metric_key = 'CURRICULUM_RELEVANCE_COMPLAINT_RATE'
LEFT JOIN barriers_weights_config bwc12 ON bwc12.metric_key = 'LOW_KNOWLEDGE_RETENTION_RATE'
ON CONFLICT ("Project ID", "Branch ID") DO UPDATE SET
  "KRI: FRAUD INCIDENT RATE_Value" = EXCLUDED."KRI: FRAUD INCIDENT RATE_Value",
  "KRI: FRAUD INCIDENT RATE_Weight" = EXCLUDED."KRI: FRAUD INCIDENT RATE_Weight",
  "KRI: TRUST EROSION IN MFIs_Value" = EXCLUDED."KRI: TRUST EROSION IN MFIs_Value",
  "KRI: TRUST EROSION IN MFIs_Weight" = EXCLUDED."KRI: TRUST EROSION IN MFIs_Weight",
  "KRI: MEMBERS LOAN COST_Value" = EXCLUDED."KRI: MEMBERS LOAN COST_Value",
  "KRI: MEMBERS LOAN COST_Weight" = EXCLUDED."KRI: MEMBERS LOAN COST_Weight",
  "KRI: HAND IN HAND LOAN COST_Value" = EXCLUDED."KRI: HAND IN HAND LOAN COST_Value",
  "KRI: HAND IN HAND LOAN COST_Weight" = EXCLUDED."KRI: HAND IN HAND LOAN COST_Weight",
  "KRI: MFI LOAN SERVICE COST_Value" = EXCLUDED."KRI: MFI LOAN SERVICE COST_Value",
  "KRI: MFI LOAN SERVICE COST_Weight" = EXCLUDED."KRI: MFI LOAN SERVICE COST_Weight",
  "KRI: DOCUMENTATION DELAY RATE_Value" = EXCLUDED."KRI: DOCUMENTATION DELAY RATE_Value",
  "KRI: DOCUMENTATION DELAY RATE_Weight" = EXCLUDED."KRI: DOCUMENTATION DELAY RATE_Weight",
  "KRI: GENDER BASED BARRIER RATE_Value" = EXCLUDED."KRI: GENDER BASED BARRIER RATE_Value",
  "KRI: GENDER BASED BARRIER RATE_Weight" = EXCLUDED."KRI: GENDER BASED BARRIER RATE_Weight",
  "KRI: FAMILY AND COMMUNITY BARRIER RATE_Value" = EXCLUDED."KRI: FAMILY AND COMMUNITY BARRIER RATE_Value",
  "KRI: FAMILY AND COMMUNITY BARRIER RATE_Weight" = EXCLUDED."KRI: FAMILY AND COMMUNITY BARRIER RATE_Weight",
  "KRI: TRAINEE DROPOUT RATE(1)_Value" = EXCLUDED."KRI: TRAINEE DROPOUT RATE(1)_Value",
  "KRI: TRAINEE DROPOUT RATE(1)_Weight" = EXCLUDED."KRI: TRAINEE DROPOUT RATE(1)_Weight",
  "KRI: TRAINER DROPOUT RATE(2)_Value" = EXCLUDED."KRI: TRAINER DROPOUT RATE(2)_Value",
  "KRI: TRAINER DROPOUT RATE(2)_Weight" = EXCLUDED."KRI: TRAINER DROPOUT RATE(2)_Weight",
  "KRI: CARRICULUM RELEVANCE COMPLAINT RATE_Value" = EXCLUDED."KRI: CARRICULUM RELEVANCE COMPLAINT RATE_Value",
  "KRI: CARRICULUM RELEVANCE COMPLAINT RATE_Weight" = EXCLUDED."KRI: CARRICULUM RELEVANCE COMPLAINT RATE_Weight",
  "KRI: LOW KNOWLEDGE RETENTION RATE_Value" = EXCLUDED."KRI: LOW KNOWLEDGE RETENTION RATE_Value",
  "KRI: LOW KNOWLEDGE RETENTION RATE_Weight" = EXCLUDED."KRI: LOW KNOWLEDGE RETENTION RATE_Weight",
  updated_at = NOW();

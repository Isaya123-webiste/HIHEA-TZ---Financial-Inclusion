-- Populate Barriers table with SUB FACTOR values and weights

UPDATE "Barriers" b
SET
  -- SUB FACTOR: INCOME LEVEL
  "SUB FACTOR: INCOME LEVEL_Value" = ROUND(
    1 * (
      (COALESCE("KPI: VALUE CHAIN DIVERSIFICATION RATE_Value", 0) * COALESCE("KPI: VALUE CHAIN DIVERSIFICATION RATE_Weight", 0)) +
      (COALESCE("KPI: STARTUP LEVEL RATE_Value", 0) * COALESCE("KPI: STARTUP LEVEL RATE_Weight", 0)) +
      (COALESCE("KPI: ACCELERATION LEVEL RATE_Value", 0) * COALESCE("KPI: ACCELERATION LEVEL RATE_Weight", 0))
    ), 4
  ),
  "SUB FACTOR: INCOME LEVEL_Weight" = COALESCE(
    (SELECT weight_value FROM barriers_weights_config WHERE metric_key = 'INCOME_LEVEL' AND category = 'SUB_FACTOR' LIMIT 1),
    0
  ),

  -- SUB FACTOR: DISTANCE (Default to 1, no calculation)
  "SUB FACTOR: DISTANCE_Value" = 1.0,
  "SUB FACTOR: DISTANCE_Weight" = COALESCE(
    (SELECT weight_value FROM barriers_weights_config WHERE metric_key = 'DISTANCE' AND category = 'SUB_FACTOR' LIMIT 1),
    0
  ),

  -- SUB FACTOR: TRUST
  "SUB FACTOR: TRUST_Value" = ROUND(
    1 * (
      ((1 - COALESCE("KRI: FRAUD INCIDENT RATE_Value", 0)) * COALESCE("KRI: FRAUD INCIDENT RATE_Weight", 0)) +
      ((1 - COALESCE("KRI: TRUST EROSION IN MFIs_Value", 0)) * COALESCE("KRI: TRUST EROSION IN MFIs_Weight", 0))
    ), 4
  ),
  "SUB FACTOR: TRUST_Weight" = COALESCE(
    (SELECT weight_value FROM barriers_weights_config WHERE metric_key = 'TRUST' AND category = 'SUB_FACTOR' LIMIT 1),
    0
  ),

  -- SUB FACTOR: COSTS
  "SUB FACTOR: COSTS_Value" = ROUND(
    1 * (
      ((1 - COALESCE("KRI: MEMBERS LOAN COST_Value", 0)) * COALESCE("KRI: MEMBERS LOAN COST_Weight", 0)) +
      ((1 - COALESCE("KRI: HAND IN HAND LOAN COST_Value", 0)) * COALESCE("KRI: HAND IN HAND LOAN COST_Weight", 0)) +
      ((1 - COALESCE("KRI: MFI LOAN SERVICE COST_Value", 0)) * COALESCE("KRI: MFI LOAN SERVICE COST_Weight", 0))
    ), 4
  ),
  "SUB FACTOR: COSTS_Weight" = COALESCE(
    (SELECT weight_value FROM barriers_weights_config WHERE metric_key = 'COSTS' AND category = 'SUB_FACTOR' LIMIT 1),
    0
  ),

  -- SUB FACTOR: REGISTRATION
  "SUB FACTOR: REGISTRATION_Value" = ROUND(
    1 * (
      ((1 - COALESCE("KRI: DOCUMENTATION DELAY RATE_Value", 0)) * COALESCE("KRI: DOCUMENTATION DELAY RATE_Weight", 0))
    ), 4
  ),
  "SUB FACTOR: REGISTRATION_Weight" = COALESCE(
    (SELECT weight_value FROM barriers_weights_config WHERE metric_key = 'REGISTRATION' AND category = 'SUB_FACTOR' LIMIT 1),
    0
  ),

  -- SUB FACTOR: SOCIAL AND CULTURAL FACTORS
  "SUB FACTOR: SOCIAL AND CULTURAL FACTORS_Value" = ROUND(
    1 * (
      ((1 - COALESCE("KRI: GENDER BASED BARRIER RATE_Value", 0)) * COALESCE("KRI: GENDER BASED BARRIER RATE_Weight", 0)) +
      ((1 - COALESCE("KRI: FAMILY AND COMMUNITY BARRIER RATE_Value", 0)) * COALESCE("KRI: FAMILY AND COMMUNITY BARRIER RATE_Weight", 0))
    ), 4
  ),
  "SUB FACTOR: SOCIAL AND CULTURAL FACTORS_Weight" = COALESCE(
    (SELECT weight_value FROM barriers_weights_config WHERE metric_key = 'SOCIAL_AND_CULTURAL_FACTORS' AND category = 'SUB_FACTOR' LIMIT 1),
    0
  ),

  -- SUB FACTOR: FINANCIAL LITERACY
  "SUB FACTOR: FINANCIAL LITERACY_Value" = ROUND(
    1 * (
      ((1 - COALESCE("KRI: TRAINEE DROPOUT RATE(1)_Value", 0)) * COALESCE("KRI: TRAINEE DROPOUT RATE(1)_Weight", 0)) +
      ((1 - COALESCE("KRI: TRAINER DROPOUT RATE(2)_Value", 0)) * COALESCE("KRI: TRAINER DROPOUT RATE(2)_Weight", 0)) +
      ((1 - COALESCE("KRI: CARRICULUM RELEVANCE COMPLAINT RATE_Value", 0)) * COALESCE("KRI: CARRICULUM RELEVANCE COMPLAINT RATE_Weight", 0)) +
      ((1 - COALESCE("KRI: LOW KNOWLEDGE RETENTION RATE_Value", 0)) * COALESCE("KRI: LOW KNOWLEDGE RETENTION RATE_Weight", 0))
    ), 4
  ),
  "SUB FACTOR: FINANCIAL LITERACY_Weight" = COALESCE(
    (SELECT weight_value FROM barriers_weights_config WHERE metric_key = 'FINANCIAL_LITERACY' AND category = 'SUB_FACTOR' LIMIT 1),
    0
  );

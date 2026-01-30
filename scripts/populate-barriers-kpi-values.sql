-- Populate Barriers table with KPI values calculated from branch_reports data
-- and weights from barriers_weights_config

UPDATE "Barriers" b
SET
  -- KPI Values
  "KPI: VALUE CHAIN DIVERSIFICATION RATE_Value" = CASE
    WHEN br.members_received_loans = 0 OR br.members_received_loans IS NULL THEN 0
    ELSE ROUND((COALESCE(br.loan_uses, 0)::numeric / br.members_received_loans::numeric) * 100, 2)
  END,
  "KPI: STARTUP LEVEL RATE_Value" = 1.0,
  "KPI: ACCELERATION LEVEL RATE_Value" = 1.0,
  -- KPI Weights (fetch from barriers_weights_config)
  "KPI: VALUE CHAIN DIVERSIFICATION RATE_Weight" = COALESCE(
    (SELECT weight_value FROM barriers_weights_config WHERE metric_key = 'VALUE_CHAIN_DIVERSIFICATION_RATE' AND category = 'KPI' LIMIT 1),
    0
  ),
  "KPI: STARTUP LEVEL RATE_Weight" = COALESCE(
    (SELECT weight_value FROM barriers_weights_config WHERE metric_key = 'STARTUP_LEVEL_RATE' AND category = 'KPI' LIMIT 1),
    0
  ),
  "KPI: ACCELERATION LEVEL RATE_Weight" = COALESCE(
    (SELECT weight_value FROM barriers_weights_config WHERE metric_key = 'ACCELERATION_LEVEL_RATE' AND category = 'KPI' LIMIT 1),
    0
  )
FROM branch_reports br
WHERE b."Branch ID" = br.branch_id
  AND b."Project ID" IS NOT DISTINCT FROM br.project_id;

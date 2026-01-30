-- Check Barriers table KPI columns and current data
-- 1. Check if KPI columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Barriers' 
AND column_name LIKE '%KPI%'
ORDER BY column_name;

-- 2. Check Barriers table for KPI NULL values
SELECT 
  "Project ID",
  "Branch ID",
  "KPI: VALUE CHAIN DIVERSIFICATION RATE_Value",
  "KPI: STARTUP LEVEL RATE_Value",
  "KPI: ACCELERATION LEVEL RATE_Value"
FROM "Barriers"
LIMIT 5;

-- 3. Check the corresponding branch_reports data
SELECT 
  br.branch_id,
  br.project_id,
  br.loan_uses,
  br.members_received_loans,
  CASE 
    WHEN br.members_received_loans = 0 OR br.members_received_loans IS NULL THEN 'DIV_BY_ZERO'
    ELSE 'OK' 
  END as calc_status
FROM branch_reports br
LIMIT 5;

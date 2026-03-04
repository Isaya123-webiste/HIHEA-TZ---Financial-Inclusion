-- Migration to update loan fields to numeric 0-1 format
-- loan_cost_high and loan_uses should only accept 0 or 1

-- Update form_submissions table to ensure numeric values and cap at 1
UPDATE form_submissions
SET form_data = jsonb_set(
  form_data,
  '{loan_uses}',
  CASE 
    WHEN (form_data->>'loan_uses')::int > 1 THEN '1'::jsonb
    WHEN (form_data->>'loan_uses')::int < 0 THEN '0'::jsonb
    ELSE form_data->'loan_uses'
  END
)
WHERE form_data->>'loan_uses' IS NOT NULL
  AND (form_data->>'loan_uses')::int != 0 AND (form_data->>'loan_uses')::int != 1;

-- Convert loan_cost_high from string ("High"/"Low") to numeric (0/1)
-- High = 1, Low = 0
UPDATE form_submissions
SET form_data = jsonb_set(
  form_data,
  '{loan_cost_high}',
  CASE 
    WHEN form_data->>'loan_cost_high' = 'High' THEN '1'::jsonb
    WHEN form_data->>'loan_cost_high' = 'Low' THEN '0'::jsonb
    WHEN (form_data->>'loan_cost_high')::int > 1 THEN '1'::jsonb
    WHEN (form_data->>'loan_cost_high')::int < 0 THEN '0'::jsonb
    ELSE form_data->'loan_cost_high'
  END
)
WHERE form_data->>'loan_cost_high' IS NOT NULL;

-- Verify the migrations
SELECT COUNT(*) as total_records FROM form_submissions;

SELECT COUNT(*) as loan_uses_fixed
FROM form_submissions
WHERE form_data->>'loan_uses' IN ('0', '1');

SELECT COUNT(*) as loan_cost_high_fixed
FROM form_submissions
WHERE form_data->>'loan_cost_high' IN ('0', '1') 
   OR form_data->>'loan_cost_high' IS NULL;

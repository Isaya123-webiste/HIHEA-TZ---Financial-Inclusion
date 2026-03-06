-- Migration to update loan fields correctly
-- loan_uses: numeric (0 or 1 only) - binary yes/no field
-- loan_cost_high: numeric (any positive number) - actual cost value field

-- Check current data
SELECT COUNT(*) as total_records FROM form_submissions WHERE form_type = 'Create Financial Inclusion Report';

-- Update form_submissions to ensure loan_uses is 0 or 1 only
UPDATE form_submissions 
SET form_data = jsonb_set(
  form_data,
  '{loan_uses}',
  '0'::jsonb
)
WHERE form_type = 'Create Financial Inclusion Report'
  AND form_data->>'loan_uses' IS NOT NULL
  AND (form_data->>'loan_uses')::integer NOT IN (0, 1);

-- Convert any non-numeric loan_cost_high values (like "High"/"Low" strings) to NULL
UPDATE form_submissions 
SET form_data = jsonb_set(
  form_data,
  '{loan_cost_high}',
  'null'::jsonb
)
WHERE form_type = 'Create Financial Inclusion Report'
  AND form_data->>'loan_cost_high' IS NOT NULL
  AND NOT (form_data->>'loan_cost_high' ~ '^\d+(\.\d+)?$');

-- Ensure loan_cost_high is non-negative (cap negative values at 0)
UPDATE form_submissions 
SET form_data = jsonb_set(
  form_data,
  '{loan_cost_high}',
  '0'::jsonb
)
WHERE form_type = 'Create Financial Inclusion Report'
  AND form_data->>'loan_cost_high' IS NOT NULL
  AND (form_data->>'loan_cost_high')::numeric < 0;

-- Verify the migrations
SELECT COUNT(*) as total_records FROM form_submissions WHERE form_type = 'Create Financial Inclusion Report';

SELECT COUNT(*) as loan_uses_valid
FROM form_submissions
WHERE form_type = 'Create Financial Inclusion Report'
  AND (form_data->>'loan_uses')::integer IN (0, 1);

SELECT COUNT(*) as loan_cost_high_valid
FROM form_submissions
WHERE form_type = 'Create Financial Inclusion Report'
  AND (form_data->>'loan_cost_high' IS NULL OR form_data->>'loan_cost_high' ~ '^\d+(\.\d+)?$');

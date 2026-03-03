-- Migration script to update existing form data
-- Convert loan_cost_high from numeric to text (High/Low only)
-- Cap loan_uses at maximum of 2

-- First, check the current data
SELECT COUNT(*) as total_records FROM form_submissions WHERE form_type = 'Create Financial Inclusion Report';

-- Update form_submissions to cap loan_uses at 2 (in form_data JSONB)
UPDATE form_submissions 
SET form_data = jsonb_set(
  form_data,
  '{loan_uses}',
  '2'::jsonb
)
WHERE form_type = 'Create Financial Inclusion Report'
  AND (form_data->>'loan_uses')::integer > 2;

-- Clear numeric loan_cost_high column (convert to null) since field is now a dropdown
UPDATE form_submissions 
SET loan_cost_high = NULL
WHERE form_type = 'Create Financial Inclusion Report'
  AND loan_cost_high IS NOT NULL;

-- Update loan_cost_high in form_data JSONB to null if it's numeric
UPDATE form_submissions 
SET form_data = jsonb_set(
  form_data,
  '{loan_cost_high}',
  'null'::jsonb
)
WHERE form_type = 'Create Financial Inclusion Report'
  AND form_data->>'loan_cost_high' ~ '^\d+$';

-- Verify the updates
SELECT COUNT(*) as capped_loan_uses FROM form_submissions 
WHERE form_type = 'Create Financial Inclusion Report'
  AND (form_data->>'loan_uses')::integer = 2;

SELECT COUNT(*) as cleared_loan_cost FROM form_submissions 
WHERE form_type = 'Create Financial Inclusion Report'
  AND loan_cost_high IS NULL;

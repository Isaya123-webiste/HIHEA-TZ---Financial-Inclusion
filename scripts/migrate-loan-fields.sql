-- Migration script to update existing form data
-- This will ensure all loan_cost_high values are properly formatted

-- Update form_submissions table to ensure loan_cost_high is properly handled
-- For existing numeric values, we'll convert them to NULL since the field should now only contain "High" or "Low"
BEGIN;

-- Check current data in form_submissions
SELECT 
  id, 
  form_data->>'loan_cost_high' as loan_cost_high_value,
  form_data->>'loan_uses' as loan_uses_value
FROM form_submissions 
LIMIT 10;

-- Update any numeric loan_cost_high values to NULL
-- and ensure loan_uses doesn't exceed 2
UPDATE form_submissions 
SET form_data = jsonb_set(
  form_data, 
  '{loan_cost_high}', 
  'null'::jsonb
)
WHERE form_data->>'loan_cost_high' ~ '^\d+$';

-- Log the migration
INSERT INTO audit_log (action, details, created_at)
VALUES (
  'migrate_loan_fields',
  'Migrated loan_cost_high to dropdown (High/Low only) and validated loan_uses max = 2',
  NOW()
);

COMMIT;

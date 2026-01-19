-- Fix NULL values in submitted_by, date_loan_applied, and date_loan_received
-- This script updates existing form submissions that have NULL values

BEGIN;

-- Update submitted_by with created_by value
UPDATE form_submissions
SET submitted_by = created_by
WHERE submitted_by IS NULL AND created_by IS NOT NULL;

-- Update date_loan_applied from form_data JSON
UPDATE form_submissions
SET date_loan_applied = (form_data ->> 'date_loan_applied')::date
WHERE date_loan_applied IS NULL 
  AND form_data ->> 'date_loan_applied' IS NOT NULL
  AND form_data ->> 'date_loan_applied' != '';

-- Update date_loan_received from form_data JSON
UPDATE form_submissions
SET date_loan_received = (form_data ->> 'date_loan_received')::date
WHERE date_loan_received IS NULL 
  AND form_data ->> 'date_loan_received' IS NOT NULL
  AND form_data ->> 'date_loan_received' != '';

COMMIT;

-- If you have existing data in a combined field, you can migrate it
-- This is optional and only needed if you have existing data to split

-- First, let's see if there are any records with data in loan_cost_high that might need splitting
SELECT 
    id,
    loan_cost_high,
    LENGTH(loan_cost_high) as text_length
FROM form_submissions 
WHERE loan_cost_high IS NOT NULL 
AND loan_cost_high != ''
LIMIT 10;

-- If you need to migrate data from a previously combined field, 
-- you would do something like this (adjust as needed):
-- UPDATE form_submissions 
-- SET explain_barriers = 'Migrated from combined field'
-- WHERE loan_cost_high LIKE '%barrier%' OR loan_cost_high LIKE '%explain%';

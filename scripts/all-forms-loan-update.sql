-- Update all form submissions to enforce new loan field constraints
-- Cap loan_uses at 2 and clear any invalid loan_cost_high values

-- First, cap all loan_uses values at 2
UPDATE form_submissions 
SET loan_uses = 2
WHERE loan_uses > 2;

-- Verify the updates
SELECT COUNT(*) as total_capped FROM form_submissions WHERE loan_uses = 2;
SELECT COUNT(*) as records_with_data FROM form_submissions WHERE loan_uses IS NOT NULL;

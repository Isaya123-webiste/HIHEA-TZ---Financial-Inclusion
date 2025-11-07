-- Replace loan_cost_barriers column with loan_cost_high in form_submissions table
ALTER TABLE form_submissions 
DROP COLUMN IF EXISTS loan_cost_barriers;

ALTER TABLE form_submissions 
ADD COLUMN loan_cost_high TEXT NOT NULL DEFAULT '';

-- Update any existing data if needed (this is safe since we're replacing the column)
-- No data migration needed since we're replacing one text field with another

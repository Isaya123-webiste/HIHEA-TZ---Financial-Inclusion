-- Add the new column for explaining barriers
ALTER TABLE form_submissions
ADD COLUMN explain_barriers TEXT DEFAULT '' AFTER loan_cost_high;

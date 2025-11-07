-- Add explain_barriers column to form_submissions table if it doesn't exist
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS explain_barriers TEXT;

-- Update any existing records to have empty string instead of null
UPDATE form_submissions 
SET explain_barriers = '' 
WHERE explain_barriers IS NULL;

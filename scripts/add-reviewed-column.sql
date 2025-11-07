-- Add reviewed column to form_submissions table
ALTER TABLE form_submissions
ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT FALSE;

-- Add reviewed_by_assistance column to track who marked it as read
ALTER TABLE form_submissions  
ADD COLUMN IF NOT EXISTS reviewed_by_assistance UUID REFERENCES profiles(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_reviewed ON form_submissions(reviewed);

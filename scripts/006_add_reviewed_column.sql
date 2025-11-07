-- Add reviewed column to form_submissions table
-- This allows assistance program officers to mark forms as reviewed

ALTER TABLE form_submissions
ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT FALSE;

-- Add column to track who reviewed it
ALTER TABLE form_submissions
ADD COLUMN IF NOT EXISTS reviewed_by_assistance UUID REFERENCES profiles(id);

-- Add timestamp for when it was reviewed
ALTER TABLE form_submissions
ADD COLUMN IF NOT EXISTS reviewed_at_assistance TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_reviewed ON form_submissions(reviewed);

-- Update existing forms to set reviewed as false
UPDATE form_submissions SET reviewed = FALSE WHERE reviewed IS NULL;

COMMENT ON COLUMN form_submissions.reviewed IS 'Indicates if an assistance program officer has reviewed this form';
COMMENT ON COLUMN form_submissions.reviewed_by_assistance IS 'UUID of the assistance program officer who reviewed the form';
COMMENT ON COLUMN form_submissions.reviewed_at_assistance IS 'Timestamp when the form was marked as reviewed by assistance program officer';

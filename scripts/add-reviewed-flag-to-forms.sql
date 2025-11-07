-- Add reviewed flag to form_submissions table
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS reviewed_by_assistant BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS assistant_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assistant_reviewer_id UUID REFERENCES auth.users(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_form_submissions_reviewed_by_assistant ON form_submissions(reviewed_by_assistant);

-- Add comment
COMMENT ON COLUMN form_submissions.reviewed_by_assistant IS 'Indicates if form has been reviewed by Assistance Program Officer';
COMMENT ON COLUMN form_submissions.assistant_reviewed_at IS 'Timestamp when form was marked as reviewed by assistant';
COMMENT ON COLUMN form_submissions.assistant_reviewer_id IS 'ID of the Assistance Program Officer who reviewed the form';

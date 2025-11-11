-- Add is_read column to form_submissions table
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Add reviewed_by column to track who marked it as read
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- Add reviewed_at timestamp
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_form_submissions_is_read 
ON form_submissions(is_read);

-- Update existing records
UPDATE form_submissions 
SET is_read = FALSE 
WHERE is_read IS NULL;

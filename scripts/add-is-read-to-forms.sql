-- Add is_read column to form_submissions table
-- Run this script to enable the "Mark as Read" functionality

ALTER TABLE form_submissions
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_is_read 
ON form_submissions(is_read);

-- Add column to track who marked it as read
ALTER TABLE form_submissions
ADD COLUMN IF NOT EXISTS read_by UUID REFERENCES profiles(id);

-- Add timestamp for when it was marked as read
ALTER TABLE form_submissions
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

COMMENT ON COLUMN form_submissions.is_read IS 'Whether the form has been reviewed by assistance program officer';
COMMENT ON COLUMN form_submissions.read_by IS 'User ID of who marked the form as read';
COMMENT ON COLUMN form_submissions.read_at IS 'Timestamp when the form was marked as read';

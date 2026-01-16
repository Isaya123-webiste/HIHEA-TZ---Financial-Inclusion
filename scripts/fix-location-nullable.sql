-- Make location column nullable in form_submissions table
ALTER TABLE form_submissions
ALTER COLUMN location DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'form_submissions' AND column_name = 'location';

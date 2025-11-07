-- Check the current structure of the form_submissions table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'form_submissions' 
ORDER BY ordinal_position;

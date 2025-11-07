-- Check if form_submissions table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'form_submissions'
ORDER BY ordinal_position;

-- Check if there are any tables that might contain form data
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%form%' OR table_name LIKE '%submission%';

-- Check existing data structure if any
SELECT * FROM form_submissions LIMIT 1;

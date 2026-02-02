-- Check what columns exist in Barriers table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Barriers' 
AND column_name LIKE '%KRI%' 
ORDER BY ordinal_position;

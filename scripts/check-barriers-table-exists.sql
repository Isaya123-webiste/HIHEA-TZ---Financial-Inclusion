-- Check if barriers table exists and list all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%barrier%'
ORDER BY table_name;

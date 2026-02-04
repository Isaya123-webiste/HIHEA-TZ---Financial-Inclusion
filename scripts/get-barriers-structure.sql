SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Barriers'
ORDER BY ordinal_position;

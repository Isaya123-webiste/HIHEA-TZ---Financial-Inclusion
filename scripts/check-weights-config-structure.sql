-- Check the structure and data of barriers_weights_config table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'barriers_weights_config'
ORDER BY ordinal_position;

-- Check a sample row
SELECT * FROM barriers_weights_config LIMIT 1;

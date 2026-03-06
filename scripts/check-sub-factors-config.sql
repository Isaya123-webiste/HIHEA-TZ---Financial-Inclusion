-- Check what SUB FACTOR entries exist in barriers_weights_config
SELECT DISTINCT metric_key, category, weight_value 
FROM barriers_weights_config 
WHERE category = 'SUB_FACTOR' 
ORDER BY metric_key;

-- Check Barriers table columns to see what sub-factor columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Barriers' AND column_name ILIKE '%SUB FACTOR%'
ORDER BY column_name;

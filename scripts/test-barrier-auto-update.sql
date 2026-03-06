-- Test 1: Get barrier record before weight update
SELECT id, "BARRIERS_Value", "BARRIERS_Weight", "Barriers_Actual_Data"
FROM "Barriers" 
LIMIT 1;

-- Test 2: Check current BARRIERS weight in config
SELECT metric_key, weight_value FROM barriers_weights_config 
WHERE metric_key = 'BARRIERS' AND category = 'MAIN_FACTOR';

-- Test 3: Update BARRIERS weight
UPDATE barriers_weights_config 
SET weight_value = 0.25
WHERE metric_key = 'BARRIERS' AND category = 'MAIN_FACTOR';

-- Test 4: Get barrier record after weight update (should be recalculated automatically)
SELECT id, "BARRIERS_Value", "BARRIERS_Weight", "Barriers_Actual_Data"
FROM "Barriers" 
LIMIT 1;

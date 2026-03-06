-- Test: Verify barriers_weights_config trigger automatically updates Barriers records

-- Step 1: Get current values from first Barriers record
SELECT 
  id,
  "BARRIERS_Value",
  "BARRIERS_Weight",
  "Barriers_Actual_Data"
FROM "Barriers"
LIMIT 1;

-- Step 2: Save current BARRIERS weight value
SELECT weight_value as current_barriers_weight 
FROM barriers_weights_config 
WHERE metric_key = 'BARRIERS' AND category = 'MAIN_FACTOR';

-- Step 3: Update BARRIERS weight to a test value (0.25)
UPDATE barriers_weights_config 
SET weight_value = 0.25 
WHERE metric_key = 'BARRIERS' AND category = 'MAIN_FACTOR';

-- Step 4: Check if Barriers records were automatically updated with new weight
SELECT 
  COUNT(*) as total_barriers_records,
  COUNT(CASE WHEN "BARRIERS_Weight" = 0.25 THEN 1 END) as updated_with_new_weight
FROM "Barriers";

-- Step 5: Get the same barrier record again to verify values changed
SELECT 
  id,
  "BARRIERS_Value",
  "BARRIERS_Weight",
  "Barriers_Actual_Data"
FROM "Barriers"
LIMIT 1;

-- Step 6: Restore original BARRIERS weight value (0.20)
UPDATE barriers_weights_config 
SET weight_value = 0.20 
WHERE metric_key = 'BARRIERS' AND category = 'MAIN_FACTOR';

-- Step 7: Verify restoration
SELECT weight_value as restored_barriers_weight 
FROM barriers_weights_config 
WHERE metric_key = 'BARRIERS' AND category = 'MAIN_FACTOR';

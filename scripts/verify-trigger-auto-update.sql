-- Step 1: Get a sample Barriers record BEFORE updating weights
SELECT id, "BARRIERS_Value", "BARRIERS_Weight", "Barriers_Actual_Data" 
FROM "Barriers" 
LIMIT 1;

-- Step 2: Store the current BARRIERS weight value
SELECT weight_value as current_barriers_weight 
FROM barriers_weights_config 
WHERE metric_key = 'BARRIERS' AND category = 'MAIN_FACTOR';

-- Step 3: Update the BARRIERS weight to a new value (this should trigger the update)
UPDATE barriers_weights_config 
SET weight_value = 0.25 
WHERE metric_key = 'BARRIERS' AND category = 'MAIN_FACTOR';

-- Step 4: Verify that BARRIERS_Weight was updated in Barriers table
SELECT id, "BARRIERS_Value", "BARRIERS_Weight", "Barriers_Actual_Data" 
FROM "Barriers" 
LIMIT 1;

-- Step 5: Verify the weight in config was updated
SELECT weight_value as new_barriers_weight 
FROM barriers_weights_config 
WHERE metric_key = 'BARRIERS' AND category = 'MAIN_FACTOR';

-- Step 6: Revert the weight back to original value
UPDATE barriers_weights_config 
SET weight_value = 0.20 
WHERE metric_key = 'BARRIERS' AND category = 'MAIN_FACTOR';

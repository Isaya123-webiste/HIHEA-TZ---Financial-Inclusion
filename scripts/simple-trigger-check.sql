-- Step 1: Get current BARRIERS weight from config
SELECT 'CURRENT BARRIERS WEIGHT:' as step, weight_value
FROM barriers_weights_config
WHERE metric_key = 'BARRIERS' AND category = 'MAIN_FACTOR';

-- Step 2: Get a sample Barriers record before weight update
SELECT 'SAMPLE BARRIERS RECORD BEFORE UPDATE:' as step, 
       "Project ID", 
       "Branch ID",
       "BARRIERS_Value",
       "BARRIERS_Weight",
       "Barriers_Actual_Data"
FROM "Barriers"
LIMIT 1;

-- Step 3: Update BARRIERS weight to test the trigger
UPDATE barriers_weights_config
SET weight_value = 0.25
WHERE metric_key = 'BARRIERS' AND category = 'MAIN_FACTOR';

-- Step 4: Check if weight was updated
SELECT 'UPDATED BARRIERS WEIGHT:' as step, weight_value
FROM barriers_weights_config
WHERE metric_key = 'BARRIERS' AND category = 'MAIN_FACTOR';

-- Step 5: Get the same Barriers record after weight update to see if it was recalculated
SELECT 'SAMPLE BARRIERS RECORD AFTER UPDATE:' as step,
       "Project ID", 
       "Branch ID",
       "BARRIERS_Value",
       "BARRIERS_Weight",
       "Barriers_Actual_Data"
FROM "Barriers"
LIMIT 1;

-- Step 6: Verify trigger is working by checking if BARRIERS_Weight changed in all records
SELECT 'VERIFICATION - All Barriers records should have BARRIERS_Weight = 0.25:' as step,
       COUNT(*) as total_records,
       COUNT(CASE WHEN "BARRIERS_Weight" = 0.25 THEN 1 END) as records_with_new_weight,
       COUNT(CASE WHEN "BARRIERS_Weight" = 0.25 THEN 1 END) = COUNT(*) as trigger_working
FROM "Barriers";

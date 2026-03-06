-- Test the barriers_weights_config trigger
-- Step 1: Get a sample Barriers record BEFORE updating weight
SELECT 
  id,
  "BARRIERS_Value",
  "BARRIERS_Weight",
  "Barriers_Actual_Data"
FROM "Barriers"
LIMIT 1;

-- Step 2: Update a SUB FACTOR weight in barriers_weights_config
UPDATE barriers_weights_config
SET weight_value = 0.15
WHERE metric_key = 'INCOME_LEVEL' AND category = 'SUB_FACTOR';

-- Step 3: Get the same Barriers record AFTER updating weight to verify it was recalculated
SELECT 
  id,
  "BARRIERS_Value",
  "BARRIERS_Weight",
  "Barriers_Actual_Data",
  "SUB FACTOR: INCOME LEVEL_Weight"
FROM "Barriers"
LIMIT 1;

-- Step 4: Verify barriers_weights_config was updated
SELECT weight_value FROM barriers_weights_config 
WHERE metric_key = 'INCOME_LEVEL' AND category = 'SUB_FACTOR';

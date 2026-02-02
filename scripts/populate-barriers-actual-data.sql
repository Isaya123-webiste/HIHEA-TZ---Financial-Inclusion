-- Populate Barriers_Actual_Data for all existing records
-- Formula: Barriers_Actual_Data = BARRIERS_Value * BARRIERS_Weight

UPDATE "Barriers"
SET "Barriers_Actual_Data" = ROUND("BARRIERS_Value" * "BARRIERS_Weight", 4)
WHERE "BARRIERS_Value" IS NOT NULL AND "BARRIERS_Weight" IS NOT NULL;

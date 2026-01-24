-- Clear BARRIERS_Value and BARRIERS_Weight from existing Barriers table rows
UPDATE "Barriers"
SET 
  "BARRIERS_Value" = NULL,
  "BARRIERS_Weight" = NULL,
  updated_at = NOW()
WHERE "BARRIERS_Value" IS NOT NULL OR "BARRIERS_Weight" IS NOT NULL;

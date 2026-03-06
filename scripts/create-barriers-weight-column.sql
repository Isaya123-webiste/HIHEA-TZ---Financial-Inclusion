-- Add BARRIERS_Weight column if it doesn't exist
ALTER TABLE "Barriers" 
ADD COLUMN IF NOT EXISTS "BARRIERS_Weight" NUMERIC;

-- Populate BARRIERS_Weight with value from barriers_weights_config
UPDATE "Barriers" b
SET "BARRIERS_Weight" = COALESCE(
  (SELECT weight_value FROM barriers_weights_config WHERE metric_key = 'BARRIERS' AND category = 'OVERALL' LIMIT 1),
  0
);

COMMIT;

-- Create BARRIERS_Value column if it doesn't exist
ALTER TABLE "Barriers"
ADD COLUMN IF NOT EXISTS "BARRIERS_Value" NUMERIC DEFAULT 0;

-- Create index on BARRIERS_Value for better query performance
CREATE INDEX IF NOT EXISTS idx_barriers_value ON "Barriers" ("BARRIERS_Value");

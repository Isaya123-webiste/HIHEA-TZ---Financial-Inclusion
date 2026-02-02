-- Create Barriers_Actual_Data column if it doesn't exist
ALTER TABLE "Barriers"
ADD COLUMN IF NOT EXISTS "Barriers_Actual_Data" NUMERIC DEFAULT 0;

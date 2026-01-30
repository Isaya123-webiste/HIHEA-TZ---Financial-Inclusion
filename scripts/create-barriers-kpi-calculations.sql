-- Add KPI calculations to update_barriers_kri_values function
-- KPI: VALUE CHAIN DIVERSIFICATION RATE_Value = loan_uses ÷ members_received_loans
-- KPI: STARTUP LEVEL RATE = 1 (fixed value)
-- KPI: ACCELERATION LEVEL RATE = 1 (fixed value)

-- Add these KPI columns to Barriers table if they don't exist
ALTER TABLE "Barriers" ADD COLUMN IF NOT EXISTS "KPI: VALUE CHAIN DIVERSIFICATION RATE_Value" NUMERIC DEFAULT 0;
ALTER TABLE "Barriers" ADD COLUMN IF NOT EXISTS "KPI: STARTUP LEVEL RATE_Value" NUMERIC DEFAULT 1;
ALTER TABLE "Barriers" ADD COLUMN IF NOT EXISTS "KPI: ACCELERATION LEVEL RATE_Value" NUMERIC DEFAULT 1;

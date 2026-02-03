-- Test the weights config trigger by checking barriers before and after weight update
-- First, get a sample barrier record before weight update
SELECT 
  id,
  "BARRIERS_Value",
  "BARRIERS_Weight",
  "Barriers_Actual_Data"
FROM barriers
LIMIT 1;

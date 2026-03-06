SELECT 
  "Branch ID",
  "BARRIERS_Value",
  "BARRIERS_Weight",
  "Barriers_Actual_Data",
  ROUND("BARRIERS_Value" * "BARRIERS_Weight", 4) as calculated_value,
  CASE 
    WHEN "Barriers_Actual_Data" = ROUND("BARRIERS_Value" * "BARRIERS_Weight", 4) THEN 'CORRECT'
    ELSE 'MISMATCH'
  END as verification
FROM "Barriers"
LIMIT 5;

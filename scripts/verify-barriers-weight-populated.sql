-- Verify BARRIERS_Weight has been populated
SELECT 
  "Branch ID",
  "Project ID",
  "BARRIERS_Value",
  "BARRIERS_Weight",
  CASE 
    WHEN "BARRIERS_Weight" IS NULL THEN 'EMPTY'
    WHEN "BARRIERS_Weight" = 0.20 THEN 'CORRECT'
    ELSE 'UNEXPECTED'
  END AS weight_status
FROM "Barriers"
LIMIT 5;

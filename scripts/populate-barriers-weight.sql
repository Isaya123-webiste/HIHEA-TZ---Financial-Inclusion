-- Populate BARRIERS_Weight column in Barriers table from barriers_weights_config
UPDATE "Barriers"
SET
  "BARRIERS_Weight" = COALESCE(
    (SELECT weight_value::numeric FROM barriers_weights_config 
     WHERE metric_key = 'BARRIERS' AND category = 'MAIN_FACTOR' LIMIT 1),
    0.20
  );

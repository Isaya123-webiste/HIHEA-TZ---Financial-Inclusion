-- Create function to recalculate Barriers when weights are updated
CREATE OR REPLACE FUNCTION recalculate_barriers_on_weight_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger the update_barriers_kri_values function for all Barriers records
  -- This will recalculate all values and weights based on the new config
  UPDATE "Barriers"
  SET "updated_at" = NOW()
  WHERE branch_id IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires when barriers_weights_config is updated
DROP TRIGGER IF EXISTS trigger_barriers_weights_config_updated ON barriers_weights_config;
CREATE TRIGGER trigger_barriers_weights_config_updated
AFTER UPDATE ON barriers_weights_config
FOR EACH ROW
EXECUTE FUNCTION recalculate_barriers_on_weight_change();

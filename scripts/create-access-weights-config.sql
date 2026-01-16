-- Create access_weights_config table (similar structure to usage_weights_config)
CREATE TABLE IF NOT EXISTS access_weights_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  metric_name VARCHAR(255) NOT NULL,
  metric_key VARCHAR(100) NOT NULL UNIQUE,
  weight_value NUMERIC(10, 4) NOT NULL DEFAULT 0,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE access_weights_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view access weights" ON access_weights_config
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage access weights" ON access_weights_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert ACCESS weights data

-- MAIN_FACTOR
INSERT INTO access_weights_config (category, metric_name, metric_key, weight_value, description, order_index)
VALUES ('MAIN_FACTOR', 'ACCESS', 'ACCESS', 0.3, 'Main factor weight for ACCESS measurement', 1);

-- SUB_FACTOR
INSERT INTO access_weights_config (category, metric_name, metric_key, weight_value, description, order_index)
VALUES 
  ('SUB_FACTOR', 'Bank Branches', 'BANK_BRANCHES', 0.2, 'Sub-factor weight for Bank Branches', 1),
  ('SUB_FACTOR', 'Agents', 'AGENTS', 0.2, 'Sub-factor weight for Agents', 2),
  ('SUB_FACTOR', 'ATMs and Online Services', 'ATMS_AND_ONLINE_SERVICES', 0.3, 'Sub-factor weight for ATMs and Online Services', 3),
  ('SUB_FACTOR', 'Insurers and Agents', 'INSURERS_AND_AGENTS', 0.3, 'Sub-factor weight for Insurers and Agents', 4);

-- KRI
INSERT INTO access_weights_config (category, metric_name, metric_key, weight_value, description, order_index)
VALUES 
  ('KRI', 'Service Downtime Rate (Bank Branches)', 'SERVICE_DOWNTIME_RATE_BANK_BRANCHES', 0.1, 'KRI weight for Service Downtime Rate affecting Bank Branches', 1),
  ('KRI', 'Service Downtime Rate (Agents)', 'SERVICE_DOWNTIME_RATE_AGENTS', 0.1, 'KRI weight for Service Downtime Rate affecting Agents', 2),
  ('KRI', 'Service Downtime Rate (ATMs and Online Services)', 'SERVICE_DOWNTIME_RATE_ATMS_ONLINE', 0.1, 'KRI weight for Service Downtime Rate affecting ATMs and Online Services', 3);

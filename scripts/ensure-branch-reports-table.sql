-- Create branch_reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS branch_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  
  -- Numeric fields that will be summed
  num_mfis INTEGER DEFAULT 0,
  groups_bank_account INTEGER DEFAULT 0,
  members_bank_account INTEGER DEFAULT 0,
  inactive_accounts INTEGER DEFAULT 0,
  num_insurers INTEGER DEFAULT 0,
  members_insurance INTEGER DEFAULT 0,
  borrowed_groups INTEGER DEFAULT 0,
  members_applying_loans INTEGER DEFAULT 0,
  loan_amount_applied NUMERIC DEFAULT 0,
  loan_amount_approved NUMERIC DEFAULT 0,
  members_received_loans INTEGER DEFAULT 0,
  members_complaining_delay INTEGER DEFAULT 0,
  loan_default NUMERIC DEFAULT 0,
  loan_delinquency NUMERIC DEFAULT 0,
  loan_dropout INTEGER DEFAULT 0,
  money_fraud INTEGER DEFAULT 0,
  number_of_groups INTEGER DEFAULT 0,
  members_at_start INTEGER DEFAULT 0,
  members_at_end INTEGER DEFAULT 0,
  bros_at_start INTEGER DEFAULT 0,
  bros_at_end INTEGER DEFAULT 0,
  
  -- Text fields that will be concatenated
  credit_sources TEXT,
  loan_uses TEXT,
  trust_erosion TEXT,
  loan_cost_high TEXT,
  explain_barriers TEXT,
  
  -- Metadata
  aggregated_form_ids UUID[] DEFAULT ARRAY[]::UUID[],
  total_approved_forms INTEGER DEFAULT 0,
  last_aggregated_form_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one report per branch
  UNIQUE(branch_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_branch_reports_branch_id ON branch_reports(branch_id);

-- Enable RLS
ALTER TABLE branch_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON branch_reports;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON branch_reports;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON branch_reports;
DROP POLICY IF EXISTS "Enable delete for admins" ON branch_reports;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON branch_reports
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON branch_reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON branch_reports
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for admins" ON branch_reports
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Initialize branch reports for all existing branches
INSERT INTO branch_reports (branch_id, created_at, updated_at)
SELECT id, NOW(), NOW()
FROM branches
WHERE id NOT IN (SELECT branch_id FROM branch_reports)
ON CONFLICT (branch_id) DO NOTHING;

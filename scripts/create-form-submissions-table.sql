-- Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  group_name TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  credit_sources TEXT NOT NULL DEFAULT '',
  num_mfis INTEGER NOT NULL DEFAULT 0,
  groups_bank_account INTEGER NOT NULL DEFAULT 0,
  members_bank_account INTEGER NOT NULL DEFAULT 0,
  inactive_accounts INTEGER NOT NULL DEFAULT 0,
  num_insurers INTEGER NOT NULL DEFAULT 0,
  members_insurance INTEGER NOT NULL DEFAULT 0,
  borrowed_groups INTEGER NOT NULL DEFAULT 0,
  members_applying_loans INTEGER NOT NULL DEFAULT 0,
  loan_amount_applied DECIMAL(15,2) NOT NULL DEFAULT 0,
  date_loan_applied DATE,
  loan_amount_approved DECIMAL(15,2) NOT NULL DEFAULT 0,
  members_received_loans INTEGER NOT NULL DEFAULT 0,
  date_loan_received DATE,
  members_complaining_delay INTEGER NOT NULL DEFAULT 0,
  loan_uses TEXT NOT NULL DEFAULT '',
  loan_default DECIMAL(15,2) NOT NULL DEFAULT 0,
  loan_delinquency DECIMAL(15,2) NOT NULL DEFAULT 0,
  loan_dropout INTEGER NOT NULL DEFAULT 0,
  money_fraud INTEGER NOT NULL DEFAULT 0,
  trust_erosion TEXT NOT NULL DEFAULT '',
  documentation_delay TEXT NOT NULL DEFAULT '',
  loan_cost_barriers TEXT NOT NULL DEFAULT '',
  number_of_groups INTEGER NOT NULL DEFAULT 0,
  members_at_start INTEGER NOT NULL DEFAULT 0,
  members_at_end INTEGER NOT NULL DEFAULT 0,
  bros_at_start INTEGER NOT NULL DEFAULT 0,
  bros_at_end INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_by ON form_submissions(created_by);
CREATE INDEX IF NOT EXISTS idx_form_submissions_branch_id ON form_submissions(branch_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions(submitted_at);

-- Enable Row Level Security
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own forms
CREATE POLICY "Users can view own forms" ON form_submissions
  FOR SELECT USING (created_by = auth.uid());

-- Users can insert their own forms
CREATE POLICY "Users can insert own forms" ON form_submissions
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can update their own forms
CREATE POLICY "Users can update own forms" ON form_submissions
  FOR UPDATE USING (created_by = auth.uid());

-- Users can delete their own forms
CREATE POLICY "Users can delete own forms" ON form_submissions
  FOR DELETE USING (created_by = auth.uid());

-- Program officers can view submitted forms from their branch
CREATE POLICY "Program officers can view branch submitted forms" ON form_submissions
  FOR SELECT USING (
    status = 'submitted' AND 
    branch_id IN (
      SELECT branch_id FROM profiles WHERE id = auth.uid() AND role = 'program_officer'
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_form_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_form_submissions_updated_at ON form_submissions;
CREATE TRIGGER update_form_submissions_updated_at
  BEFORE UPDATE ON form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_form_submissions_updated_at();

-- Grant necessary permissions
GRANT ALL ON form_submissions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

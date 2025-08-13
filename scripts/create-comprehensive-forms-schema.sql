-- Drop existing table if it exists to recreate with proper structure
DROP TABLE IF EXISTS form_submissions CASCADE;

-- Create comprehensive forms table
CREATE TABLE form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Form metadata
  title TEXT NOT NULL DEFAULT '',
  form_type TEXT NOT NULL DEFAULT 'financial_inclusion_report',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- User and branch associations
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Form data fields (all 30 fields from BRO form)
  group_name TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  credit_sources TEXT NOT NULL DEFAULT '',
  
  -- Numeric fields with proper defaults
  num_mfis INTEGER NOT NULL DEFAULT 0,
  groups_bank_account INTEGER NOT NULL DEFAULT 0,
  members_bank_account INTEGER NOT NULL DEFAULT 0,
  inactive_accounts INTEGER NOT NULL DEFAULT 0,
  num_insurers INTEGER NOT NULL DEFAULT 0,
  members_insurance INTEGER NOT NULL DEFAULT 0,
  borrowed_groups INTEGER NOT NULL DEFAULT 0,
  members_applying_loans INTEGER NOT NULL DEFAULT 0,
  members_received_loans INTEGER NOT NULL DEFAULT 0,
  members_complaining_delay INTEGER NOT NULL DEFAULT 0,
  loan_dropout INTEGER NOT NULL DEFAULT 0,
  money_fraud INTEGER NOT NULL DEFAULT 0,
  number_of_groups INTEGER NOT NULL DEFAULT 0,
  members_at_start INTEGER NOT NULL DEFAULT 0,
  members_at_end INTEGER NOT NULL DEFAULT 0,
  bros_at_start INTEGER NOT NULL DEFAULT 0,
  bros_at_end INTEGER NOT NULL DEFAULT 0,
  
  -- Currency fields with proper precision
  loan_amount_applied DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  loan_amount_approved DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  loan_default DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  loan_delinquency DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  
  -- Date fields
  date_loan_applied DATE,
  date_loan_received DATE,
  
  -- Text fields
  loan_uses TEXT NOT NULL DEFAULT '',
  trust_erosion TEXT NOT NULL DEFAULT '',
  documentation_delay TEXT NOT NULL DEFAULT '',
  loan_cost_barriers TEXT NOT NULL DEFAULT '',
  
  -- Additional metadata for search and filtering
  tags TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  
  -- Audit fields
  version INTEGER NOT NULL DEFAULT 1,
  previous_version_id UUID REFERENCES form_submissions(id) ON DELETE SET NULL
);

-- Create indexes for optimal performance
CREATE INDEX idx_form_submissions_created_by ON form_submissions(created_by);
CREATE INDEX idx_form_submissions_branch_id ON form_submissions(branch_id);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_created_at ON form_submissions(created_at);
CREATE INDEX idx_form_submissions_submitted_at ON form_submissions(submitted_at);
CREATE INDEX idx_form_submissions_group_name ON form_submissions(group_name);
CREATE INDEX idx_form_submissions_location ON form_submissions(location);
CREATE INDEX idx_form_submissions_form_type ON form_submissions(form_type);

-- Create composite indexes for common queries
CREATE INDEX idx_form_submissions_branch_status ON form_submissions(branch_id, status);
CREATE INDEX idx_form_submissions_user_status ON form_submissions(created_by, status);
CREATE INDEX idx_form_submissions_date_range ON form_submissions(created_at, submitted_at);

-- Enable Row Level Security
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own forms" ON form_submissions;
DROP POLICY IF EXISTS "Users can insert own forms" ON form_submissions;
DROP POLICY IF EXISTS "Users can update own forms" ON form_submissions;
DROP POLICY IF EXISTS "Users can delete own forms" ON form_submissions;
DROP POLICY IF EXISTS "Program officers can view branch submitted forms" ON form_submissions;

-- Create comprehensive RLS policies
-- BROs can view their own forms
CREATE POLICY "BROs can view own forms" ON form_submissions
  FOR SELECT USING (
    created_by = auth.uid() OR
    (
      branch_id IN (
        SELECT branch_id FROM profiles WHERE id = auth.uid() AND role = 'branch_report_officer'
      )
    )
  );

-- BROs can insert their own forms
CREATE POLICY "BROs can insert own forms" ON form_submissions
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    branch_id IN (
      SELECT branch_id FROM profiles WHERE id = auth.uid() AND role = 'branch_report_officer'
    )
  );

-- BROs can update their own forms (only drafts)
CREATE POLICY "BROs can update own draft forms" ON form_submissions
  FOR UPDATE USING (
    created_by = auth.uid() AND
    (status = 'draft' OR status = 'submitted')
  );

-- BROs can delete their own draft forms
CREATE POLICY "BROs can delete own draft forms" ON form_submissions
  FOR DELETE USING (
    created_by = auth.uid() AND
    status = 'draft'
  );

-- Program officers can view submitted forms from their branch
CREATE POLICY "Program officers can view branch forms" ON form_submissions
  FOR SELECT USING (
    status IN ('submitted', 'reviewed', 'approved') AND 
    branch_id IN (
      SELECT branch_id FROM profiles WHERE id = auth.uid() AND role = 'program_officer'
    )
  );

-- Program officers can update form status (review/approve)
CREATE POLICY "Program officers can review forms" ON form_submissions
  FOR UPDATE USING (
    status IN ('submitted', 'reviewed') AND
    branch_id IN (
      SELECT branch_id FROM profiles WHERE id = auth.uid() AND role = 'program_officer'
    )
  );

-- Admins can view all forms
CREATE POLICY "Admins can view all forms" ON form_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_form_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Set submitted_at when status changes to submitted
  IF OLD.status != 'submitted' AND NEW.status = 'submitted' THEN
    NEW.submitted_at = NOW();
  END IF;
  
  -- Set reviewed_at when status changes to reviewed
  IF OLD.status != 'reviewed' AND NEW.status = 'reviewed' THEN
    NEW.reviewed_at = NOW();
    NEW.reviewed_by = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_form_submissions_updated_at ON form_submissions;
CREATE TRIGGER update_form_submissions_updated_at
  BEFORE UPDATE ON form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_form_submissions_updated_at();

-- Create function for form search
CREATE OR REPLACE FUNCTION search_forms(
  search_term TEXT DEFAULT '',
  filter_branch_id UUID DEFAULT NULL,
  filter_status TEXT DEFAULT '',
  filter_date_from DATE DEFAULT NULL,
  filter_date_to DATE DEFAULT NULL,
  user_role TEXT DEFAULT '',
  user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  group_name TEXT,
  location TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  branch_id UUID,
  creator_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fs.id,
    fs.title,
    fs.group_name,
    fs.location,
    fs.status,
    fs.created_at,
    fs.submitted_at,
    fs.created_by,
    fs.branch_id,
    p.full_name as creator_name
  FROM form_submissions fs
  LEFT JOIN profiles p ON fs.created_by = p.id
  WHERE 
    (search_term = '' OR 
     fs.title ILIKE '%' || search_term || '%' OR
     fs.group_name ILIKE '%' || search_term || '%' OR
     fs.location ILIKE '%' || search_term || '%')
    AND (filter_branch_id IS NULL OR fs.branch_id = filter_branch_id)
    AND (filter_status = '' OR fs.status = filter_status)
    AND (filter_date_from IS NULL OR fs.created_at::date >= filter_date_from)
    AND (filter_date_to IS NULL OR fs.created_at::date <= filter_date_to)
    AND (
      (user_role = 'branch_report_officer' AND fs.created_by = user_id) OR
      (user_role = 'program_officer' AND fs.branch_id = filter_branch_id AND fs.status IN ('submitted', 'reviewed', 'approved')) OR
      (user_role = 'admin')
    )
  ORDER BY fs.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON form_submissions TO authenticated;
GRANT EXECUTE ON FUNCTION search_forms TO authenticated;
GRANT EXECUTE ON FUNCTION update_form_submissions_updated_at TO authenticated;

-- Create view for form statistics
CREATE OR REPLACE VIEW form_statistics AS
SELECT 
  branch_id,
  COUNT(*) as total_forms,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_forms,
  COUNT(*) FILTER (WHERE status = 'submitted') as submitted_forms,
  COUNT(*) FILTER (WHERE status = 'reviewed') as reviewed_forms,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_forms,
  AVG(members_at_end) as avg_members,
  SUM(loan_amount_applied) as total_loan_applied,
  SUM(loan_amount_approved) as total_loan_approved
FROM form_submissions
GROUP BY branch_id;

GRANT SELECT ON form_statistics TO authenticated;

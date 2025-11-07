-- Create branch_reports table for cumulative data from approved forms
-- This table will store aggregated data from approved form submissions

CREATE TABLE IF NOT EXISTS branch_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT DEFAULT 'Branch Report',
    form_type TEXT DEFAULT 'branch_report',
    status TEXT DEFAULT 'active',
    credit_sources TEXT,
    num_mfis INTEGER DEFAULT 0,
    groups_bank_account INTEGER DEFAULT 0,
    members_bank_account INTEGER DEFAULT 0,
    inactive_accounts INTEGER DEFAULT 0,
    num_insurers INTEGER DEFAULT 0,
    members_insurance INTEGER DEFAULT 0,
    borrowed_groups INTEGER DEFAULT 0,
    members_applying_loans INTEGER DEFAULT 0,
    loan_amount_applied DECIMAL(15,2) DEFAULT 0,
    loan_amount_approved DECIMAL(15,2) DEFAULT 0,
    members_received_loans INTEGER DEFAULT 0,
    members_complaining_delay INTEGER DEFAULT 0,
    loan_uses TEXT,
    loan_default DECIMAL(15,2) DEFAULT 0,
    loan_delinquency DECIMAL(15,2) DEFAULT 0,
    loan_dropout INTEGER DEFAULT 0,
    money_fraud INTEGER DEFAULT 0,
    trust_erosion TEXT,
    documentation_delay TEXT,
    loan_cost_high TEXT,
    number_of_groups INTEGER DEFAULT 0,
    members_at_start INTEGER DEFAULT 0,
    members_at_end INTEGER DEFAULT 0,
    bros_at_start INTEGER DEFAULT 0,
    bros_at_end INTEGER DEFAULT 0,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_approved_form_id UUID,
    total_approved_forms INTEGER DEFAULT 0,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    version INTEGER DEFAULT 1
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_branch_reports_branch_id ON branch_reports(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_reports_created_by ON branch_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_branch_reports_status ON branch_reports(status);

-- Enable RLS (Row Level Security)
ALTER TABLE branch_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view branch reports from their branch" ON branch_reports
    FOR SELECT USING (
        branch_id IN (
            SELECT branch_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Program officers can update branch reports from their branch" ON branch_reports
    FOR UPDATE USING (
        branch_id IN (
            SELECT branch_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('program_officer', 'branch_manager', 'admin')
        )
    );

CREATE POLICY "Program officers can insert branch reports for their branch" ON branch_reports
    FOR INSERT WITH CHECK (
        branch_id IN (
            SELECT branch_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('program_officer', 'branch_manager', 'admin')
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_branch_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_branch_reports_updated_at
    BEFORE UPDATE ON branch_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_branch_reports_updated_at();

-- Insert initial branch reports for existing branches
INSERT INTO branch_reports (branch_id, created_by, title)
SELECT 
    b.id as branch_id,
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1) as created_by,
    CONCAT('Branch Report - ', b.name) as title
FROM branches b
WHERE NOT EXISTS (
    SELECT 1 FROM branch_reports br WHERE br.branch_id = b.id
);

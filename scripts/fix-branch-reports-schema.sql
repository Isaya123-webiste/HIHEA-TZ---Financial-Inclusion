-- Fix branch_reports table schema to include all necessary columns

-- Drop the table if it exists and recreate with correct schema
DROP TABLE IF EXISTS branch_reports CASCADE;

-- Create branch_reports table with all required columns
CREATE TABLE branch_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    
    -- Metadata
    title TEXT DEFAULT 'Branch Report',
    form_type TEXT DEFAULT 'branch_report',
    status TEXT DEFAULT 'active',
    
    -- Numeric aggregation fields
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
    loan_default DECIMAL(15,2) DEFAULT 0,
    loan_delinquency DECIMAL(15,2) DEFAULT 0,
    loan_dropout INTEGER DEFAULT 0,
    money_fraud INTEGER DEFAULT 0,
    number_of_groups INTEGER DEFAULT 0,
    members_at_start INTEGER DEFAULT 0,
    members_at_end INTEGER DEFAULT 0,
    bros_at_start INTEGER DEFAULT 0,
    bros_at_end INTEGER DEFAULT 0,
    
    -- Text aggregation fields
    credit_sources TEXT,
    loan_uses TEXT,
    trust_erosion TEXT,
    documentation_delay TEXT,
    loan_cost_high TEXT,
    explain_barriers TEXT,
    
    -- Tracking and metadata
    aggregated_form_ids UUID[] DEFAULT '{}',
    total_approved_forms INTEGER DEFAULT 0,
    last_aggregated_form_id UUID,
    
    -- Standard fields
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_branch_reports_branch_id ON branch_reports(branch_id);
CREATE INDEX idx_branch_reports_created_by ON branch_reports(created_by);
CREATE INDEX idx_branch_reports_status ON branch_reports(status);
CREATE INDEX idx_branch_reports_updated_at ON branch_reports(updated_at);

-- Enable RLS (Row Level Security)
ALTER TABLE branch_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view branch reports from their branch" ON branch_reports;
DROP POLICY IF EXISTS "Program officers can update branch reports from their branch" ON branch_reports;
DROP POLICY IF EXISTS "Program officers can insert branch reports for their branch" ON branch_reports;

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

DROP TRIGGER IF EXISTS update_branch_reports_updated_at ON branch_reports;

CREATE TRIGGER update_branch_reports_updated_at
    BEFORE UPDATE ON branch_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_branch_reports_updated_at();

-- Insert initial branch reports for existing branches
INSERT INTO branch_reports (branch_id, title, created_by)
SELECT 
    b.id as branch_id,
    CONCAT('Branch Report - ', b.name) as title,
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1) as created_by
FROM branches b
ON CONFLICT DO NOTHING;

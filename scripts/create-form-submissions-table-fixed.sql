-- Create form_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    form_type VARCHAR(50) DEFAULT 'branch_report',
    form_data JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'sent_back')),
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_user_id ON form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_branch_id ON form_submissions(branch_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at);

-- Enable RLS
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own form submissions" ON form_submissions;
CREATE POLICY "Users can view their own form submissions" ON form_submissions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own form submissions" ON form_submissions;
CREATE POLICY "Users can insert their own form submissions" ON form_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own form submissions" ON form_submissions;
CREATE POLICY "Users can update their own form submissions" ON form_submissions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own draft form submissions" ON form_submissions;
CREATE POLICY "Users can delete their own draft form submissions" ON form_submissions
    FOR DELETE USING (auth.uid() = user_id AND status = 'draft');

-- Admin and program officers can view all submissions
DROP POLICY IF EXISTS "Admins and program officers can view all form submissions" ON form_submissions;
CREATE POLICY "Admins and program officers can view all form submissions" ON form_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'program_officer')
        )
    );

-- Admin and program officers can update all submissions
DROP POLICY IF EXISTS "Admins and program officers can update all form submissions" ON form_submissions;
CREATE POLICY "Admins and program officers can update all form submissions" ON form_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'program_officer')
        )
    );

-- Branch managers can view submissions from their branch
DROP POLICY IF EXISTS "Branch managers can view their branch form submissions" ON form_submissions;
CREATE POLICY "Branch managers can view their branch form submissions" ON form_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'branch_manager'
            AND profiles.branch_id = form_submissions.branch_id
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_form_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_form_submissions_updated_at ON form_submissions;
CREATE TRIGGER trigger_update_form_submissions_updated_at
    BEFORE UPDATE ON form_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_form_submissions_updated_at();

-- Insert some sample data for testing (optional)
INSERT INTO form_submissions (user_id, branch_id, form_type, form_data, status, created_at, updated_at)
SELECT 
    p.id as user_id,
    p.branch_id,
    'branch_report' as form_type,
    jsonb_build_object(
        'group_name', 'Sample Group ' || (random() * 100)::int,
        'location', 'Sample Location ' || (random() * 100)::int,
        'trust_erosion', (random() * 10)::int,
        'documentation_delay', (random() * 5)::int,
        'loan_cost_high', (random() * 8)::int,
        'explain_barriers', 'Sample barriers explanation'
    ) as form_data,
    CASE 
        WHEN random() < 0.3 THEN 'draft'
        WHEN random() < 0.6 THEN 'submitted'
        WHEN random() < 0.8 THEN 'approved'
        ELSE 'rejected'
    END as status,
    NOW() - (random() * interval '30 days') as created_at,
    NOW() - (random() * interval '30 days') as updated_at
FROM profiles p
WHERE p.role IN ('branch_report_officer', 'report_officer')
AND NOT EXISTS (
    SELECT 1 FROM form_submissions fs WHERE fs.user_id = p.id
)
LIMIT 10;

COMMIT;

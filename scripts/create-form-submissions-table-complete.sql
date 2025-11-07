-- Drop existing table if it exists and recreate with proper structure
DROP TABLE IF EXISTS public.form_submissions CASCADE;

-- Create the form_submissions table with all required columns
CREATE TABLE public.form_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    form_type TEXT NOT NULL DEFAULT 'branch_report',
    form_data JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'sent_back')),
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Additional fields for easier querying
    group_name TEXT,
    location TEXT,
    title TEXT,
    notes TEXT,
    
    -- All the form fields as individual columns for easier access
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
    date_loan_applied DATE,
    loan_amount_approved DECIMAL(15,2) DEFAULT 0,
    members_received_loans INTEGER DEFAULT 0,
    date_loan_received DATE,
    members_complaining_delay INTEGER DEFAULT 0,
    loan_uses TEXT,
    loan_default DECIMAL(15,2) DEFAULT 0,
    loan_delinquency DECIMAL(15,2) DEFAULT 0,
    loan_dropout INTEGER DEFAULT 0,
    money_fraud INTEGER DEFAULT 0,
    trust_erosion TEXT,
    documentation_delay TEXT,
    loan_cost_high TEXT,
    explain_barriers TEXT,
    number_of_groups INTEGER DEFAULT 0,
    members_at_start INTEGER DEFAULT 0,
    members_at_end INTEGER DEFAULT 0,
    bros_at_start INTEGER DEFAULT 0,
    bros_at_end INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX idx_form_submissions_user_id ON public.form_submissions(user_id);
CREATE INDEX idx_form_submissions_branch_id ON public.form_submissions(branch_id);
CREATE INDEX idx_form_submissions_status ON public.form_submissions(status);
CREATE INDEX idx_form_submissions_created_at ON public.form_submissions(created_at);
CREATE INDEX idx_form_submissions_submitted_at ON public.form_submissions(submitted_at);

-- Enable RLS
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own form submissions" ON public.form_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own form submissions" ON public.form_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own form submissions" ON public.form_submissions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own draft form submissions" ON public.form_submissions
    FOR DELETE USING (auth.uid() = user_id AND status = 'draft');

-- Allow program officers and admins to view forms from their branch
CREATE POLICY "Program officers can view branch forms" ON public.form_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('program_officer', 'admin', 'branch_manager')
            AND (profiles.branch_id = form_submissions.branch_id OR profiles.role = 'admin')
        )
    );

-- Allow program officers and admins to update form status
CREATE POLICY "Program officers can update form status" ON public.form_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('program_officer', 'admin', 'branch_manager')
            AND (profiles.branch_id = form_submissions.branch_id OR profiles.role = 'admin')
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_form_submissions_updated_at 
    BEFORE UPDATE ON public.form_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO public.form_submissions (
    user_id,
    branch_id,
    form_type,
    status,
    group_name,
    location,
    title,
    form_data,
    submitted_at,
    credit_sources,
    num_mfis,
    groups_bank_account,
    members_bank_account,
    number_of_groups,
    members_at_start,
    members_at_end,
    loan_amount_applied,
    loan_amount_approved
) VALUES 
(
    (SELECT id FROM auth.users WHERE email LIKE '%branch-report-officer%' LIMIT 1),
    (SELECT id FROM public.branches LIMIT 1),
    'branch_report',
    'submitted',
    'Umoja Women Group',
    'Dar es Salaam',
    'Financial Inclusion Report - Umoja Women Group',
    '{"group_name": "Umoja Women Group", "location": "Dar es Salaam", "credit_sources": "CRDB Bank, NMB", "num_mfis": 2}',
    NOW() - INTERVAL '2 days',
    'CRDB Bank, NMB',
    2,
    15,
    45,
    3,
    50,
    48,
    5000000.00,
    4500000.00
),
(
    (SELECT id FROM auth.users WHERE email LIKE '%branch-report-officer%' LIMIT 1),
    (SELECT id FROM public.branches LIMIT 1),
    'branch_report',
    'draft',
    'Maendeleo Group',
    'Mwanza',
    'Financial Inclusion Report - Maendeleo Group',
    '{"group_name": "Maendeleo Group", "location": "Mwanza", "credit_sources": "Equity Bank", "num_mfis": 1}',
    NULL,
    'Equity Bank',
    1,
    8,
    25,
    2,
    30,
    32,
    3000000.00,
    2800000.00
);

-- Grant necessary permissions
GRANT ALL ON public.form_submissions TO authenticated;
GRANT ALL ON public.form_submissions TO service_role;

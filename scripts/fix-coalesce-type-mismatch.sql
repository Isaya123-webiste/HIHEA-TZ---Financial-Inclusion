-- Fix COALESCE type mismatch and add project_id column to branch_reports
BEGIN;

-- Step 1: Add project_id column if it doesn't exist
DO $$ BEGIN
  ALTER TABLE branch_reports ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Step 2: Drop the problematic trigger and function
DROP TRIGGER IF EXISTS update_branch_reports_updated_at ON branch_reports;
DROP FUNCTION IF EXISTS update_branch_reports_updated_at();

-- Step 3: Recreate the trigger properly
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

-- Step 4: Drop and recreate the update_branch_report_on_approval function without type mismatches
DROP FUNCTION IF EXISTS update_branch_report_on_approval(UUID, JSONB, UUID);

CREATE OR REPLACE FUNCTION update_branch_report_on_approval(
    p_branch_id UUID,
    p_form_data JSONB,
    p_program_officer_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_report_id UUID;
    form_id UUID;
BEGIN
    form_id := (p_form_data->>'id')::UUID;
    
    SELECT id INTO existing_report_id
    FROM branch_reports 
    WHERE branch_id = p_branch_id
    LIMIT 1;
    
    IF existing_report_id IS NOT NULL THEN
        UPDATE branch_reports SET
            num_mfis = COALESCE(num_mfis, 0) + COALESCE((p_form_data->>'num_mfis')::INTEGER, 0),
            groups_bank_account = COALESCE(groups_bank_account, 0) + COALESCE((p_form_data->>'groups_bank_account')::INTEGER, 0),
            members_bank_account = COALESCE(members_bank_account, 0) + COALESCE((p_form_data->>'members_bank_account')::INTEGER, 0),
            inactive_accounts = COALESCE(inactive_accounts, 0) + COALESCE((p_form_data->>'inactive_accounts')::INTEGER, 0),
            num_insurers = COALESCE(num_insurers, 0) + COALESCE((p_form_data->>'num_insurers')::INTEGER, 0),
            members_insurance = COALESCE(members_insurance, 0) + COALESCE((p_form_data->>'members_insurance')::INTEGER, 0),
            borrowed_groups = COALESCE(borrowed_groups, 0) + COALESCE((p_form_data->>'borrowed_groups')::INTEGER, 0),
            members_applying_loans = COALESCE(members_applying_loans, 0) + COALESCE((p_form_data->>'members_applying_loans')::INTEGER, 0),
            loan_amount_applied = COALESCE(loan_amount_applied, 0) + COALESCE((p_form_data->>'loan_amount_applied')::NUMERIC, 0),
            loan_amount_approved = COALESCE(loan_amount_approved, 0) + COALESCE((p_form_data->>'loan_amount_approved')::NUMERIC, 0),
            members_received_loans = COALESCE(members_received_loans, 0) + COALESCE((p_form_data->>'members_received_loans')::INTEGER, 0),
            members_complaining_delay = COALESCE(members_complaining_delay, 0) + COALESCE((p_form_data->>'members_complaining_delay')::INTEGER, 0),
            loan_default = COALESCE(loan_default, 0) + COALESCE((p_form_data->>'loan_default')::NUMERIC, 0),
            loan_delinquency = COALESCE(loan_delinquency, 0) + COALESCE((p_form_data->>'loan_delinquency')::NUMERIC, 0),
            loan_dropout = COALESCE(loan_dropout, 0) + COALESCE((p_form_data->>'loan_dropout')::INTEGER, 0),
            money_fraud = COALESCE(money_fraud, 0) + COALESCE((p_form_data->>'money_fraud')::INTEGER, 0),
            number_of_groups = COALESCE(number_of_groups, 0) + COALESCE((p_form_data->>'number_of_groups')::INTEGER, 0),
            members_at_start = COALESCE(members_at_start, 0) + COALESCE((p_form_data->>'members_at_start')::INTEGER, 0),
            members_at_end = COALESCE(members_at_end, 0) + COALESCE((p_form_data->>'members_at_end')::INTEGER, 0),
            bros_at_start = COALESCE(bros_at_start, 0) + COALESCE((p_form_data->>'bros_at_start')::INTEGER, 0),
            bros_at_end = COALESCE(bros_at_end, 0) + COALESCE((p_form_data->>'bros_at_end')::INTEGER, 0),
            last_approved_form_id = form_id,
            total_approved_forms = COALESCE(total_approved_forms, 0) + 1,
            updated_at = NOW()
        WHERE id = existing_report_id;
        
    ELSE
        INSERT INTO branch_reports (
            id, branch_id, title, form_type, status, created_by, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), p_branch_id, 'Branch Report', 'branch_report', 'active', p_program_officer_id, NOW(), NOW()
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create unique constraint on (branch_id, project_id)
DO $$ BEGIN
  ALTER TABLE branch_reports ADD CONSTRAINT branch_reports_project_branch_unique 
  UNIQUE NULLS NOT DISTINCT (branch_id, project_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Step 6: Create index on (branch_id, project_id)
CREATE INDEX IF NOT EXISTS idx_branch_reports_branch_project ON branch_reports(branch_id, project_id);

COMMIT;

-- Simple fix: Add project_id column and insert the 2 missing forms
BEGIN;

-- Step 1: Add project_id column if it doesn't exist
DO $$ BEGIN
  ALTER TABLE branch_reports ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Step 2: Add unique constraint if it doesn't exist
DO $$ BEGIN
  ALTER TABLE branch_reports ADD CONSTRAINT branch_reports_project_branch_unique UNIQUE NULLS NOT DISTINCT (branch_id, project_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Step 3: Insert the 2 missing forms
INSERT INTO branch_reports (branch_id, project_id, status, created_at, updated_at)
VALUES 
  ('ecb14230-3fbb-4686-ab42-dc5a35458c3f'::uuid, 'e82f8060-350b-4d0b-88c8-53421a1ea878'::uuid, 'active', NOW(), NOW()),
  ('7620d82a-95d7-49ee-8383-cb462f0f0413'::uuid, '42295fc3-a717-4da6-999e-f4b238852be4'::uuid, 'active', NOW(), NOW())
ON CONFLICT (branch_id, project_id) DO NOTHING;

COMMIT;
    
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

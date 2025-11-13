-- Create function to automatically update branch reports when forms are approved
-- This ensures that the branch_id and approval tracking is maintained

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
    -- Extract form ID from the form data
    form_id := (p_form_data->>'id')::UUID;
    
    -- Check if branch report exists for this branch
    SELECT id INTO existing_report_id
    FROM branch_reports 
    WHERE branch_id = p_branch_id;
    
    IF existing_report_id IS NOT NULL THEN
        -- Update existing branch report by adding the new form's data
        UPDATE branch_reports SET
            -- Add numeric values
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
            
            -- Combine text fields intelligently
            credit_sources = CASE 
                WHEN credit_sources IS NULL OR credit_sources = '' THEN p_form_data->>'credit_sources'
                WHEN p_form_data->>'credit_sources' IS NULL OR p_form_data->>'credit_sources' = '' THEN credit_sources
                WHEN credit_sources = p_form_data->>'credit_sources' THEN credit_sources
                ELSE credit_sources || '; ' || (p_form_data->>'credit_sources')
            END,
            
            loan_uses = CASE 
                WHEN loan_uses IS NULL OR loan_uses = '' THEN p_form_data->>'loan_uses'
                WHEN p_form_data->>'loan_uses' IS NULL OR p_form_data->>'loan_uses' = '' THEN loan_uses
                WHEN loan_uses = p_form_data->>'loan_uses' THEN loan_uses
                ELSE loan_uses || '; ' || (p_form_data->>'loan_uses')
            END,
            
            -- Changed trust_erosion and documentation_delay to sum numeric values instead of concatenating
            trust_erosion = (
                COALESCE(NULLIF(trust_erosion, '')::INTEGER, 0) + 
                COALESCE(NULLIF(p_form_data->>'trust_erosion', '')::INTEGER, 0)
            )::TEXT,
            
            documentation_delay = (
                COALESCE(NULLIF(documentation_delay, '')::INTEGER, 0) + 
                COALESCE(NULLIF(p_form_data->>'documentation_delay', '')::INTEGER, 0)
            )::TEXT,
            
            loan_cost_high = CASE 
                WHEN loan_cost_high IS NULL OR loan_cost_high = '' THEN p_form_data->>'loan_cost_high'
                WHEN p_form_data->>'loan_cost_high' IS NULL OR p_form_data->>'loan_cost_high' = '' THEN loan_cost_high
                WHEN loan_cost_high = p_form_data->>'loan_cost_high' THEN loan_cost_high
                ELSE loan_cost_high || '; ' || (p_form_data->>'loan_cost_high')
            END,
            
            -- Update tracking fields
            last_approved_form_id = form_id,
            total_approved_forms = COALESCE(total_approved_forms, 0) + 1,
            notes = CASE 
                WHEN notes IS NULL OR notes = '' THEN 'Form ' || (p_form_data->>'group_name') || ' approved and added to report.'
                ELSE notes || '; Form ' || (p_form_data->>'group_name') || ' approved and added to report.'
            END,
            updated_at = NOW()
        WHERE id = existing_report_id;
        
    ELSE
        -- Create new branch report with the form's data
        INSERT INTO branch_reports (
            id,
            title,
            form_type,
            status,
            branch_id,
            created_by,
            credit_sources,
            num_mfis,
            groups_bank_account,
            members_bank_account,
            inactive_accounts,
            num_insurers,
            members_insurance,
            borrowed_groups,
            members_applying_loans,
            loan_amount_applied,
            loan_amount_approved,
            members_received_loans,
            members_complaining_delay,
            loan_uses,
            loan_default,
            loan_delinquency,
            loan_dropout,
            money_fraud,
            trust_erosion,
            documentation_delay,
            loan_cost_high,
            number_of_groups,
            members_at_start,
            members_at_end,
            bros_at_start,
            bros_at_end,
            last_approved_form_id,
            total_approved_forms,
            notes,
            tags,
            version
        ) VALUES (
            gen_random_uuid(),
            'Branch Report - ' || (SELECT name FROM branches WHERE id = p_branch_id) || ' - ' || CURRENT_DATE,
            'branch_report',
            'active',
            p_branch_id,
            COALESCE(p_program_officer_id, (p_form_data->>'created_by')::UUID),
            p_form_data->>'credit_sources',
            COALESCE((p_form_data->>'num_mfis')::INTEGER, 0),
            COALESCE((p_form_data->>'groups_bank_account')::INTEGER, 0),
            COALESCE((p_form_data->>'members_bank_account')::INTEGER, 0),
            COALESCE((p_form_data->>'inactive_accounts')::INTEGER, 0),
            COALESCE((p_form_data->>'num_insurers')::INTEGER, 0),
            COALESCE((p_form_data->>'members_insurance')::INTEGER, 0),
            COALESCE((p_form_data->>'borrowed_groups')::INTEGER, 0),
            COALESCE((p_form_data->>'members_applying_loans')::INTEGER, 0),
            COALESCE((p_form_data->>'loan_amount_applied')::NUMERIC, 0),
            COALESCE((p_form_data->>'loan_amount_approved')::NUMERIC, 0),
            COALESCE((p_form_data->>'members_received_loans')::INTEGER, 0),
            COALESCE((p_form_data->>'members_complaining_delay')::INTEGER, 0),
            p_form_data->>'loan_uses',
            COALESCE((p_form_data->>'loan_default')::NUMERIC, 0),
            COALESCE((p_form_data->>'loan_delinquency')::NUMERIC, 0),
            COALESCE((p_form_data->>'loan_dropout')::INTEGER, 0),
            COALESCE((p_form_data->>'money_fraud')::INTEGER, 0),
            (
                COALESCE(NULLIF((SELECT trust_erosion FROM branch_reports WHERE id = existing_report_id), '')::INTEGER, 0) + 
                COALESCE(NULLIF(p_form_data->>'trust_erosion', '')::INTEGER, 0)
            )::TEXT,
            (
                COALESCE(NULLIF((SELECT documentation_delay FROM branch_reports WHERE id = existing_report_id), '')::INTEGER, 0) + 
                COALESCE(NULLIF(p_form_data->>'documentation_delay', '')::INTEGER, 0)
            )::TEXT,
            p_form_data->>'loan_cost_high',
            COALESCE((p_form_data->>'number_of_groups')::INTEGER, 0),
            COALESCE((p_form_data->>'members_at_start')::INTEGER, 0),
            COALESCE((p_form_data->>'members_at_end')::INTEGER, 0),
            COALESCE((p_form_data->>'bros_at_start')::INTEGER, 0),
            COALESCE((p_form_data->>'bros_at_end')::INTEGER, 0),
            (p_form_data->>'id')::UUID,
            1,
            'Initial branch report created from form ' || (p_form_data->>'group_name') || '.',
            ARRAY[]::text[],
            1
        );
    END IF;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the form approval
        RAISE WARNING 'Failed to update branch report for branch %: %', p_branch_id, SQLERRM;
        RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_branch_report_on_approval(UUID, JSONB, UUID) TO authenticated;

-- Create a trigger function to automatically call this when forms are approved
CREATE OR REPLACE FUNCTION trigger_update_branch_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only trigger when status changes to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Call the update function with the form data
        PERFORM update_branch_report_on_approval(
            NEW.branch_id,
            to_jsonb(NEW),
            NEW.reviewed_by
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger on form_submissions table
DROP TRIGGER IF EXISTS trigger_branch_report_update ON form_submissions;
CREATE TRIGGER trigger_branch_report_update
    AFTER UPDATE ON form_submissions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_branch_report();

-- Show success message
DO $$
BEGIN
    RAISE NOTICE 'Branch report update function and trigger created successfully!';
    RAISE NOTICE 'The system will now automatically update branch reports when forms are approved.';
    RAISE NOTICE 'Each branch report tracks:';
    RAISE NOTICE '  - branch_id: Which branch the data belongs to';
    RAISE NOTICE '  - created_by: The program officer who manages the report';
    RAISE NOTICE '  - last_approved_form_id: The most recent approved form';
    RAISE NOTICE '  - total_approved_forms: Count of all approved forms for this branch';
END $$;

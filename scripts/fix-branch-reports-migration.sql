-- Branch Reports Migration Script
-- This script populates the branch_reports table with data from approved forms
-- and ensures proper tracking of branch and approval information

-- Step 1: Check current status
DO $$
BEGIN
    RAISE NOTICE 'Starting Branch Reports Migration...';
    RAISE NOTICE '===========================================';
    
    -- Show current branch_reports status
    RAISE NOTICE 'Current branch_reports table status:';
    PERFORM (
        SELECT CASE 
            WHEN COUNT(*) = 0 THEN 
                RAISE NOTICE 'No records in branch_reports table'
            ELSE 
                RAISE NOTICE 'Found % existing records in branch_reports', COUNT(*)
        END
        FROM branch_reports
    );
    
    -- Show approved forms by branch
    RAISE NOTICE 'Approved forms by branch:';
    FOR rec IN (
        SELECT 
            b.name as branch_name,
            fs.branch_id,
            COUNT(*) as approved_count,
            STRING_AGG(fs.group_name, ', ') as group_names
        FROM form_submissions fs
        JOIN branches b ON b.id = fs.branch_id
        WHERE fs.status = 'approved'
        GROUP BY fs.branch_id, b.name
        ORDER BY b.name
    ) LOOP
        RAISE NOTICE 'Branch: % (ID: %) - % approved forms: %', 
            rec.branch_name, rec.branch_id, rec.approved_count, rec.group_names;
    END LOOP;
END $$;

-- Step 2: Migrate data for each branch
DO $$
DECLARE
    branch_record RECORD;
    form_record RECORD;
    report_exists BOOLEAN;
    new_report_id UUID;
    program_officer_id UUID;
BEGIN
    RAISE NOTICE 'Starting migration process...';
    
    -- Loop through each branch that has approved forms
    FOR branch_record IN (
        SELECT 
            fs.branch_id,
            b.name as branch_name,
            COUNT(*) as approved_count
        FROM form_submissions fs
        JOIN branches b ON b.id = fs.branch_id
        WHERE fs.status = 'approved'
        GROUP BY fs.branch_id, b.name
    ) LOOP
        
        RAISE NOTICE 'Processing branch: % (% approved forms)', 
            branch_record.branch_name, branch_record.approved_count;
        
        -- Check if branch report already exists
        SELECT EXISTS(
            SELECT 1 FROM branch_reports 
            WHERE branch_id = branch_record.branch_id
        ) INTO report_exists;
        
        -- Find a program officer for this branch (for created_by field)
        SELECT id INTO program_officer_id
        FROM profiles 
        WHERE branch_id = branch_record.branch_id 
        AND role = 'program_officer' 
        AND status = 'active'
        LIMIT 1;
        
        -- If no program officer found, use the first admin
        IF program_officer_id IS NULL THEN
            SELECT id INTO program_officer_id
            FROM profiles 
            WHERE role = 'admin' 
            AND status = 'active'
            LIMIT 1;
        END IF;
        
        IF report_exists THEN
            RAISE NOTICE 'Updating existing branch report for %', branch_record.branch_name;
            
            -- Update existing report with cumulative data
            UPDATE branch_reports SET
                -- Sum all numeric fields from approved forms
                num_mfis = (
                    SELECT COALESCE(SUM(num_mfis), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                groups_bank_account = (
                    SELECT COALESCE(SUM(groups_bank_account), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                members_bank_account = (
                    SELECT COALESCE(SUM(members_bank_account), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                inactive_accounts = (
                    SELECT COALESCE(SUM(inactive_accounts), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                num_insurers = (
                    SELECT COALESCE(SUM(num_insurers), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                members_insurance = (
                    SELECT COALESCE(SUM(members_insurance), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                borrowed_groups = (
                    SELECT COALESCE(SUM(borrowed_groups), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                members_applying_loans = (
                    SELECT COALESCE(SUM(members_applying_loans), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                loan_amount_applied = (
                    SELECT COALESCE(SUM(loan_amount_applied), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                loan_amount_approved = (
                    SELECT COALESCE(SUM(loan_amount_approved), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                members_received_loans = (
                    SELECT COALESCE(SUM(members_received_loans), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                members_complaining_delay = (
                    SELECT COALESCE(SUM(members_complaining_delay), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                loan_default = (
                    SELECT COALESCE(SUM(loan_default), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                loan_delinquency = (
                    SELECT COALESCE(SUM(loan_delinquency), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                loan_dropout = (
                    SELECT COALESCE(SUM(loan_dropout), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                money_fraud = (
                    SELECT COALESCE(SUM(money_fraud), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                number_of_groups = (
                    SELECT COALESCE(SUM(number_of_groups), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                members_at_start = (
                    SELECT COALESCE(SUM(members_at_start), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                members_at_end = (
                    SELECT COALESCE(SUM(members_at_end), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                bros_at_start = (
                    SELECT COALESCE(SUM(bros_at_start), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                bros_at_end = (
                    SELECT COALESCE(SUM(bros_at_end), 0) 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id AND status = 'approved'
                ),
                -- Combine text fields
                credit_sources = (
                    SELECT STRING_AGG(DISTINCT credit_sources, '; ') 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id 
                    AND status = 'approved' 
                    AND credit_sources IS NOT NULL 
                    AND credit_sources != ''
                ),
                loan_uses = (
                    SELECT STRING_AGG(DISTINCT loan_uses, '; ') 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id 
                    AND status = 'approved' 
                    AND loan_uses IS NOT NULL 
                    AND loan_uses != ''
                ),
                trust_erosion = (
                    SELECT STRING_AGG(DISTINCT trust_erosion, '; ') 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id 
                    AND status = 'approved' 
                    AND trust_erosion IS NOT NULL 
                    AND trust_erosion != ''
                ),
                documentation_delay = (
                    SELECT STRING_AGG(DISTINCT documentation_delay, '; ') 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id 
                    AND status = 'approved' 
                    AND documentation_delay IS NOT NULL 
                    AND documentation_delay != ''
                ),
                loan_cost_high = (
                    SELECT STRING_AGG(DISTINCT loan_cost_high, '; ') 
                    FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id 
                    AND status = 'approved' 
                    AND loan_cost_high IS NOT NULL 
                    AND loan_cost_high != ''
                ),
                -- Set tracking fields
                total_approved_forms = branch_record.approved_count,
                last_approved_form_id = (
                    SELECT id FROM form_submissions 
                    WHERE branch_id = branch_record.branch_id 
                    AND status = 'approved' 
                    ORDER BY reviewed_at DESC NULLS LAST, updated_at DESC 
                    LIMIT 1
                ),
                notes = CONCAT(
                    COALESCE(notes, ''), 
                    CASE WHEN notes IS NOT NULL AND notes != '' THEN '; ' ELSE '' END,
                    'Migrated data from ', branch_record.approved_count, ' approved forms on ', NOW()::date
                ),
                updated_at = NOW()
            WHERE branch_id = branch_record.branch_id;
            
        ELSE
            RAISE NOTICE 'Creating new branch report for %', branch_record.branch_name;
            
            -- Create new branch report
            INSERT INTO branch_reports (
                id,
                title,
                form_type,
                status,
                branch_id,
                created_by,
                -- Numeric fields (summed)
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
                loan_default,
                loan_delinquency,
                loan_dropout,
                money_fraud,
                number_of_groups,
                members_at_start,
                members_at_end,
                bros_at_start,
                bros_at_end,
                -- Text fields (combined)
                credit_sources,
                loan_uses,
                trust_erosion,
                documentation_delay,
                loan_cost_high,
                -- Tracking fields
                total_approved_forms,
                last_approved_form_id,
                notes,
                tags,
                version
            )
            SELECT 
                gen_random_uuid(),
                'Branch Report - ' || branch_record.branch_name || ' - ' || CURRENT_DATE,
                'branch_report',
                'active',
                branch_record.branch_id,
                program_officer_id,
                -- Sum numeric fields
                COALESCE(SUM(num_mfis), 0),
                COALESCE(SUM(groups_bank_account), 0),
                COALESCE(SUM(members_bank_account), 0),
                COALESCE(SUM(inactive_accounts), 0),
                COALESCE(SUM(num_insurers), 0),
                COALESCE(SUM(members_insurance), 0),
                COALESCE(SUM(borrowed_groups), 0),
                COALESCE(SUM(members_applying_loans), 0),
                COALESCE(SUM(loan_amount_applied), 0),
                COALESCE(SUM(loan_amount_approved), 0),
                COALESCE(SUM(members_received_loans), 0),
                COALESCE(SUM(members_complaining_delay), 0),
                COALESCE(SUM(loan_default), 0),
                COALESCE(SUM(loan_delinquency), 0),
                COALESCE(SUM(loan_dropout), 0),
                COALESCE(SUM(money_fraud), 0),
                COALESCE(SUM(number_of_groups), 0),
                COALESCE(SUM(members_at_start), 0),
                COALESCE(SUM(members_at_end), 0),
                COALESCE(SUM(bros_at_start), 0),
                COALESCE(SUM(bros_at_end), 0),
                -- Combine unique text values
                STRING_AGG(DISTINCT credit_sources, '; ') FILTER (WHERE credit_sources IS NOT NULL AND credit_sources != ''),
                STRING_AGG(DISTINCT loan_uses, '; ') FILTER (WHERE loan_uses IS NOT NULL AND loan_uses != ''),
                STRING_AGG(DISTINCT trust_erosion, '; ') FILTER (WHERE trust_erosion IS NOT NULL AND trust_erosion != ''),
                STRING_AGG(DISTINCT documentation_delay, '; ') FILTER (WHERE documentation_delay IS NOT NULL AND documentation_delay != ''),
                STRING_AGG(DISTINCT loan_cost_high, '; ') FILTER (WHERE loan_cost_high IS NOT NULL AND loan_cost_high != ''),
                -- Tracking info
                branch_record.approved_count,
                (SELECT id FROM form_submissions WHERE branch_id = branch_record.branch_id AND status = 'approved' ORDER BY reviewed_at DESC NULLS LAST, updated_at DESC LIMIT 1),
                'Initial branch report created from ' || branch_record.approved_count || ' approved forms during migration on ' || CURRENT_DATE,
                ARRAY[]::text[],
                1
            FROM form_submissions
            WHERE branch_id = branch_record.branch_id 
            AND status = 'approved'
            GROUP BY branch_record.branch_id;
            
        END IF;
        
        RAISE NOTICE 'Completed processing for branch: %', branch_record.branch_name;
        
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully!';
    
END $$;

-- Step 3: Show final results
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'MIGRATION RESULTS:';
    RAISE NOTICE '===========================================';
    
    FOR rec IN (
        SELECT 
            b.name as branch_name,
            br.total_approved_forms,
            br.loan_amount_applied,
            br.loan_amount_approved,
            br.members_at_end,
            br.number_of_groups,
            p.full_name as created_by_name
        FROM branch_reports br
        JOIN branches b ON b.id = br.branch_id
        LEFT JOIN profiles p ON p.id = br.created_by
        ORDER BY b.name
    ) LOOP
        RAISE NOTICE 'Branch: %', rec.branch_name;
        RAISE NOTICE '  - Created by: %', COALESCE(rec.created_by_name, 'Unknown');
        RAISE NOTICE '  - Total approved forms: %', rec.total_approved_forms;
        RAISE NOTICE '  - Total groups: %', rec.number_of_groups;
        RAISE NOTICE '  - Total members: %', rec.members_at_end;
        RAISE NOTICE '  - Loan applied: TZS %', rec.loan_amount_applied;
        RAISE NOTICE '  - Loan approved: TZS %', rec.loan_amount_approved;
        RAISE NOTICE '  ';
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully!';
END $$;

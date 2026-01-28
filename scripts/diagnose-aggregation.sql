-- Check existing constraints and approved forms

-- View the constraint
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'form_submissions_status_check';

-- Check current status constraint values
SELECT DISTINCT status FROM form_submissions;

-- Check approved forms count
SELECT COUNT(*) as approved_count FROM form_submissions WHERE status = 'approved';

-- Check if project_id exists in branch_reports
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'branch_reports' AND column_name = 'project_id';

-- View unique branch_id + project_id combinations from approved forms
SELECT DISTINCT branch_id, project_id FROM form_submissions WHERE status = 'approved';

-- Verify form_submissions table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'form_submissions'
ORDER BY ordinal_position;

-- Check existing forms
SELECT 
    id, 
    user_id, 
    branch_id, 
    group_name, 
    location, 
    status, 
    submitted_at,
    created_at
FROM form_submissions
ORDER BY created_at DESC
LIMIT 10;

-- Check which users belong to which branches
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.branch_id,
    b.name as branch_name
FROM profiles p
LEFT JOIN branches b ON p.branch_id = b.id
WHERE p.role IN ('branch_report_officer', 'report_officer', 'program_officer')
ORDER BY b.name, p.role;

-- Check if there are forms without branch_id
SELECT COUNT(*) as forms_without_branch
FROM form_submissions
WHERE branch_id IS NULL;

-- Check branch_reports table
SELECT 
    br.id,
    b.name as branch_name,
    br.number_of_groups,
    br.members_at_end,
    br.total_approved_forms,
    br.updated_at
FROM branch_reports br
JOIN branches b ON br.branch_id = b.id
ORDER BY br.updated_at DESC;

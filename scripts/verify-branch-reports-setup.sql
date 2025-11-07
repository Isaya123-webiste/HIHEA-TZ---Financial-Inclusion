-- Check if branch_reports table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'branch_reports'
) AS table_exists;

-- Count total branch reports
SELECT COUNT(*) as total_branch_reports FROM branch_reports;

-- Check which branches have reports
SELECT 
  b.id as branch_id,
  b.name as branch_name,
  CASE WHEN br.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_report
FROM branches b
LEFT JOIN branch_reports br ON b.id = br.branch_id
ORDER BY b.name;

-- Show sample data from branch_reports
SELECT 
  br.id,
  b.name as branch_name,
  br.total_approved_forms,
  br.number_of_groups,
  br.members_at_end,
  br.loan_amount_approved,
  br.created_at,
  br.updated_at
FROM branch_reports br
JOIN branches b ON br.branch_id = b.id
ORDER BY br.updated_at DESC
LIMIT 5;

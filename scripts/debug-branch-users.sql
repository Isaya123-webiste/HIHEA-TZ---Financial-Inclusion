-- Debug: Check all users and their branch assignments
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.status,
  p.branch_id,
  b.name as branch_name,
  b.status as branch_status
FROM profiles p
LEFT JOIN branches b ON p.branch_id = b.id
WHERE p.role IN ('branch_manager', 'branch_report_officer', 'program_officer')
ORDER BY p.role, p.full_name;

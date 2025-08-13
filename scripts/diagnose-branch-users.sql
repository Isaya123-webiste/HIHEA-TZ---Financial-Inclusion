-- Check branch information
SELECT id, name, status FROM branches;

-- Check users with their branch assignments and roles
SELECT 
  id, 
  full_name, 
  email, 
  role, 
  branch_id,
  status
FROM profiles
ORDER BY role, full_name;

-- Check specifically for report officers
SELECT 
  p.id, 
  p.full_name, 
  p.email, 
  p.role, 
  p.branch_id,
  b.name as branch_name,
  p.status
FROM profiles p
LEFT JOIN branches b ON p.branch_id = b.id
WHERE p.role = 'report_officer' OR p.role = 'branch_report_officer';

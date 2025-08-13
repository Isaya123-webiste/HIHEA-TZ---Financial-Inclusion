-- Update all instances of 'report_officer' to 'branch_report_officer' in the database

-- Update existing profiles with report_officer role
UPDATE profiles 
SET role = 'branch_report_officer' 
WHERE role = 'report_officer';

-- Update any user_management logs that reference the old role
UPDATE user_management 
SET details = jsonb_set(
    details, 
    '{role}', 
    '"branch_report_officer"'
) 
WHERE details->>'role' = 'report_officer';

-- Update any other references in user_management table
UPDATE user_management 
SET action = REPLACE(action, 'report_officer', 'branch_report_officer')
WHERE action LIKE '%report_officer%';

-- Verify the changes
SELECT 
    'profiles' as table_name,
    role,
    COUNT(*) as count
FROM profiles 
WHERE role LIKE '%report%'
GROUP BY role

UNION ALL

SELECT 
    'user_management' as table_name,
    details->>'role' as role,
    COUNT(*) as count
FROM user_management 
WHERE details->>'role' LIKE '%report%'
GROUP BY details->>'role';

-- Show all current roles to verify
SELECT DISTINCT role FROM profiles ORDER BY role;

-- Comprehensive verification of role changes from 'report_officer' to 'branch_report_officer'

-- 1. Check current role distribution
SELECT 
    'Current Role Distribution' as check_type,
    role,
    COUNT(*) as count
FROM profiles 
GROUP BY role
ORDER BY role;

-- 2. Check for any remaining 'report_officer' references
SELECT 
    'Remaining report_officer roles' as check_type,
    id,
    full_name,
    email,
    role,
    created_at
FROM profiles 
WHERE role = 'report_officer';

-- 3. Check user_management table for old role references
SELECT 
    'User Management Old Roles' as check_type,
    action,
    details->>'role' as role_in_details,
    COUNT(*) as count
FROM user_management 
WHERE details->>'role' = 'report_officer'
   OR action LIKE '%report_officer%'
GROUP BY action, details->>'role';

-- 4. Verify branch assignments for branch report officers
SELECT 
    'Branch Report Officers by Branch' as check_type,
    b.name as branch_name,
    COUNT(p.id) as officer_count
FROM branches b
LEFT JOIN profiles p ON b.id = p.branch_id 
    AND p.role = 'branch_report_officer'
GROUP BY b.id, b.name
ORDER BY b.name;

-- 5. Check for any inconsistencies in role naming
SELECT 
    'Role Naming Consistency' as check_type,
    role,
    CASE 
        WHEN role LIKE '%report%' AND role != 'branch_report_officer' THEN 'NEEDS_UPDATE'
        ELSE 'OK'
    END as status,
    COUNT(*) as count
FROM profiles 
WHERE role LIKE '%report%'
GROUP BY role;

-- 6. Final summary
SELECT 
    'SUMMARY' as check_type,
    'Total Users' as metric,
    COUNT(*) as value
FROM profiles
UNION ALL
SELECT 
    'SUMMARY' as check_type,
    'Branch Report Officers' as metric,
    COUNT(*) as value
FROM profiles 
WHERE role = 'branch_report_officer'
UNION ALL
SELECT 
    'SUMMARY' as check_type,
    'Legacy Report Officers' as metric,
    COUNT(*) as value
FROM profiles 
WHERE role = 'report_officer'
ORDER BY check_type, metric;

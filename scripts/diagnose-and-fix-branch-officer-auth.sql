-- DIAGNOSTIC: Check which Branch Report Officers can't login
-- This script helps identify the authentication issue

-- 1. List all Branch Report Officers and their auth status
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.status,
  p.branch_id,
  CASE 
    WHEN p.status = 'active' THEN 'Should be active'
    ELSE 'ACCOUNT INACTIVE'
  END as expected_status,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  au.last_sign_in_at,
  au.updated_at as auth_updated_at
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.role = 'branch_report_officer'
ORDER BY p.email;

-- 2. Check if there are any auth users for branch report officers
SELECT 
  COUNT(*) as total_branch_report_officers,
  SUM(CASE WHEN au.id IS NOT NULL THEN 1 ELSE 0 END) as have_auth_user,
  SUM(CASE WHEN au.email_confirmed_at IS NOT NULL THEN 1 ELSE 0 END) as email_confirmed,
  SUM(CASE WHEN au.last_sign_in_at IS NOT NULL THEN 1 ELSE 0 END) as have_logged_in
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.role = 'branch_report_officer';

-- 3. List branch report officers and their last auth update time
SELECT 
  p.email,
  p.full_name,
  au.updated_at as password_last_changed,
  CASE 
    WHEN au.updated_at < NOW() - INTERVAL '30 days' THEN 'PASSWORD POSSIBLY STALE'
    ELSE 'Recent update'
  END as password_age_status
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.role = 'branch_report_officer'
AND p.status = 'active'
ORDER BY au.updated_at DESC NULLS LAST;

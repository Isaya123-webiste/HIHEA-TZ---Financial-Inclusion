-- Reset password for the branch report officer user
-- This will set a temporary password that can be changed on first login

-- First, let's update the user's password in auth.users
-- Note: In production, you should use Supabase's password reset functionality
-- This is a direct database approach for development/testing

UPDATE auth.users 
SET 
  encrypted_password = crypt('TempPassword123!', gen_salt('bf')),
  updated_at = now()
WHERE email = 'branchreportofficer@gmail.com';

-- Verify the update
SELECT 
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    updated_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'branchreportofficer@gmail.com';

-- Also verify the profile is still active
SELECT 
    email,
    role,
    status,
    full_name
FROM profiles 
WHERE email = 'branchreportofficer@gmail.com';

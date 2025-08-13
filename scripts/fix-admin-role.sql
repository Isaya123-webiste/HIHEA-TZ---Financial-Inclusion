-- Fix admin role for the admin user
-- First, let's check what users exist and their roles
SELECT id, email, full_name, role, status FROM profiles WHERE email LIKE '%isayaamos123%';

-- Update the admin user role for isayaamos123@gmail.com
UPDATE profiles 
SET 
  role = 'admin',
  status = 'active',
  updated_at = NOW()
WHERE email = 'isayaamos123@gmail.com';

-- Also check if we need to create the profile
INSERT INTO profiles (id, email, full_name, role, status, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Isaya Amos'),
  'admin',
  'active',
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'isayaamos123@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = au.id
  );

-- Verify the result
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.status
FROM profiles p
WHERE p.email = 'isayaamos123@gmail.com';

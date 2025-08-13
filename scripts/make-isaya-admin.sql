-- Make isayaamos123@gmail.com an admin user
-- First, check if profile exists and update it
UPDATE profiles 
SET 
  role = 'admin',
  status = 'active',
  updated_at = NOW()
WHERE email = 'isayaamos123@gmail.com';

-- If no rows were updated, the profile might not exist
-- Let's also try to find the user by checking auth.users and create profile if needed
DO $$
DECLARE
  user_id_var UUID;
BEGIN
  -- Try to find the user ID from auth.users
  SELECT id INTO user_id_var 
  FROM auth.users 
  WHERE email = 'isayaamos123@gmail.com';
  
  IF user_id_var IS NOT NULL THEN
    -- Insert profile if it doesn't exist
    INSERT INTO profiles (id, email, full_name, role, status, created_at, updated_at)
    VALUES (
      user_id_var,
      'isayaamos123@gmail.com',
      'Isaya Amos',
      'admin',
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) 
    DO UPDATE SET
      role = 'admin',
      status = 'active',
      updated_at = NOW();
      
    RAISE NOTICE 'Admin profile created/updated for user: %', user_id_var;
  ELSE
    RAISE NOTICE 'User with email isayaamos123@gmail.com not found in auth.users';
  END IF;
END $$;

-- Verify the admin user
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.status,
  au.email as auth_email
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.email = 'isayaamos123@gmail.com';

-- Create admin profile for isayaamos123@gmail.com if missing
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Get user from auth.users
  SELECT id, email, raw_user_meta_data
  INTO user_record
  FROM auth.users 
  WHERE email = 'isayaamos123@gmail.com';
  
  IF FOUND THEN
    -- Insert or update profile
    INSERT INTO profiles (
      id, 
      email, 
      full_name, 
      role, 
      status, 
      created_at, 
      updated_at
    )
    VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.raw_user_meta_data->>'full_name', 'Isaya Amos'),
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
      
    RAISE NOTICE 'Admin profile created/updated for: %', user_record.email;
  ELSE
    RAISE NOTICE 'User % not found in auth.users table', 'isayaamos123@gmail.com';
  END IF;
END $$;

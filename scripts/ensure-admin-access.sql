-- Ensure isayaamos123@gmail.com has admin access
-- First check if user exists in auth.users
DO $$
DECLARE
    admin_user_id UUID;
    auth_user_record RECORD;
BEGIN
    -- Get user from auth.users
    SELECT id, email, raw_user_meta_data
    INTO auth_user_record
    FROM auth.users 
    WHERE email = 'isayaamos123@gmail.com';
    
    IF FOUND THEN
        admin_user_id := auth_user_record.id;
        
        -- Delete any existing profile to start fresh
        DELETE FROM profiles WHERE id = admin_user_id;
        
        -- Insert new admin profile
        INSERT INTO profiles (
            id,
            email,
            full_name,
            role,
            status,
            created_at,
            updated_at
        ) VALUES (
            admin_user_id,
            'isayaamos123@gmail.com',
            'Isaya Amos',
            'admin',
            'active',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Admin profile created for: % with ID: %', 'isayaamos123@gmail.com', admin_user_id;
    ELSE
        RAISE NOTICE 'User % not found in auth.users. Please register first.', 'isayaamos123@gmail.com';
    END IF;
END $$;

-- Verify the admin user
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.status,
    p.created_at
FROM profiles p
WHERE p.email = 'isayaamos123@gmail.com';

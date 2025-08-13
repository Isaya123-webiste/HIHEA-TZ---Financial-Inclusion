-- First, let's check if the admin user exists in auth.users and get their ID
-- You'll need to run this in Supabase SQL editor and note the admin user ID

-- Create admin profile (replace the ID with the actual admin user ID from auth.users)
-- You can find the admin user ID by running: SELECT id, email FROM auth.users WHERE email = 'isayaamos123@gmail.com';

-- For now, let's create a function to automatically create admin profile
CREATE OR REPLACE FUNCTION create_admin_profile()
RETURNS void AS $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get the admin user ID from auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'isayaamos123@gmail.com';
    
    -- If admin user exists, create/update their profile
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO profiles (id, email, full_name, role, status, created_at, updated_at)
        VALUES (
            admin_user_id,
            'isayaamos123@gmail.com',
            'Isaya Administrator',
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
            
        RAISE NOTICE 'Admin profile created/updated for user ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user not found in auth.users. Please create the user first.';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT create_admin_profile();

-- Clean up the function
DROP FUNCTION create_admin_profile();

-- Reset admin password
-- Run this script to update the admin password

DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Find the admin user
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@hihfinancial.com'
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Update the password in auth.users (you'll need to hash this)
        -- This is just to show the user ID
        RAISE NOTICE 'Admin user found with ID: %', admin_user_id;
        RAISE NOTICE 'Use Supabase Dashboard to reset password for this user';
    ELSE
        RAISE NOTICE 'Admin user not found. You may need to create one first.';
    END IF;
END $$;

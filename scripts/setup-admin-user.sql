-- This script should be run after you create your first user through Supabase Auth
-- Replace 'your-email@example.com' with your actual email

-- First, find your user ID (replace with your actual email)
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Get the user ID for your email (replace with your actual email)
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = 'admin@hihfinancial.com'  -- Replace with your email
    LIMIT 1;
    
    IF user_id IS NOT NULL THEN
        -- Update the profile to make this user an admin
        UPDATE public.profiles 
        SET 
            role = 'admin',
            status = 'active',
            full_name = 'System Administrator'
        WHERE id = user_id;
        
        RAISE NOTICE 'Admin user setup complete for user ID: %', user_id;
    ELSE
        RAISE NOTICE 'User not found. Please create a user account first through the registration page.';
    END IF;
END $$;

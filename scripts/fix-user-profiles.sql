-- Fix existing users without profiles
-- This script will create profiles for users who don't have them

-- First, let's see if there are any auth users without profiles
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Loop through auth.users who don't have profiles
    FOR user_record IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN profiles p ON au.id = p.id
        WHERE p.id IS NULL
    LOOP
        -- Insert profile for each user without one
        INSERT INTO profiles (
            id, 
            email, 
            full_name, 
            role, 
            status,
            created_at,
            updated_at
        ) VALUES (
            user_record.id,
            user_record.email,
            COALESCE(
                user_record.raw_user_meta_data->>'full_name',
                split_part(user_record.email, '@', 1)
            ),
            'program_officer', -- Default role
            'active',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created profile for user: %', user_record.email;
    END LOOP;
END $$;

-- Update any profiles that might have NULL roles
UPDATE profiles 
SET role = 'program_officer', status = 'active', updated_at = NOW()
WHERE role IS NULL OR status IS NULL;

-- Show all profiles
SELECT id, email, full_name, role, status FROM profiles ORDER BY created_at;

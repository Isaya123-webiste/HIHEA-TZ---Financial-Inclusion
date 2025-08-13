-- Create an admin user (run this after setting up auth)
-- Replace with your actual admin email and details

DO $$
DECLARE
    admin_email TEXT := 'admin@hihfinancial.com';
    admin_name TEXT := 'System Administrator';
    branch_id UUID;
BEGIN
    -- Get the main branch ID
    SELECT id INTO branch_id FROM branches WHERE name = 'Main Branch' LIMIT 1;
    
    -- Insert admin profile if it doesn't exist
    -- Note: You'll need to create the auth user first through Supabase Auth
    -- This just ensures the profile exists with admin role
    
    INSERT INTO profiles (
        id, 
        full_name, 
        email, 
        role, 
        branch_id, 
        status,
        invitation_status
    ) 
    SELECT 
        auth.uid(),
        admin_name,
        admin_email,
        'admin',
        branch_id,
        'active',
        'completed'
    WHERE NOT EXISTS (
        SELECT 1 FROM profiles WHERE email = admin_email
    );
    
    RAISE NOTICE 'Admin profile setup completed for %', admin_email;
END $$;

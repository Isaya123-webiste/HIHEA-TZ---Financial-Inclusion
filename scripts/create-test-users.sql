-- Create test users with different roles for testing
-- Note: You'll need to create these users in Supabase Auth first, then run this script

-- Update existing profiles or create new ones for testing
-- Replace these emails with actual test user emails you create

-- Admin user
INSERT INTO profiles (id, email, full_name, role, status, created_at, updated_at)
VALUES (
    gen_random_uuid(), -- Replace with actual user ID from auth.users
    'admin@hih.com',
    'Admin User',
    'admin',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    status = 'active',
    updated_at = NOW();

-- Branch Manager user
INSERT INTO profiles (id, email, full_name, role, status, created_at, updated_at)
VALUES (
    gen_random_uuid(), -- Replace with actual user ID from auth.users
    'manager@hih.com',
    'Branch Manager',
    'branch_manager',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'branch_manager',
    status = 'active',
    updated_at = NOW();

-- Program Officer user
INSERT INTO profiles (id, email, full_name, role, status, created_at, updated_at)
VALUES (
    gen_random_uuid(), -- Replace with actual user ID from auth.users
    'officer@hih.com',
    'Program Officer',
    'program_officer',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'program_officer',
    status = 'active',
    updated_at = NOW();

-- Report Officer user
INSERT INTO profiles (id, email, full_name, role, status, created_at, updated_at)
VALUES (
    gen_random_uuid(), -- Replace with actual user ID from auth.users
    'report@hih.com',
    'Report Officer',
    'branch_report_officer',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'branch_report_officer',
    status = 'active',
    updated_at = NOW();

-- Show all profiles
SELECT email, full_name, role, status FROM profiles ORDER BY role;

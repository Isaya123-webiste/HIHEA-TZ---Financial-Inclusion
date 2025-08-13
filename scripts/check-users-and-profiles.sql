-- Check all users in auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- Check all profiles
SELECT 
    id,
    email,
    full_name,
    role,
    status,
    created_at
FROM profiles
ORDER BY created_at DESC;

-- Check which auth users don't have profiles
SELECT 
    u.id,
    u.email,
    u.created_at as auth_created,
    p.id as profile_id,
    p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Check the specific admin user
SELECT 
    u.id as auth_id,
    u.email as auth_email,
    p.id as profile_id,
    p.email as profile_email,
    p.role,
    p.status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'isayaamos123@gmail.com';

-- Comprehensive Database Schema Verification
-- This script checks all tables, indexes, policies, and functions

-- 1. Check all tables in the public schema
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Check table structures and column details
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    c.character_maximum_length
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- 3. Check foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 4. Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Check triggers
SELECT 
    trigger_schema,
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 7. Check functions
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 8. Check table row counts
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 9. Check specific tables we expect to exist
DO $$
DECLARE
    expected_tables text[] := ARRAY[
        'branches',
        'profiles', 
        'user_management',
        'form_submissions',
        'notifications',
        'form_schemas',
        'form_instances',
        'form_field_interactions',
        'form_submission_audit',
        'form_templates'
    ];
    table_name text;
    table_exists boolean;
BEGIN
    RAISE NOTICE '=== CHECKING EXPECTED TABLES ===';
    
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) INTO table_exists;
        
        IF table_exists THEN
            RAISE NOTICE '✓ Table "%" exists', table_name;
        ELSE
            RAISE NOTICE '✗ Table "%" is MISSING', table_name;
        END IF;
    END LOOP;
END $$;

-- 10. Check for any missing critical columns
DO $$
DECLARE
    missing_columns text := '';
BEGIN
    RAISE NOTICE '=== CHECKING CRITICAL COLUMNS ===';
    
    -- Check branches table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'id') THEN
        missing_columns := missing_columns || 'branches.id, ';
    END IF;
    
    -- Check profiles table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        missing_columns := missing_columns || 'profiles.role, ';
    END IF;
    
    -- Check form_submissions table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'form_submissions' AND column_name = 'status') THEN
        missing_columns := missing_columns || 'form_submissions.status, ';
    END IF;
    
    -- Check notifications table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') THEN
        missing_columns := missing_columns || 'notifications.user_id, ';
    END IF;
    
    IF missing_columns = '' THEN
        RAISE NOTICE '✓ All critical columns exist';
    ELSE
        RAISE NOTICE '✗ Missing columns: %', rtrim(missing_columns, ', ');
    END IF;
END $$;

-- 11. Test basic functionality
DO $$
DECLARE
    branch_count integer;
    profile_count integer;
    form_count integer;
    notification_count integer;
BEGIN
    RAISE NOTICE '=== TESTING BASIC FUNCTIONALITY ===';
    
    -- Test branches table
    BEGIN
        SELECT COUNT(*) INTO branch_count FROM branches;
        RAISE NOTICE '✓ Branches table accessible - % rows', branch_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Error accessing branches table: %', SQLERRM;
    END;
    
    -- Test profiles table
    BEGIN
        SELECT COUNT(*) INTO profile_count FROM profiles;
        RAISE NOTICE '✓ Profiles table accessible - % rows', profile_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Error accessing profiles table: %', SQLERRM;
    END;
    
    -- Test form_submissions table
    BEGIN
        SELECT COUNT(*) INTO form_count FROM form_submissions;
        RAISE NOTICE '✓ Form submissions table accessible - % rows', form_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Error accessing form_submissions table: %', SQLERRM;
    END;
    
    -- Test notifications table
    BEGIN
        SELECT COUNT(*) INTO notification_count FROM notifications;
        RAISE NOTICE '✓ Notifications table accessible - % rows', notification_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Error accessing notifications table: %', SQLERRM;
    END;
END $$;

-- 12. Check auth.users table (from Supabase)
DO $$
DECLARE
    user_count integer;
BEGIN
    RAISE NOTICE '=== CHECKING AUTH INTEGRATION ===';
    
    BEGIN
        SELECT COUNT(*) INTO user_count FROM auth.users;
        RAISE NOTICE '✓ Auth users table accessible - % users', user_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✗ Error accessing auth.users table: %', SQLERRM;
    END;
END $$;

-- 13. Final summary
SELECT 
    'Database Schema Verification Complete' as status,
    NOW() as checked_at,
    current_database() as database_name,
    current_user as current_user;

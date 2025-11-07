-- Verify branch_reports table structure

-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'branch_reports'
) as table_exists;

-- Show all columns
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'branch_reports'
ORDER BY ordinal_position;

-- Check for aggregated_form_ids column specifically
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'branch_reports'
AND column_name = 'aggregated_form_ids';

-- Count existing reports
SELECT 
    COUNT(*) as total_reports,
    COUNT(aggregated_form_ids) as reports_with_form_ids,
    SUM(total_approved_forms) as total_aggregated_forms
FROM branch_reports;

-- Show sample data
SELECT 
    id,
    branch_id,
    total_approved_forms,
    CARDINALITY(aggregated_form_ids) as form_count,
    created_at,
    updated_at
FROM branch_reports
LIMIT 5;

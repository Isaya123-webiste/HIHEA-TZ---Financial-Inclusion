-- Verify that the branch report data fix worked correctly
-- This script checks for any remaining concatenated values

-- Check for remaining semicolons in numeric fields
SELECT 
    'trust_erosion' as field_name,
    COUNT(*) as records_with_semicolons,
    array_agg(id) as affected_ids
FROM branch_reports 
WHERE trust_erosion LIKE '%;%'

UNION ALL

SELECT 
    'documentation_delay' as field_name,
    COUNT(*) as records_with_semicolons,
    array_agg(id) as affected_ids
FROM branch_reports 
WHERE documentation_delay LIKE '%;%'

UNION ALL

SELECT 
    'loan_cost_high' as field_name,
    COUNT(*) as records_with_semicolons,
    array_agg(id) as affected_ids
FROM branch_reports 
WHERE loan_cost_high LIKE '%;%';

-- Show sample of current data
SELECT 
    id,
    trust_erosion,
    documentation_delay,
    loan_cost_high,
    explain_barriers,
    created_at
FROM branch_reports
ORDER BY created_at DESC
LIMIT 5;

-- Show statistics
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN trust_erosion IS NOT NULL THEN 1 END) as trust_erosion_filled,
    COUNT(CASE WHEN documentation_delay IS NOT NULL THEN 1 END) as documentation_delay_filled,
    COUNT(CASE WHEN loan_cost_high IS NOT NULL THEN 1 END) as loan_cost_high_filled,
    COUNT(CASE WHEN explain_barriers IS NOT NULL THEN 1 END) as explain_barriers_filled
FROM branch_reports;

-- Check for any non-numeric values in numeric fields (excluding NULL and empty)
SELECT 
    id,
    trust_erosion,
    documentation_delay,
    loan_cost_high
FROM branch_reports
WHERE 
    (trust_erosion IS NOT NULL AND trust_erosion != '' AND trust_erosion !~ '^[0-9]+\.?[0-9]*$')
    OR (documentation_delay IS NOT NULL AND documentation_delay != '' AND documentation_delay !~ '^[0-9]+\.?[0-9]*$')
    OR (loan_cost_high IS NOT NULL AND loan_cost_high != '' AND loan_cost_high !~ '^[0-9]+\.?[0-9]*$');

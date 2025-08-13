-- First, let's see what branches exist
SELECT id, name FROM branches ORDER BY name;

-- Check current user profiles and their branch assignments
SELECT 
    id,
    full_name,
    email,
    role,
    branch_id,
    status
FROM profiles 
ORDER BY role, full_name;

-- Update users to have matching branch_ids for Arusha branch
-- First, get the Arusha branch ID
WITH arusha_branch AS (
    SELECT id as branch_id FROM branches WHERE name ILIKE '%arusha%' LIMIT 1
)
UPDATE profiles 
SET branch_id = (SELECT branch_id FROM arusha_branch)
WHERE role IN ('branch_manager', 'branch_report_officer', 'program_officer')
AND (branch_id IS NULL OR branch_id != (SELECT branch_id FROM arusha_branch));

-- Verify the updates
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.branch_id,
    b.name as branch_name,
    p.status
FROM profiles p
LEFT JOIN branches b ON p.branch_id = b.id
WHERE p.role IN ('branch_manager', 'branch_report_officer', 'program_officer')
ORDER BY p.role, p.full_name;

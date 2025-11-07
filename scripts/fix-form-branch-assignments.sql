-- First, let's ensure all form submissions have proper branch_id assignments
-- Update form submissions to match the user's branch_id if branch_id is null

UPDATE form_submissions fs
SET branch_id = p.branch_id,
    updated_at = NOW()
FROM profiles p
WHERE fs.user_id = p.id
  AND fs.branch_id IS NULL
  AND p.branch_id IS NOT NULL;

-- Ensure all branch report officers have branch assignments
-- If branchreportofficer@gmail.com doesn't have a branch, assign them to Arusha
-- Ensure Arusha branch exists
INSERT INTO branches (id, name, location, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Arusha',
    'Arusha, Tanzania',
    NOW(),
    NOW()
)
ON CONFLICT (name) DO UPDATE
SET updated_at = NOW();

-- Get Arusha branch ID
DO $$
DECLARE
    arusha_branch_id UUID;
BEGIN
    SELECT id INTO arusha_branch_id FROM branches WHERE name = 'Arusha' LIMIT 1;
    
    -- Update branchreportofficer@gmail.com to be in Arusha branch
    UPDATE profiles
    SET branch_id = arusha_branch_id
    WHERE email = 'branchreportofficer@gmail.com';
    
    -- Update programofficer@gmail.com to be in Arusha branch  
    UPDATE profiles
    SET branch_id = arusha_branch_id
    WHERE email = 'programofficer@gmail.com';
    
    -- Update all forms created by Branch Report Officers to have their branch_id
    UPDATE form_submissions fs
    SET branch_id = p.branch_id
    FROM profiles p
    WHERE fs.user_id = p.id
    AND fs.branch_id IS NULL;
    
    RAISE NOTICE 'Updated forms and profiles to Arusha branch';
END $$;

-- Ensure program officers have branch assignments too
UPDATE profiles 
SET branch_id = (SELECT id FROM branches WHERE name = 'Arusha' LIMIT 1)
WHERE role = 'program_officer' 
AND email ILIKE '%arusha%'
AND (branch_id IS NULL OR branch_id NOT IN (SELECT id FROM branches));

-- Verify the updates
SELECT 
    p.email,
    p.role,
    b.name as branch_name,
    COUNT(fs.id) as form_count
FROM profiles p
LEFT JOIN branches b ON p.branch_id = b.id
LEFT JOIN form_submissions fs ON fs.user_id = p.id
WHERE p.email IN ('branchreportofficer@gmail.com', 'programofficer@gmail.com')
GROUP BY p.email, p.role, b.name;

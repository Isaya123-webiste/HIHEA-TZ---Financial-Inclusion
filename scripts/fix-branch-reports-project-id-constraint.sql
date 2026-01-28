-- Fix branch_reports to ensure project_id is properly considered for uniqueness
-- This ensures new rows are created for different project_id + branch_id combinations

-- 1. Verify branch_reports table structure
ALTER TABLE branch_reports 
ADD CONSTRAINT branch_reports_project_branch_unique 
UNIQUE NULLS NOT DISTINCT (branch_id, project_id) 
ON CONFLICT DO NOTHING;

-- 2. Create index for faster lookups on (branch_id, project_id)
CREATE INDEX IF NOT EXISTS idx_branch_reports_branch_project 
ON branch_reports(branch_id, project_id);

-- 3. Ensure existing NULL project_id entries are distinct
-- Update any existing branch reports without project_id to ensure they're separate
-- This is a data cleanup step
UPDATE branch_reports 
SET project_id = NULL 
WHERE project_id IS NOT NULL 
AND project_id = '';

-- 4. Verify the constraint is working
SELECT branch_id, project_id, COUNT(*) as count 
FROM branch_reports 
GROUP BY branch_id, project_id 
HAVING COUNT(*) > 1;

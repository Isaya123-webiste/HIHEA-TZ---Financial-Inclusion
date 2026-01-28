-- Fix branch_reports to ensure project_id is properly considered for uniqueness
-- This ensures new rows are created for different project_id + branch_id combinations

BEGIN;

-- 1. Drop existing constraint if it exists (to avoid conflicts)
DO $$ BEGIN
  ALTER TABLE branch_reports DROP CONSTRAINT IF EXISTS branch_reports_project_branch_unique;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 2. Add unique constraint on (branch_id, project_id) to enforce separate rows per project
-- NULLS NOT DISTINCT allows multiple NULL values (for forms without a project)
ALTER TABLE branch_reports 
ADD CONSTRAINT branch_reports_project_branch_unique 
UNIQUE NULLS NOT DISTINCT (branch_id, project_id);

-- 3. Create index for faster lookups on (branch_id, project_id)
CREATE INDEX IF NOT EXISTS idx_branch_reports_branch_project 
ON branch_reports(branch_id, project_id);

COMMIT;

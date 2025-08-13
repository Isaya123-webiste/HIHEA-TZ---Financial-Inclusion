-- Fix foreign key relationships for form_submissions table
-- First, let's check and fix the foreign key constraints

-- Drop existing foreign key if it exists (in case it's malformed)
ALTER TABLE form_submissions DROP CONSTRAINT IF EXISTS form_submissions_created_by_fkey;
ALTER TABLE form_submissions DROP CONSTRAINT IF EXISTS form_submissions_updated_by_fkey;
ALTER TABLE form_submissions DROP CONSTRAINT IF EXISTS form_submissions_reviewed_by_fkey;

-- Add proper foreign key constraints
ALTER TABLE form_submissions 
ADD CONSTRAINT form_submissions_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE form_submissions 
ADD CONSTRAINT form_submissions_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE form_submissions 
ADD CONSTRAINT form_submissions_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Ensure the profiles table has proper foreign key to auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create a view that joins form_submissions with profiles for easier querying
CREATE OR REPLACE VIEW form_submissions_with_profiles AS
SELECT 
    fs.*,
    p.full_name as creator_name,
    p.role as creator_role,
    p.email as creator_email,
    reviewer.full_name as reviewer_name,
    reviewer.role as reviewer_role
FROM form_submissions fs
LEFT JOIN profiles p ON fs.created_by = p.id
LEFT JOIN profiles reviewer ON fs.reviewed_by = reviewer.id;

-- Grant access to the view
GRANT SELECT ON form_submissions_with_profiles TO authenticated;

-- Create indexes to improve join performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_by ON form_submissions(created_by);
CREATE INDEX IF NOT EXISTS idx_form_submissions_reviewed_by ON form_submissions(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

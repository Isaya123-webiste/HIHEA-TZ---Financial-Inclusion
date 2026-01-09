-- Add branch_id column to projects table if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id);

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_branch_id ON projects(branch_id);

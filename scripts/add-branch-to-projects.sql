-- Add branch_id column to projects table
ALTER TABLE projects ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE RESTRICT;

-- Create index for better query performance
CREATE INDEX idx_projects_branch_id ON projects(branch_id);

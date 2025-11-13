-- Allow NULL values for optional branch fields
-- This fixes the branch creation issue where only name and status are required

ALTER TABLE branches 
  ALTER COLUMN address DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL,
  ALTER COLUMN state DROP NOT NULL,
  ALTER COLUMN postal_code DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL,
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN manager_name DROP NOT NULL;

-- Verify the changes
COMMENT ON TABLE branches IS 'Branches table with optional address fields - only name and status are required';

-- Make all optional branch fields nullable
-- This allows branches to be created with only name and status

ALTER TABLE branches 
  ALTER COLUMN address DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL,
  ALTER COLUMN state DROP NOT NULL,
  ALTER COLUMN postal_code DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL,
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN manager_name DROP NOT NULL;

-- Add comment
COMMENT ON TABLE branches IS 'Branches table - only name and status are required';

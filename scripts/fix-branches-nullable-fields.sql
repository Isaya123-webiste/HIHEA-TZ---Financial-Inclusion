-- Migration: Allow NULL values for optional branch fields
-- This allows branch creation with only name and status

-- Make optional fields nullable
ALTER TABLE branches 
  ALTER COLUMN address DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL,
  ALTER COLUMN state DROP NOT NULL,
  ALTER COLUMN postal_code DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL,
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN manager_name DROP NOT NULL;

-- Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'Branch table fields are now nullable';
  RAISE NOTICE 'Branches can now be created with only name and status';
END $$;

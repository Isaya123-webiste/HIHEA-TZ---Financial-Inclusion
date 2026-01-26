-- Migration script to convert loan_uses field from TEXT to NUMERIC
-- This script:
-- 1. Migrates loan_uses from text to numeric (INTEGER) in form_submissions and branch_reports tables
-- 2. Clears existing data and sets default to 0 (fresh start)
-- 3. Makes the field required (NOT NULL)

BEGIN;

-- Step 1: Update form_submissions table
DO $$ BEGIN
  ALTER TABLE form_submissions 
  ADD COLUMN loan_uses_numeric INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN
  NULL;
END $$;

-- Update new column with default value (fresh start with 0)
UPDATE form_submissions SET loan_uses_numeric = 0 WHERE loan_uses_numeric IS NULL;

-- Drop old text column if it exists
DO $$ BEGIN
  ALTER TABLE form_submissions DROP COLUMN loan_uses;
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

-- Rename numeric column to loan_uses
DO $$ BEGIN
  ALTER TABLE form_submissions RENAME COLUMN loan_uses_numeric TO loan_uses;
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

-- Add NOT NULL constraint
DO $$ BEGIN
  ALTER TABLE form_submissions ALTER COLUMN loan_uses SET NOT NULL;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- Step 2: Update branch_reports table
DO $$ BEGIN
  ALTER TABLE branch_reports 
  ADD COLUMN loan_uses_numeric INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN
  NULL;
END $$;

-- Update new column with default value (fresh start with 0)
UPDATE branch_reports SET loan_uses_numeric = 0 WHERE loan_uses_numeric IS NULL;

-- Drop old text column if it exists
DO $$ BEGIN
  ALTER TABLE branch_reports DROP COLUMN loan_uses;
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

-- Rename numeric column to loan_uses
DO $$ BEGIN
  ALTER TABLE branch_reports RENAME COLUMN loan_uses_numeric TO loan_uses;
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

-- Add NOT NULL constraint
DO $$ BEGIN
  ALTER TABLE branch_reports ALTER COLUMN loan_uses SET NOT NULL;
EXCEPTION WHEN others THEN
  NULL;
END $$;

COMMIT;

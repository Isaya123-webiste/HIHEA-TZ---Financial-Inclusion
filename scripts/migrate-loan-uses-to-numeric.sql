-- Migration script to convert loan_uses field from TEXT to NUMERIC
-- This script:
-- 1. Migrates loan_uses from text to numeric (INTEGER) across all relevant tables
-- 2. Clears existing data and sets default to 0
-- 3. Makes the field required (NOT NULL)

BEGIN;

-- Step 1: Update form_submissions table
-- Check if column exists and is text type, then convert
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

-- Add NOT NULL constraint if not already there
DO $$ BEGIN
  ALTER TABLE form_submissions ALTER COLUMN loan_uses SET NOT NULL;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- Step 2: Update branch_reports table (if it has loan_uses)
DO $$ BEGIN
  ALTER TABLE branch_reports ADD COLUMN loan_uses_numeric INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN
  NULL;
END $$;

UPDATE branch_reports SET loan_uses_numeric = 0 WHERE loan_uses_numeric IS NULL;

DO $$ BEGIN
  ALTER TABLE branch_reports DROP COLUMN loan_uses;
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE branch_reports RENAME COLUMN loan_uses_numeric TO loan_uses;
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE branch_reports ALTER COLUMN loan_uses SET NOT NULL;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- Step 3: Update access_data table (if it has loan_uses)
DO $$ BEGIN
  ALTER TABLE access_data ADD COLUMN loan_uses_numeric INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN
  NULL;
END $$;

UPDATE access_data SET loan_uses_numeric = 0 WHERE loan_uses_numeric IS NULL;

DO $$ BEGIN
  ALTER TABLE access_data DROP COLUMN loan_uses;
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE access_data RENAME COLUMN loan_uses_numeric TO loan_uses;
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE access_data ALTER COLUMN loan_uses SET NOT NULL;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- Step 4: Update usage_data table (if it has loan_uses)
DO $$ BEGIN
  ALTER TABLE usage_data ADD COLUMN loan_uses_numeric INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN
  NULL;
END $$;

UPDATE usage_data SET loan_uses_numeric = 0 WHERE loan_uses_numeric IS NULL;

DO $$ BEGIN
  ALTER TABLE usage_data DROP COLUMN loan_uses;
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE usage_data RENAME COLUMN loan_uses_numeric TO loan_uses;
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE usage_data ALTER COLUMN loan_uses SET NOT NULL;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- Step 5: Update barriers table (if it has loan_uses)
DO $$ BEGIN
  ALTER TABLE barriers ADD COLUMN loan_uses_numeric INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN
  NULL;
END $$;

UPDATE barriers SET loan_uses_numeric = 0 WHERE loan_uses_numeric IS NULL;

DO $$ BEGIN
  ALTER TABLE barriers DROP COLUMN loan_uses;
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE barriers RENAME COLUMN loan_uses_numeric TO loan_uses;
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE barriers ALTER COLUMN loan_uses SET NOT NULL;
EXCEPTION WHEN others THEN
  NULL;
END $$;

COMMIT;

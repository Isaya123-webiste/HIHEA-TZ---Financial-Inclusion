-- Migration script to convert loan_uses field from TEXT to NUMERIC
-- This script:
-- 1. Migrates loan_uses from text to numeric (INTEGER) across all relevant tables
-- 2. Clears existing data and sets default to 0
-- 3. Makes the field required (NOT NULL)

BEGIN;

-- Step 1: Update form_submissions table
-- Add new numeric column
ALTER TABLE form_submissions 
ADD COLUMN loan_uses_numeric INTEGER DEFAULT 0;

-- Update new column with default value (fresh start with 0)
UPDATE form_submissions SET loan_uses_numeric = 0;

-- Drop old text column
ALTER TABLE form_submissions 
DROP COLUMN loan_uses;

-- Rename numeric column to loan_uses
ALTER TABLE form_submissions 
RENAME COLUMN loan_uses_numeric TO loan_uses;

-- Add NOT NULL constraint
ALTER TABLE form_submissions 
ALTER COLUMN loan_uses SET NOT NULL;

-- Step 2: Update branch_reports table (if it has loan_uses)
ALTER TABLE branch_reports 
ADD COLUMN loan_uses_numeric INTEGER DEFAULT 0;

UPDATE branch_reports SET loan_uses_numeric = 0;

ALTER TABLE branch_reports 
DROP COLUMN IF EXISTS loan_uses;

ALTER TABLE branch_reports 
RENAME COLUMN loan_uses_numeric TO loan_uses;

ALTER TABLE branch_reports 
ALTER COLUMN loan_uses SET NOT NULL;

-- Step 3: Update access_data table (if it has loan_uses)
ALTER TABLE access_data 
ADD COLUMN loan_uses_numeric INTEGER DEFAULT 0;

UPDATE access_data SET loan_uses_numeric = 0;

ALTER TABLE access_data 
DROP COLUMN IF EXISTS loan_uses;

ALTER TABLE access_data 
RENAME COLUMN loan_uses_numeric TO loan_uses;

ALTER TABLE access_data 
ALTER COLUMN loan_uses SET NOT NULL;

-- Step 4: Update usage_data table (if it has loan_uses)
ALTER TABLE usage_data 
ADD COLUMN loan_uses_numeric INTEGER DEFAULT 0;

UPDATE usage_data SET loan_uses_numeric = 0;

ALTER TABLE usage_data 
DROP COLUMN IF EXISTS loan_uses;

ALTER TABLE usage_data 
RENAME COLUMN loan_uses_numeric TO loan_uses;

ALTER TABLE usage_data 
ALTER COLUMN loan_uses SET NOT NULL;

-- Step 5: Update barriers table (if it has loan_uses)
ALTER TABLE barriers 
ADD COLUMN loan_uses_numeric INTEGER DEFAULT 0;

UPDATE barriers SET loan_uses_numeric = 0;

ALTER TABLE barriers 
DROP COLUMN IF EXISTS loan_uses;

ALTER TABLE barriers 
RENAME COLUMN loan_uses_numeric TO loan_uses;

ALTER TABLE barriers 
ALTER COLUMN loan_uses SET NOT NULL;

COMMIT;

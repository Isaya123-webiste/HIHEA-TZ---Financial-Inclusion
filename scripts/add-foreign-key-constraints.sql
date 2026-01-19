-- Add foreign key constraints to establish relationships between tables
-- This script safely adds constraints only if they don't already exist

BEGIN;

-- For branch_reports table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_branch_reports_project_id') THEN
    ALTER TABLE branch_reports
    ADD CONSTRAINT fk_branch_reports_project_id 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_branch_reports_branch_id') THEN
    ALTER TABLE branch_reports
    ADD CONSTRAINT fk_branch_reports_branch_id 
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- For form_submissions table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_form_submissions_project_id') THEN
    ALTER TABLE form_submissions
    ADD CONSTRAINT fk_form_submissions_project_id 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_form_submissions_branch_id') THEN
    ALTER TABLE form_submissions
    ADD CONSTRAINT fk_form_submissions_branch_id 
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- For Usage table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_usage_project_id') THEN
    ALTER TABLE "Usage"
    ADD CONSTRAINT fk_usage_project_id 
    FOREIGN KEY ("Project ID") REFERENCES projects(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_usage_branch_id') THEN
    ALTER TABLE "Usage"
    ADD CONSTRAINT fk_usage_branch_id 
    FOREIGN KEY ("Branch ID") REFERENCES branches(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- For Access table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_access_project_id') THEN
    ALTER TABLE "Access"
    ADD CONSTRAINT fk_access_project_id 
    FOREIGN KEY ("Project ID") REFERENCES projects(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_access_branch_id') THEN
    ALTER TABLE "Access"
    ADD CONSTRAINT fk_access_branch_id 
    FOREIGN KEY ("Branch ID") REFERENCES branches(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- For projects table - link to branches
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_projects_branch_id') THEN
    ALTER TABLE projects
    ADD CONSTRAINT fk_projects_branch_id 
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- For forms table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_forms_branch_id') THEN
    ALTER TABLE forms
    ADD CONSTRAINT fk_forms_branch_id 
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- For form_reviews table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_form_reviews_form_id') THEN
    ALTER TABLE form_reviews
    ADD CONSTRAINT fk_form_reviews_form_id 
    FOREIGN KEY (form_id) REFERENCES form_submissions(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;

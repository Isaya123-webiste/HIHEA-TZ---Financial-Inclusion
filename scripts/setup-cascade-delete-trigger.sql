-- Create a trigger to cascade delete related data when branch_reports is deleted
CREATE OR REPLACE FUNCTION delete_branch_report_cascade()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all form_submissions records for the deleted branch_report
  DELETE FROM form_submissions
  WHERE branch_id = OLD.branch_id
    AND project_id = OLD.project_id;
  
  -- Delete all Access records for the deleted branch_report
  DELETE FROM "Access"
  WHERE "Branch ID" = OLD.branch_id
    AND "Project ID" = OLD.project_id;
  
  -- Delete all Usage records for the deleted branch_report
  DELETE FROM "Usage"
  WHERE "Branch ID" = OLD.branch_id
    AND "Project ID" = OLD.project_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS branch_report_delete_cascade ON branch_reports;

-- Create the trigger to fire BEFORE DELETE on branch_reports
CREATE TRIGGER branch_report_delete_cascade
BEFORE DELETE ON branch_reports
FOR EACH ROW
EXECUTE FUNCTION delete_branch_report_cascade();

COMMIT;

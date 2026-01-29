-- Verify all 3 approved forms are now in branch_reports
SELECT COUNT(*) as total_branch_reports FROM branch_reports;

-- Show the 3 forms by branch_id and project_id
SELECT branch_id, project_id, title, status, created_at 
FROM branch_reports 
ORDER BY created_at DESC 
LIMIT 5;

-- Verify approved forms in form_submissions
SELECT COUNT(*) as total_approved_forms FROM form_submissions WHERE status = 'approved';

-- Compare: forms should now flow from form_submissions to branch_reports
SELECT 
  (SELECT COUNT(*) FROM form_submissions WHERE status = 'approved') as approved_forms_in_form_submissions,
  (SELECT COUNT(*) FROM branch_reports WHERE status = 'active') as active_branch_reports;

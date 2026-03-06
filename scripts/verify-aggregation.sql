-- Verify if forms are already in branch_reports

SELECT 
  br.branch_id,
  br.project_id,
  COUNT(*) as count
FROM branch_reports br
GROUP BY br.branch_id, br.project_id
ORDER BY br.branch_id;

-- Count approved forms
SELECT COUNT(*) as approved_forms_count FROM form_submissions WHERE status = 'approved';

-- Count branch reports  
SELECT COUNT(*) as branch_reports_count FROM branch_reports;

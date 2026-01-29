-- Verify that branch_reports have actual data populated
SELECT 
  branch_id,
  project_id,
  num_mfis,
  members_bank_account,
  loan_amount_applied,
  loan_default,
  trust_erosion,
  documentation_delay,
  updated_at
FROM branch_reports
WHERE status = 'active'
ORDER BY updated_at DESC;

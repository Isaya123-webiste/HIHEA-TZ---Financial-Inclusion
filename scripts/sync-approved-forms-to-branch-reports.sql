-- Sync all approved forms from form_submissions to branch_reports
-- This handles forms that were approved before the aggregation feature was added

-- First, let's check how many approved forms need syncing
SELECT COUNT(*) as approved_forms_count 
FROM form_submissions 
WHERE status = 'approved' 
AND id NOT IN (SELECT DISTINCT form_submission_id FROM branch_reports WHERE form_submission_id IS NOT NULL);

-- Insert or update branch_reports for each approved form
INSERT INTO branch_reports (
  form_submission_id,
  branch_id,
  project_id,
  group_name,
  location,
  credit_sources,
  num_mfis,
  groups_bank_account,
  members_bank_account,
  inactive_accounts,
  num_insurers,
  members_insurance,
  borrowed_groups,
  members_applying_loans,
  loan_amount_applied,
  date_loan_applied,
  loan_amount_approved,
  members_received_loans,
  date_loan_received,
  members_complaining_delay,
  loan_uses,
  loan_default,
  loan_delinquency,
  loan_dropout,
  money_fraud,
  trust_erosion,
  documentation_delay,
  loan_cost_high,
  number_of_groups,
  members_at_start,
  members_at_end,
  bros_at_start,
  bros_at_end,
  created_at,
  updated_at
)
SELECT
  fs.id,
  fs.branch_id,
  fs.project_id,
  fs.group_name,
  fs.location,
  fs.credit_sources,
  fs.num_mfis,
  fs.groups_bank_account,
  fs.members_bank_account,
  fs.inactive_accounts,
  fs.num_insurers,
  fs.members_insurance,
  fs.borrowed_groups,
  fs.members_applying_loans,
  fs.loan_amount_applied,
  fs.date_loan_applied,
  fs.loan_amount_approved,
  fs.members_received_loans,
  fs.date_loan_received,
  fs.members_complaining_delay,
  fs.loan_uses,
  fs.loan_default,
  fs.loan_delinquency,
  fs.loan_dropout,
  fs.money_fraud,
  fs.trust_erosion,
  fs.documentation_delay,
  fs.loan_cost_high,
  fs.number_of_groups,
  fs.members_at_start,
  fs.members_at_end,
  fs.bros_at_start,
  fs.bros_at_end,
  fs.created_at,
  NOW()
FROM form_submissions fs
WHERE fs.status = 'approved'
AND fs.id NOT IN (SELECT DISTINCT form_submission_id FROM branch_reports WHERE form_submission_id IS NOT NULL)
ON CONFLICT (form_submission_id) DO UPDATE SET
  updated_at = NOW();

-- Verify the sync
SELECT COUNT(*) as synced_branch_reports FROM branch_reports;
